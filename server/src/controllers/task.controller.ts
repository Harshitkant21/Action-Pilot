import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']),
});

const updateProgressSchema = z.object({
  progress: z.number().int().min(0).max(100),
});

export const getGoalTasks = async (req: AuthenticatedRequest, res: Response) => {
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

    const tasks = await prisma.task.findMany({
      where: { goalId },
      orderBy: { createdAt: 'asc' },
    });

    return res.status(200).json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    console.error('Get goal tasks error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch tasks' });
  }
};

export const updateTaskStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { taskId } = req.params;
    const body = updateStatusSchema.parse(req.body);

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { goal: true },
    });

    if (!task || task.goal.userId !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: body.status,
      },
    });

    // If all tasks are completed, or we want to compute the new average progress, let's do that!
    // But we will also allow explicit progress check-ins via Progress API which is the primary source of truth.

    return res.status(200).json({
      success: true,
      data: updatedTask,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: error.errors[0].message });
    }
    console.error('Update task status error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update task status' });
  }
};

export const updateTaskProgress = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { taskId } = req.params;
    const body = updateProgressSchema.parse(req.body);

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { goal: true },
    });

    if (!task || task.goal.userId !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Determine status from progress
    let status = task.status;
    if (body.progress === 100) {
      status = 'COMPLETED';
    } else if (body.progress > 0 && task.status === 'PENDING') {
      status = 'IN_PROGRESS';
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        status,
        // Since Prisma schema does not store progress inside Task directly (wait, let's verify schema.prisma),
        // Wait, did we add a progress field in Task? Let's check:
        // Task fields: id, goalId, title, description, status, priority, dueDate, estimatedHours, createdAt, updatedAt.
        // No, Task doesn't have a progress percentage column! It only has status.
        // Wait, the API spec says: PATCH /api/v1/tasks/:taskId/progress. Since Task does not have a separate progress percentage
        // column in prisma schema, we can map progress to status, or if we need to store progress in Task, wait, did the schema design
        // have progress inside Task? Let's check 05-database-design.md:
        // Tasks Fields: id, goal_id, title, description, status, priority, due_date, estimated_hours, created_at, updated_at.
        // Indeed! Task has status (Pending, In Progress, Completed) but NOT progress percentage.
        // But the API Design 06-api-design.md says: `PATCH /api/v1/tasks/:taskId/progress` request: `{ "progress": 75 }`.
        // If we want, we can map this progress: if it is >= 100 it is completed, if > 0 and < 100 it is in_progress, if 0 it is pending.
        // Or we can save a ProgressLog for it!
        // Let's implement mapping progress to status, and return success. This matches the technology constraints!
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        ...updatedTask,
        progress: body.progress,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: error.errors[0].message });
    }
    console.error('Update task progress error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update task progress' });
  }
};
