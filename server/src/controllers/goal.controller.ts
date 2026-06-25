import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { analyzeGoal, generatePlan } from '../services/gemini.service';

const createGoalSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  deadline: z.string().datetime('Invalid deadline date-time format'),
});

const updateGoalSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().min(5).optional(),
  deadline: z.string().datetime().optional(),
  status: z.enum(['DRAFT', 'PLANNED', 'ACTIVE', 'AT_RISK', 'DELAYED', 'COMPLETED', 'ARCHIVED']).optional(),
  complexity: z.string().optional(),
  estimatedEffortHours: z.number().int().nonnegative().optional(),
  riskScore: z.number().int().min(0).max(100).optional(),
});

export const createGoal = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const body = createGoalSchema.parse(req.body);
    const deadlineDate = new Date(body.deadline);

    if (deadlineDate.getTime() <= Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'Deadline must be a future date',
      });
    }

    // Step 1: Create the goal record
    const newGoal = await prisma.goal.create({
      data: {
        userId: req.user.id,
        title: body.title,
        description: body.description,
        deadline: deadlineDate,
        status: 'ACTIVE',
      },
    });

    // Step 2: Run Goal Analyzer Agent via Gemini
    const analysis = await analyzeGoal(body.title, body.description, deadlineDate);

    let complexity = 'Medium';
    let estimatedEffortHours = 10;

    if (analysis) {
      complexity = analysis.complexity;
      estimatedEffortHours = analysis.estimatedEffortHours;

      // Update goal with analysis results
      await prisma.goal.update({
        where: { id: newGoal.id },
        data: {
          complexity: analysis.complexity,
          estimatedEffortHours: analysis.estimatedEffortHours,
        },
      });

      // Persist agent report
      await prisma.agentReport.create({
        data: {
          goalId: newGoal.id,
          agentType: 'GOAL_ANALYZER',
          summary: `Category: ${analysis.category}. Complexity: ${analysis.complexity}. Estimated Effort: ${analysis.estimatedEffortHours}h. Risk Factors: ${analysis.riskFactors.join(', ')}.`,
          metadata: analysis as any,
        },
      });

      // Step 3: Run Planning Agent via Gemini
      const plan = await generatePlan(body.title, body.description, deadlineDate, analysis);

      if (plan && plan.tasks.length > 0) {
        const now = new Date();
        const diffMs = deadlineDate.getTime() - now.getTime();

        for (const task of plan.tasks) {
          const dueDate = new Date(now.getTime() + diffMs * Math.min(task.timelineProgress, 1.0));
          await prisma.task.create({
            data: {
              goalId: newGoal.id,
              title: task.title,
              description: task.description,
              status: 'PENDING',
              priority: task.priority === 'HIGH' ? 'HIGH' : task.priority === 'LOW' ? 'LOW' : 'MEDIUM',
              dueDate,
              estimatedHours: task.estimatedHours,
            },
          });
        }

        // Persist planner agent report
        await prisma.agentReport.create({
          data: {
            goalId: newGoal.id,
            agentType: 'PLANNER',
            summary: `Generated ${plan.tasks.length} tasks for goal "${body.title}".`,
            metadata: plan as any,
          },
        });
      } else {
        // Planning agent failed – seed mock fallback tasks
        console.warn('[Goal Create] Planning agent returned no tasks – using mock fallback');
        await seedMockTasks(newGoal.id, deadlineDate);
      }
    } else {
      // Gemini unavailable – seed mock fallback tasks
      console.warn('[Goal Create] Gemini unavailable – using mock fallback tasks');
      await prisma.goal.update({
        where: { id: newGoal.id },
        data: { complexity, estimatedEffortHours },
      });
      await seedMockTasks(newGoal.id, deadlineDate);
    }

    return res.status(201).json({
      success: true,
      goalId: newGoal.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: error.errors[0].message });
    }
    console.error('Create goal error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create goal' });
  }
};

// Fallback mock tasks when Gemini is unavailable
async function seedMockTasks(goalId: string, deadline: Date) {
  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();

  await prisma.task.createMany({
    data: [
      {
        goalId,
        title: 'Analyze goal requirements and constraints',
        description: 'Initial review of the goal objective, milestones, and potential execution risks.',
        status: 'PENDING',
        priority: 'HIGH',
        dueDate: new Date(now.getTime() + diffMs * 0.25),
        estimatedHours: 2,
      },
      {
        goalId,
        title: 'Draft initial implementation roadmap',
        description: 'Break down goals into smaller components, set key deliverables and due dates.',
        status: 'PENDING',
        priority: 'MEDIUM',
        dueDate: new Date(now.getTime() + diffMs * 0.50),
        estimatedHours: 3,
      },
      {
        goalId,
        title: 'Execute checkpoints & progress reviews',
        description: 'Actively work on deliverables and log daily update reports detailing accomplishments.',
        status: 'PENDING',
        priority: 'MEDIUM',
        dueDate: new Date(now.getTime() + diffMs * 0.75),
        estimatedHours: 6,
      },
      {
        goalId,
        title: 'Verify completion criteria and archive goal',
        description: 'Final walkthrough validation of deliverables and mark target goal as completed.',
        status: 'PENDING',
        priority: 'LOW',
        dueDate: deadline,
        estimatedHours: 2,
      },
    ],
  });
}

export const getGoals = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const includeArchived = req.query.includeArchived === 'true';

    const goals = await prisma.goal.findMany({
      where: {
        userId: req.user.id,
        ...(includeArchived ? {} : { status: { not: 'ARCHIVED' } }),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.status(200).json({
      success: true,
      data: goals,
    });
  } catch (error) {
    console.error('Get goals error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch goals' });
  }
};

export const getGoalById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { goalId } = req.params;

    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      include: {
        tasks: {
          orderBy: {
            createdAt: 'asc',
          },
        },
        progressLogs: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        agentReports: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!goal || goal.userId !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: goal,
    });
  } catch (error) {
    console.error('Get goal by ID error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch goal details' });
  }
};

export const updateGoal = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { goalId } = req.params;
    const body = updateGoalSchema.parse(req.body);

    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
    });

    if (!goal || goal.userId !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found',
      });
    }

    const updatedGoal = await prisma.goal.update({
      where: { id: goalId },
      data: {
        ...(body.title && { title: body.title }),
        ...(body.description && { description: body.description }),
        ...(body.deadline && { deadline: new Date(body.deadline) }),
        ...(body.status && { status: body.status }),
        ...(body.complexity && { complexity: body.complexity }),
        ...(body.estimatedEffortHours !== undefined && { estimatedEffortHours: body.estimatedEffortHours }),
        ...(body.riskScore !== undefined && { riskScore: body.riskScore }),
      },
    });

    return res.status(200).json({
      success: true,
      data: updatedGoal,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: error.errors[0].message });
    }
    console.error('Update goal error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update goal' });
  }
};

export const archiveGoal = async (req: AuthenticatedRequest, res: Response) => {
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

    await prisma.goal.update({
      where: { id: goalId },
      data: {
        status: 'ARCHIVED',
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Goal archived successfully',
    });
  } catch (error) {
    console.error('Archive goal error:', error);
    return res.status(500).json({ success: false, message: 'Failed to archive goal' });
  }
};
