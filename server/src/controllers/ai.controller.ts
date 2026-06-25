import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { analyzeGoal, generatePlan, evaluateRisk, generateStandup } from '../services/gemini.service';

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
