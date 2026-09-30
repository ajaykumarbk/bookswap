import { Response } from 'express';
import { db } from '../database/db';
import { AuthenticatedRequest } from '../middleware/auth';

export async function createReview(req: AuthenticatedRequest, res: Response) {
  try {
    const reviewerId = req.user!.id;
    const { swap_request_id, reviewee_id, rating, comment, tags } = req.body;

    if (!swap_request_id || !reviewee_id || !rating) {
      return res.status(400).json({ error: 'Missing required review fields' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const swap = db.prepare('SELECT * FROM swap_requests WHERE id = ?').get(swap_request_id) as any;
    if (!swap) return res.status(404).json({ error: 'Swap request not found' });

    if (swap.status !== 'EXCHANGE_COMPLETED' && swap.status !== 'RATED') {
      return res.status(400).json({ error: 'Reviews can only be submitted after the book exchange is completed.' });
    }

    // Check existing review
    const existing = db.prepare('SELECT id FROM reviews WHERE swap_request_id = ? AND reviewer_id = ?').get(swap_request_id, reviewerId);
    if (existing) {
      return res.status(400).json({ error: 'You have already submitted a review for this swap.' });
    }

    const id = 'rvw_' + Math.random().toString(36).substr(2, 9);
    const now = new Date().toISOString();

    const transaction = db.transaction(() => {
      // Insert review
      db.prepare(`
        INSERT INTO reviews (id, swap_request_id, reviewer_id, reviewee_id, rating, comment, tags, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, swap_request_id, reviewerId, reviewee_id, rating, comment || '', tags ? JSON.stringify(tags) : '[]', now);

      // Recalculate user average rating in DB!
      const userReviews = db.prepare('SELECT rating FROM reviews WHERE reviewee_id = ?').all(reviewee_id) as any[];
      const avgRating = userReviews.reduce((sum, r) => sum + r.rating, 0) / userReviews.length;
      const roundedRating = Math.round(avgRating * 10) / 10;

      db.prepare('UPDATE users SET rating = ? WHERE id = ?').run(roundedRating, reviewee_id);

      // Update swap status to RATED if both users rated
      const count = db.prepare('SELECT COUNT(*) as count FROM reviews WHERE swap_request_id = ?').get(swap_request_id) as any;
      if (count.count >= 2) {
        db.prepare(`UPDATE swap_requests SET status = 'RATED', updated_at = ? WHERE id = ?`).run(now, swap_request_id);
      }

      // Notify reviewee
      const reviewer = db.prepare('SELECT name FROM users WHERE id = ?').get(reviewerId) as any;
      const notifId = 'ntf_' + Math.random().toString(36).substr(2, 9);
      db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, message, reference_id, created_at)
        VALUES (?, ?, 'REVIEW', ?, ?, ?, ?)
      `).run(
        notifId,
        reviewee_id,
        'New Review Received!',
        `${reviewer.name} rated your swap experience ${rating} stars!`,
        swap_request_id,
        now
      );
    });

    transaction();

    const createdReview = db.prepare('SELECT * FROM reviews WHERE id = ?').get(id);
    res.status(201).json({ message: 'Review submitted successfully', review: createdReview });
  } catch (err: any) {
    res.status(500).json({ error: 'Error submitting review' });
  }
}

export async function getUserReviews(req: AuthenticatedRequest, res: Response) {
  try {
    const { id: userId } = req.params;

    const reviews = db.prepare(`
      SELECT r.*, u.name as reviewer_name, u.profile_image as reviewer_image
      FROM reviews r
      JOIN users u ON r.reviewer_id = u.id
      WHERE r.reviewee_id = ?
      ORDER BY r.created_at DESC
    `).all(userId);

    res.json({ reviews });
  } catch (err: any) {
    res.status(500).json({ error: 'Error fetching reviews' });
  }
}
