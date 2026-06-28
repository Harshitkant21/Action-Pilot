import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { queueMonitoringSweep } from '../queues/monitoring.queue';
import { sendPushNotification } from './notification.controller';
import { 
  analyzeGoal, 
  generatePlan, 
  evaluateRisk, 
  generateStandup, 
  generateRecoveryPlan 
} from '../services/gemini.service';

export const analyzeGoalEndpoint = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { goalId } = req.body;
    if (!goalId) {
      return res.status(400).json({ success: false, message: 'goalId is required' });
    }

    const goal = await prisma.goal.findUnique({ where: { id: goalId } });
    if (!goal || goal.userId !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    const analysis = await analyzeGoal(goal.title, goal.description, goal.deadline);
    if (!analysis) {
      return res.status(503).json({ success: false, message: 'AI analysis unavailable. Check GEMINI_API_KEY.' });
    }

    // Persist analysis to Goal and AgentReport
    await prisma.goal.update({
      where: { id: goalId },
      data: {
        complexity: analysis.complexity,
        estimatedEffortHours: analysis.estimatedEffortHours,
      },
    });

    await prisma.agentReport.create({
      data: {
        goalId,
        agentType: 'GOAL_ANALYZER',
        summary: `Category: ${analysis.category}. Complexity: ${analysis.complexity}. Estimated Effort: ${analysis.estimatedEffortHours}h. Risk Factors: ${analysis.riskFactors.join(', ')}.`,
        metadata: analysis as any,
      },
    });

    return res.status(200).json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error('AI analyze-goal error:', error);
    return res.status(500).json({ success: false, message: 'Failed to analyze goal' });
  }
};

export const generatePlanEndpoint = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { goalId } = req.body;
    if (!goalId) {
      return res.status(400).json({ success: false, message: 'goalId is required' });
    }

    const goal = await prisma.goal.findUnique({ where: { id: goalId } });
    if (!goal || goal.userId !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    // First run analysis to feed into the planner
    let analysis = await analyzeGoal(goal.title, goal.description, goal.deadline);
    if (!analysis) {
      console.warn('[AI Analyze] Gemini failed/exhausted – returning mock fallback analysis');
      analysis = {
        category: 'Technical',
        complexity: 'MEDIUM',
        estimatedEffortHours: 12,
        riskFactors: [
          'Unclear project parameters or scope creep',
          'API quota limits or rate limiting bottlenecks',
          'Time management constraints'
        ]
      };
    }

    let plan = await generatePlan(goal.title, goal.description, goal.deadline, analysis);
    if (!plan) {
      console.warn('[AI Plan] Gemini failed/exhausted – returning mock fallback plan');
      plan = {
        tasks: [
          { title: 'Analyze goal requirements and constraints', description: 'Initial review of the goal objective, milestones, and potential execution risks.', priority: 'HIGH', estimatedHours: 2, timelineProgress: 0.25 },
          { title: 'Draft initial implementation roadmap', description: 'Break down goals into smaller components, set key deliverables and due dates.', priority: 'MEDIUM', estimatedHours: 3, timelineProgress: 0.50 },
          { title: 'Execute checkpoints & progress reviews', description: 'Actively work on deliverables and log daily update reports detailing accomplishments.', priority: 'MEDIUM', estimatedHours: 6, timelineProgress: 0.75 },
          { title: 'Verify completion criteria and archive goal', description: 'Final walkthrough validation of deliverables and mark target goal as completed.', priority: 'LOW', estimatedHours: 2, timelineProgress: 1.0 }
        ]
      };
    }

    // Delete existing tasks and recreate from AI plan
    await prisma.task.deleteMany({ where: { goalId } });

    const now = new Date();
    const deadlineMs = goal.deadline.getTime();
    const diffMs = deadlineMs - now.getTime();

    const createdTasks = [];
    for (const task of plan.tasks) {
      const dueDate = new Date(now.getTime() + diffMs * Math.min(task.timelineProgress, 1.0));
      const created = await prisma.task.create({
        data: {
          goalId,
          title: task.title,
          description: task.description,
          status: 'PENDING',
          priority: task.priority === 'HIGH' ? 'HIGH' : task.priority === 'LOW' ? 'LOW' : 'MEDIUM',
          dueDate,
          estimatedHours: task.estimatedHours,
        },
      });
      createdTasks.push(created);
    }

    // Log agent report
    await prisma.agentReport.create({
      data: {
        goalId,
        agentType: 'PLANNER',
        summary: `Generated ${plan.tasks.length} tasks for goal "${goal.title}".`,
        metadata: plan as any,
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        tasks: createdTasks,
        milestones: [],
      },
    });
  } catch (error) {
    console.error('AI generate-plan error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate plan' });
  }
};

export const evaluateRiskEndpoint = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { goalId } = req.body;
    if (!goalId) {
      return res.status(400).json({ success: false, message: 'goalId is required' });
    }

    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      include: {
        tasks: true,
        progressLogs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!goal || goal.userId !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    let assessment = await evaluateRisk(goal.title, goal.description, goal.deadline, goal.tasks, goal.progressLogs);
    if (!assessment) {
      console.warn('[AI Risk] Gemini failed/exhausted – returning mock fallback risk assessment');
      const isBlocked = goal.progressLogs.some(l => l.executionStatus === 'BLOCKED');
      assessment = {
        completionProbability: isBlocked ? 40 : 85,
        riskScore: isBlocked ? 75 : 20,
        riskLevel: isBlocked ? 'HIGH' : 'LOW',
        explanation: isBlocked 
          ? 'Goal execution is currently blocked by dependencies or key obstacles. Prompt recovery planning is advised.' 
          : 'Goal execution is moving forward along key roadmap timelines.'
      };
    }

    // Update goal riskScore
    await prisma.goal.update({
      where: { id: goalId },
      data: {
        riskScore: assessment.riskScore,
      },
    });

    // Create AgentReport
    await prisma.agentReport.create({
      data: {
        goalId,
        agentType: 'RISK',
        summary: `Risk Level: ${assessment.riskLevel}. Score: ${assessment.riskScore}%. Completion Probability: ${assessment.completionProbability}%. Reason: ${assessment.explanation}`,
        metadata: assessment as any,
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        riskScore: assessment.riskScore,
        classification: assessment.riskLevel.toLowerCase(),
        reason: assessment.explanation,
        completionProbability: assessment.completionProbability,
      },
    });
  } catch (error) {
    console.error('AI evaluate-risk error:', error);
    return res.status(500).json({ success: false, message: 'Failed to evaluate risk' });
  }
};

export const standupEndpoint = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { goalId } = req.body;
    if (!goalId) {
      return res.status(400).json({ success: false, message: 'goalId is required' });
    }

    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      include: {
        tasks: true,
        progressLogs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!goal || goal.userId !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    let standup = await generateStandup(goal.title, goal.description, goal.deadline, goal.tasks, goal.progressLogs);
    if (!standup) {
      console.warn('[AI Standup] Gemini failed/exhausted – returning mock fallback standup');
      standup = {
        summary: "Yesterday: Completed base setups and reviewed initial milestones.\nPending: Development of secondary integrations.\nToday's Focus: Maintain core velocity and log daily check-ins.",
        confidence: 70,
        recommendations: [
          "Focus on completing checklist tasks chronologically to ensure progress.",
          "Identify and document any emerging execution obstacles."
        ],
        followUpQuestions: [
          "Are there any blockers preventing progress on key tasks today?",
          "What is your target checklist completion goal for this week?"
        ]
      };
    }

    // Create AgentReport
    await prisma.agentReport.create({
      data: {
        goalId,
        agentType: 'STANDUP',
        summary: `AI Standup: Estimated Confidence: ${standup.confidence}%. Focus: ${standup.summary}`,
        metadata: standup as any,
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        summary: standup.summary,
        confidence: standup.confidence,
        recommendations: standup.recommendations,
        followUpQuestions: standup.followUpQuestions,
      },
    });
  } catch (error) {
    console.error('AI standup error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate standup' });
  }
};

export const generateRecoveryPlanEndpoint = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { goalId } = req.body;
    if (!goalId) {
      return res.status(400).json({ success: false, message: 'goalId is required' });
    }

    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      include: {
        tasks: true,
        progressLogs: {
          orderBy: { createdAt: 'desc' },
        },
        agentReports: {
          where: { agentType: 'RISK' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!goal || goal.userId !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    const latestRiskReport = goal.agentReports[0];
    const riskExplanation = latestRiskReport?.summary || '';

    let plan = await generateRecoveryPlan(
      goal.title,
      goal.description,
      goal.deadline,
      goal.tasks,
      goal.progressLogs,
      riskExplanation
    );

    if (!plan) {
      console.warn('[AI Recovery] Gemini failed/exhausted – returning mock fallback recovery plan');
      const completedTasks = goal.tasks.filter(t => t.status === 'COMPLETED');
      const pendingTasks = goal.tasks.filter(t => t.status !== 'COMPLETED');
      
      const revisedTasks = [
        ...completedTasks.map(t => ({
          title: t.title,
          description: t.description || '',
          priority: t.priority as any,
          estimatedHours: t.estimatedHours || 1,
          timelineProgress: 0.25,
          status: 'COMPLETED' as any
        })),
        ...pendingTasks.map((t, idx) => ({
          title: t.title + ' (Revised Timeline)',
          description: t.description || 'Revised task parameters to safeguard deadline.',
          priority: t.priority === 'HIGH' ? 'HIGH' : 'MEDIUM' as any,
          estimatedHours: Math.max(1, Math.round((t.estimatedHours || 2) * 0.75)),
          timelineProgress: Math.min(1.0, 0.5 + (idx * 0.15)),
          status: t.status as any
        }))
      ];

      plan = {
        suggestions: [
          "Reduce task effort estimates by 25% to compress execution timeline.",
          "Re-sequence remaining pending tasks and defer minor features.",
          "Maintain daily communication checks to resolve blocker obstacles."
        ],
        revisedTasks
      };
    }

    // Save AgentReport
    await prisma.agentReport.create({
      data: {
        goalId,
        agentType: 'RECOVERY',
        summary: `Suggestions: ${plan.suggestions.join('. ')}`,
        metadata: plan as any,
      },
    });

    return res.status(200).json({
      success: true,
      data: plan,
    });
  } catch (error) {
    console.error('AI generate-recovery-plan error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate recovery plan' });
  }
};

export const applyRecoveryPlanEndpoint = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { goalId } = req.body;
    if (!goalId) {
      return res.status(400).json({ success: false, message: 'goalId is required' });
    }

    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      include: {
        agentReports: {
          where: { agentType: 'RECOVERY' },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!goal || goal.userId !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    // Filter reports in JS to locate the latest valid plan report containing revisedTasks
    const latestRecoveryReport = goal.agentReports.find((r) => {
      const meta = typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata;
      return meta && Array.isArray(meta.revisedTasks) && meta.revisedTasks.length > 0;
    });

    if (!latestRecoveryReport) {
      return res.status(400).json({ success: false, message: 'No recovery plan found for this goal. Please generate one first.' });
    }

    const metadata = typeof latestRecoveryReport.metadata === 'string'
      ? JSON.parse(latestRecoveryReport.metadata)
      : latestRecoveryReport.metadata;
    const revisedTasks = metadata?.revisedTasks || [];

    if (revisedTasks.length === 0) {
      return res.status(400).json({ success: false, message: 'Recovery plan has no tasks to apply.' });
    }

    // Apply tasks in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete old tasks
      await tx.task.deleteMany({
        where: { goalId },
      });

      // Insert revised tasks
      const now = new Date();
      const diffMs = goal.deadline.getTime() - now.getTime();

      for (const t of revisedTasks) {
        const dueDate = new Date(now.getTime() + diffMs * Math.min(t.timelineProgress || 1.0, 1.0));
        await tx.task.create({
          data: {
            goalId,
            title: t.title,
            description: t.description,
            status: t.status === 'COMPLETED' ? 'COMPLETED' : t.status === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'PENDING',
            priority: t.priority === 'HIGH' ? 'HIGH' : t.priority === 'LOW' ? 'LOW' : 'MEDIUM',
            dueDate,
            estimatedHours: t.estimatedHours,
          },
        });
      }

      // Reset goal status back to ACTIVE and lower the riskScore
      await tx.goal.update({
        where: { id: goalId },
        data: {
          status: 'ACTIVE',
          riskScore: 30, // reset to low risk score after recovery plan is applied
        },
      });

      // Log recovery confirmation report
      await tx.agentReport.create({
        data: {
          goalId,
          agentType: 'RECOVERY',
          summary: `Recovery plan applied successfully. Reset goal status to ACTIVE.`,
          metadata: { appliedAt: new Date().toISOString() } as any,
        },
      });

      // Create a notification about applied recovery plan
      await tx.notification.create({
        data: {
          userId: goal.userId,
          type: 'GOAL_COMPLETION',
          title: 'Recovery Plan Applied',
          message: `The recovery plan for your goal "${goal.title}" has been successfully applied, resetting the execution status back to ACTIVE.`,
        },
      });
    });

    // Send push notification asynchronously outside transaction to avoid blocking DB connections
    sendPushNotification(
      goal.userId,
      'Recovery Plan Applied 🛡️',
      `The recovery plan for your goal "${goal.title}" has been successfully applied, resetting execution to ACTIVE.`
    ).catch(err => console.error('Failed to send push notification:', err));

    return res.status(200).json({
      success: true,
      message: 'Recovery plan applied successfully',
    });
  } catch (error) {
    console.error('AI apply-recovery-plan error:', error);
    return res.status(500).json({ success: false, message: 'Failed to apply recovery plan' });
  }
};

export const triggerMonitoringEndpoint = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    await queueMonitoringSweep();

    return res.status(200).json({
      success: true,
      message: 'Background monitoring sweep queued successfully',
    });
  } catch (error) {
    console.error('AI trigger-monitoring error:', error);
    return res.status(500).json({ success: false, message: 'Failed to queue monitoring sweep' });
  }
};
