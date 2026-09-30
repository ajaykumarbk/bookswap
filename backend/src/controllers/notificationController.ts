import { Response } from 'express';
import { db } from '../database/db';
import { AuthenticatedRequest } from '../middleware/auth';

export async function getNotifications(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const notifications = db.prepare(`
      SELECT * FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).all(userId);

    const unreadCount = (db.prepare(`
      SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0
    `).get(userId) as any).count;

    res.json({ notifications, unreadCount });
  } catch (err: any) {
    res.status(500).json({ error: 'Error fetching notifications' });
  }
}

export async function markAllNotificationsRead(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(userId);
    res.json({ message: 'Notifications marked as read' });
  } catch (err: any) {
    res.status(500).json({ error: 'Error updating notifications' });
  }
}

export async function markNotificationRead(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(id, userId);
    res.json({ message: 'Notification marked as read' });
  } catch (err: any) {
    res.status(500).json({ error: 'Error updating notification' });
  }
}
