import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { queueMonitoringSweep } from '../queues/monitoring.queue';
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
    const analysis = await analyzeGoal(goal.title, goal.description, goal.deadline);
    if (!analysis) {
      return res.status(503).json({ success: false, message: 'AI analysis unavailable. Check GEMINI_API_KEY.' });
    }

    const plan = await generatePlan(goal.title, goal.description, goal.deadline, analysis);
    if (!plan) {
      return res.status(503).json({ success: false, message: 'AI plan generation unavailable.' });
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

    const assessment = await evaluateRisk(goal.title, goal.description, goal.deadline, goal.tasks, goal.progressLogs);
    if (!assessment) {
      return res.status(503).json({ success: false, message: 'Risk assessment unavailable.' });
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

    const standup = await generateStandup(goal.title, goal.description, goal.deadline, goal.tasks, goal.progressLogs);
    if (!standup) {
      return res.status(503).json({ success: false, message: 'Standup generation unavailable.' });
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

    const plan = await generateRecoveryPlan(
      goal.title,
      goal.description,
      goal.deadline,
      goal.tasks,
      goal.progressLogs,
      riskExplanation
    );

    if (!plan) {
      return res.status(503).json({ success: false, message: 'Recovery plan generation unavailable.' });
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
          take: 1,
        },
      },
    });

    if (!goal || goal.userId !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    const latestRecoveryReport = goal.agentReports[0];
    if (!latestRecoveryReport) {
      return res.status(400).json({ success: false, message: 'No recovery plan found for this goal. Please generate one first.' });
    }

    const metadata = latestRecoveryReport.metadata as any;
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
    });

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
