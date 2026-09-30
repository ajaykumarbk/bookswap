import { Response } from 'express';
import { db } from '../database/db';
import { AuthenticatedRequest } from '../middleware/auth';

export async function createReport(req: AuthenticatedRequest, res: Response) {
  try {
    const reporterId = req.user!.id;
    const { reported_user_id, reported_book_id, reason, description } = req.body;

    if (!reason || !description) {
      return res.status(400).json({ error: 'Reason and description required' });
    }

    const id = 'rpt_' + Math.random().toString(36).substr(2, 9);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO reports (id, reporter_id, reported_user_id, reported_book_id, reason, description, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?)
    `).run(id, reporterId, reported_user_id || null, reported_book_id || null, reason, description, now);

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, details, created_at)
      VALUES (?, ?, 'REPORT_CREATED', ?, ?)
    `).run('aud_' + Math.random().toString(36).substr(2, 9), reporterId, `Report filed for reason: ${reason}`, now);

    res.status(201).json({ message: 'Report submitted to administrators for review.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Error submitting report' });
  }
}
