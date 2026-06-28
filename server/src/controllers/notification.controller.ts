import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import webpush from 'web-push';
import { appConfig } from '../config/appConfig';

const publicKey = appConfig.vapidPublicKey;
const privateKey = appConfig.vapidPrivateKey;

if (publicKey && privateKey) {
  webpush.setVapidDetails(
    'mailto:admin@actionpilot.com',
    publicKey,
    privateKey
  );
}


export const getNotifications = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
};

export const markAsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { notificationId } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Mark notification read error:', error);
    return res.status(500).json({ success: false, message: 'Failed to mark notification as read' });
  }
};

export const markAllAsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    await prisma.notification.updateMany({
      where: {
        userId: req.user.id,
        isRead: false,
      },
      data: { isRead: true },
    });

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    return res.status(500).json({ success: false, message: 'Failed to mark all notifications as read' });
  }
};

export const subscribe = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { subscription } = req.body;
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ success: false, message: 'Subscription details are required' });
    }

    const { endpoint, keys } = subscription;
    const { p256dh, auth } = keys;

    if (!p256dh || !auth) {
      return res.status(400).json({ success: false, message: 'Subscription keys are required' });
    }

    // Upsert subscription based on unique endpoint
    const record = await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        userId: req.user.id,
        p256dh,
        auth,
      },
      create: {
        userId: req.user.id,
        endpoint,
        p256dh,
        auth,
      },
    });

    return res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error) {
    console.error('Subscribe push error:', error);
    return res.status(500).json({ success: false, message: 'Failed to register subscription' });
  }
};

export const getVapidPublicKey = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    return res.status(200).json({
      success: true,
      data: appConfig.vapidPublicKey,
    });
  } catch (error) {
    console.error('Get VAPID public key error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve public key' });
  }
};

export const sendPushNotification = async (userId: string, title: string, message: string) => {
  const publicKey = appConfig.vapidPublicKey;
  const privateKey = appConfig.vapidPrivateKey;
  if (!publicKey || !privateKey) {
    console.warn('[WebPush] VAPID keys not configured – skipping push notification');
    return;
  }

  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    });

    if (subscriptions.length === 0) {
      return;
    }

    console.log(`[WebPush] Dispatching push notification to ${subscriptions.length} devices for user ${userId}`);

    const payload = JSON.stringify({ title, message });

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload
        );
      } catch (subError: any) {
        console.error(`[WebPush] Single dispatch failed for endpoint ${sub.endpoint}:`, subError.statusCode);
        // Remove expired/invalid subscriptions (404 and 410 codes)
        if (subError.statusCode === 404 || subError.statusCode === 410) {
          console.log(`[WebPush] Removing expired push subscription for user ${userId}`);
          await prisma.pushSubscription.delete({
            where: { endpoint: sub.endpoint },
          }).catch(err => console.error('Failed to prune subscription:', err));
        }
      }
    }
  } catch (error) {
    console.error('[WebPush] Broadcast failed:', error);
  }
};
