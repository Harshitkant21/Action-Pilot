import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { evaluateRisk } from '../services/gemini.service';

const createCheckInSchema = z.object({
  goalId: z.string().uuid(),
  taskId: z.string().uuid().nullable().optional(),
  updateText: z.string().min(3, 'Update description must be at least 3 characters'),
  progressPercentage: z.number().int().min(0).max(100),
  executionStatus: z.string().optional(),
  blockerDescription: z.string().nullable().optional(),
  estimatedHoursRemaining: z.number().int().nonnegative().nullable().optional(),
  confidenceScore: z.number().int().min(1).max(5).nullable().optional(),
});

export const createProgressUpdate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const body = createCheckInSchema.parse(req.body);

    const goal = await prisma.goal.findUnique({
      where: { id: body.goalId },
    });

    if (!goal || goal.userId !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found',
      });
    }

    // Verify task if provided
    if (body.taskId) {
      const task = await prisma.task.findUnique({
        where: { id: body.taskId },
      });
      if (!task || task.goalId !== body.goalId) {
        return res.status(400).json({
          success: false,
          message: 'Task does not belong to the specified goal',
        });
      }
    }

    // Create progress log
    const log = await prisma.progressLog.create({
      data: {
        goalId: body.goalId,
        taskId: body.taskId || null,
        updateText: body.updateText,
        progressPercentage: body.progressPercentage,
        executionStatus: body.executionStatus || 'ON_TRACK',
        blockerDescription: body.blockerDescription || null,
        estimatedHoursRemaining: body.estimatedHoursRemaining || null,
        confidenceScore: body.confidenceScore || null,
      },
    });

    // Fetch tasks & logs for risk evaluation
    const tasks = await prisma.task.findMany({
      where: { goalId: body.goalId },
    });

    const logs = await prisma.progressLog.findMany({
      where: { goalId: body.goalId },
      orderBy: { createdAt: 'desc' },
    });

    // Run Risk Evaluation synchronously
    const assessment = await evaluateRisk(goal.title, goal.description, goal.deadline, tasks, logs);
    let riskScore = goal.riskScore;

    if (assessment) {
      riskScore = assessment.riskScore;

      // Save AgentReport
      await prisma.agentReport.create({
        data: {
          goalId: body.goalId,
          agentType: 'RISK',
          summary: `Risk Level: ${assessment.riskLevel}. Score: ${assessment.riskScore}%. Completion Probability: ${assessment.completionProbability}%. Reason: ${assessment.explanation}`,
          metadata: assessment as any,
        },
      });
    }

    // Update goal status depending on log input
    let newStatus = goal.status;
    if (body.progressPercentage === 100) {
      newStatus = 'COMPLETED';
    } else if (body.executionStatus === 'BLOCKED') {
      newStatus = 'AT_RISK';
    } else if (body.executionStatus === 'BEHIND') {
      newStatus = 'DELAYED';
    } else if (body.executionStatus === 'ON_TRACK' && (goal.status === 'AT_RISK' || goal.status === 'DELAYED')) {
      newStatus = 'ACTIVE';
    }

    await prisma.goal.update({
      where: { id: body.goalId },
      data: {
        status: newStatus,
        riskScore: riskScore,
      },
    });

    return res.status(201).json({
      success: true,
      data: log,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: error.errors[0].message });
    }
    console.error('Create progress update error:', error);
    return res.status(500).json({ success: false, message: 'Failed to log progress check-in' });
  }
};

export const getGoalProgressHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { goalId } = req.params;

    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
    });

    if (!goal || goal.userId !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found',
      });
    }

    const history = await prisma.progressLog.findMany({
      where: { goalId },
      include: {
        task: {
          select: {
            title: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('Get progress history error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch progress history' });
  }
};
