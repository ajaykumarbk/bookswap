import { Response } from 'express';
import { db } from '../database/db';
import { AuthenticatedRequest } from '../middleware/auth';

export async function getSwapMessages(req: AuthenticatedRequest, res: Response) {
  try {
    const { swapId } = req.params;
    const userId = req.user!.id;

    const swap = db.prepare('SELECT requester_id, owner_id, status FROM swap_requests WHERE id = ?').get(swapId) as any;
    if (!swap) return res.status(404).json({ error: 'Swap request not found' });

    if (swap.requester_id !== userId && swap.owner_id !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to view these messages' });
    }

    const messages = db.prepare(`
      SELECT m.*, u.name as sender_name, u.profile_image as sender_image
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.swap_request_id = ?
      ORDER BY m.created_at ASC
    `).all(swapId);

    // Mark unread messages as read
    db.prepare(`UPDATE messages SET read_at = ? WHERE swap_request_id = ? AND receiver_id = ? AND read_at IS NULL`).run(
      new Date().toISOString(), swapId, userId
    );

    res.json({ messages });
  } catch (err: any) {
    res.status(500).json({ error: 'Error fetching chat messages' });
  }
}

export async function sendMessage(req: AuthenticatedRequest, res: Response) {
  try {
    const { swapId } = req.params;
    const senderId = req.user!.id;
    const { message, attachment_url } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Message content required' });
    }

    const swap = db.prepare('SELECT requester_id, owner_id, status FROM swap_requests WHERE id = ?').get(swapId) as any;
    if (!swap) return res.status(404).json({ error: 'Swap request not found' });

    if (swap.requester_id !== senderId && swap.owner_id !== senderId) {
      return res.status(403).json({ error: 'Unauthorized to send messages in this chat' });
    }

    const receiverId = swap.requester_id === senderId ? swap.owner_id : swap.requester_id;
    const id = 'msg_' + Math.random().toString(36).substr(2, 9);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO messages (id, sender_id, receiver_id, swap_request_id, message, attachment_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, senderId, receiverId, swapId, message.trim(), attachment_url || null, now);

    // Create notification for receiver
    const sender = db.prepare('SELECT name FROM users WHERE id = ?').get(senderId) as any;
    const notifId = 'ntf_' + Math.random().toString(36).substr(2, 9);
    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, reference_id, created_at)
      VALUES (?, ?, 'MESSAGE', ?, ?, ?, ?)
    `).run(
      notifId,
      receiverId,
      `New message from ${sender.name}`,
      message.length > 50 ? message.substring(0, 47) + '...' : message,
      swapId,
      now
    );

    const createdMsg = db.prepare(`
      SELECT m.*, u.name as sender_name, u.profile_image as sender_image
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.id = ?
    `).get(id);

    res.status(201).json({ message: createdMsg });
  } catch (err: any) {
    res.status(500).json({ error: 'Error sending message' });
  }
}

export async function getUserChats(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;

    const chats = db.prepare(`
      SELECT sr.id as swap_id, sr.status as swap_status, sr.updated_at,
        req.id as requester_id, req.name as requester_name, req.profile_image as requester_image,
        own.id as owner_id, own.name as owner_name, own.profile_image as owner_image,
        (SELECT message FROM messages WHERE swap_request_id = sr.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM messages WHERE swap_request_id = sr.id ORDER BY created_at DESC LIMIT 1) as last_message_time,
        (SELECT COUNT(*) FROM messages WHERE swap_request_id = sr.id AND receiver_id = ? AND read_at IS NULL) as unread_count
      FROM swap_requests sr
      JOIN users req ON sr.requester_id = req.id
      JOIN users own ON sr.owner_id = own.id
      WHERE (sr.requester_id = ? OR sr.owner_id = ?) AND sr.status NOT IN ('REJECTED', 'CANCELLED', 'EXPIRED')
      ORDER BY last_message_time DESC, sr.updated_at DESC
    `).all(userId, userId, userId);

    res.json({ chats });
  } catch (err: any) {
    res.status(500).json({ error: 'Error fetching user chats' });
  }
}
