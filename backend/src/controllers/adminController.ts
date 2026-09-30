import { Response } from 'express';
import { db } from '../database/db';
import { AuthenticatedRequest } from '../middleware/auth';

export async function getAdminStats(req: AuthenticatedRequest, res: Response) {
  try {
    const totalUsers = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count;
    const activeUsers = (db.prepare("SELECT COUNT(*) as count FROM users WHERE is_suspended = 0").get() as any).count;
    const totalBooks = (db.prepare('SELECT COUNT(*) as count FROM books').get() as any).count;
    const availableBooks = (db.prepare("SELECT COUNT(*) as count FROM books WHERE status = 'Available'").get() as any).count;
    const completedSwaps = (db.prepare("SELECT COUNT(*) as count FROM swap_requests WHERE status IN ('EXCHANGE_COMPLETED', 'RATED')").get() as any).count;
    const pendingSwaps = (db.prepare("SELECT COUNT(*) as count FROM swap_requests WHERE status = 'PENDING'").get() as any).count;
    const pendingReports = (db.prepare("SELECT COUNT(*) as count FROM reports WHERE status = 'PENDING'").get() as any).count;
    const suspendedUsers = (db.prepare('SELECT COUNT(*) as count FROM users WHERE is_suspended = 1').get() as any).count;

    // Daily activity trends (last 7 days)
    const genreDistribution = db.prepare(`
      SELECT genre, COUNT(*) as count FROM books GROUP BY genre ORDER BY count DESC LIMIT 8
    `).all();

    const cityDistribution = db.prepare(`
      SELECT city, COUNT(*) as count FROM users GROUP BY city ORDER BY count DESC LIMIT 8
    `).all();

    res.json({
      stats: {
        totalUsers,
        activeUsers,
        totalBooks,
        availableBooks,
        completedSwaps,
        pendingSwaps,
        pendingReports,
        suspendedUsers
      },
      genreDistribution,
      cityDistribution
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Error fetching admin statistics' });
  }
}

export async function getAdminUsers(req: AuthenticatedRequest, res: Response) {
  try {
    const users = db.prepare(`
      SELECT id, name, email, phone, city, state, country, rating, completed_swaps, role, is_suspended, created_at,
             (SELECT COUNT(*) FROM books WHERE owner_id = users.id) as books_count
      FROM users
      ORDER BY created_at DESC
    `).all();

    res.json({ users });
  } catch (err: any) {
    res.status(500).json({ error: 'Error fetching users list' });
  }
}

export async function toggleSuspendUser(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { is_suspended, admin_notes } = req.body;
    const now = new Date().toISOString();

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.role === 'admin') {
      return res.status(400).json({ error: 'Cannot suspend administrator accounts.' });
    }

    const newSuspendedState = is_suspended !== undefined ? (is_suspended ? 1 : 0) : (user.is_suspended ? 0 : 1);

    db.prepare('UPDATE users SET is_suspended = ?, updated_at = ? WHERE id = ?').run(newSuspendedState, now, id);

    // Audit Log
    db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, details, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      'aud_' + Math.random().toString(36).substr(2, 9),
      req.user!.id,
      newSuspendedState ? 'USER_SUSPENDED' : 'USER_UNSUSPENDED',
      `User ${user.email} state changed to ${newSuspendedState ? 'suspended' : 'active'}. Notes: ${admin_notes || 'None'}`,
      now
    );

    res.json({ message: `User ${newSuspendedState ? 'suspended' : 'unsuspended'} successfully` });
  } catch (err: any) {
    res.status(500).json({ error: 'Error toggling user suspension' });
  }
}

export async function getAdminBooks(req: AuthenticatedRequest, res: Response) {
  try {
    const books = db.prepare(`
      SELECT b.*, u.name as owner_name, u.email as owner_email
      FROM books b
      JOIN users u ON b.owner_id = u.id
      ORDER BY b.created_at DESC
    `).all();

    res.json({ books });
  } catch (err: any) {
    res.status(500).json({ error: 'Error fetching admin books list' });
  }
}

export async function adminRemoveBook(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const now = new Date().toISOString();

    const book = db.prepare('SELECT * FROM books WHERE id = ?').get(id) as any;
    if (!book) return res.status(404).json({ error: 'Book not found' });

    db.prepare('DELETE FROM books WHERE id = ?').run(id);

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, details, created_at)
      VALUES (?, ?, 'BOOK_MODERATED_REMOVED', ?, ?)
    `).run(
      'aud_' + Math.random().toString(36).substr(2, 9),
      req.user!.id,
      `Removed book "${book.title}" (ID: ${id}). Reason: ${reason || 'Inappropriate content'}`,
      now
    );

    res.json({ message: 'Book removed by moderator' });
  } catch (err: any) {
    res.status(500).json({ error: 'Error removing book' });
  }
}

export async function getAdminReports(req: AuthenticatedRequest, res: Response) {
  try {
    const reports = db.prepare(`
      SELECT r.*,
        rep.name as reporter_name, rep.email as reporter_email,
        usr.name as reported_user_name, usr.email as reported_user_email,
        bk.title as reported_book_title
      FROM reports r
      LEFT JOIN users rep ON r.reporter_id = rep.id
      LEFT JOIN users usr ON r.reported_user_id = usr.id
      LEFT JOIN books bk ON r.reported_book_id = bk.id
      ORDER BY r.created_at DESC
    `).all();

    res.json({ reports });
  } catch (err: any) {
    res.status(500).json({ error: 'Error fetching reports' });
  }
}

export async function resolveReport(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE reports
      SET status = ?, admin_notes = ?, resolved_at = ?
      WHERE id = ?
    `).run(status || 'RESOLVED', admin_notes || 'Resolved by administrator.', now, id);

    res.json({ message: 'Report updated' });
  } catch (err: any) {
    res.status(500).json({ error: 'Error resolving report' });
  }
}

export async function getAdminAuditLogs(req: AuthenticatedRequest, res: Response) {
  try {
    const logs = db.prepare(`
      SELECT a.*, u.name as user_name, u.email as user_email
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 100
    `).all();

    res.json({ logs });
  } catch (err: any) {
    res.status(500).json({ error: 'Error fetching audit logs' });
  }
}
