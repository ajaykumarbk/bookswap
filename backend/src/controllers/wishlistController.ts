import { Response } from 'express';
import { db } from '../database/db';
import { AuthenticatedRequest } from '../middleware/auth';

export async function getWishlist(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const items = db.prepare('SELECT * FROM wishlist WHERE user_id = ? ORDER BY created_at DESC').all(userId) as any[];

    // Check availability for each wishlist item
    const itemsWithMatches = items.map(item => {
      const matches = db.prepare(`
        SELECT b.id, b.title, b.author, b.condition, b.cover_image, u.name as owner_name, u.city as owner_city
        FROM books b
        JOIN users u ON b.owner_id = u.id
        WHERE b.status = 'Available' AND b.owner_id != ? AND (
          LOWER(b.title) LIKE ? OR (b.isbn IS NOT NULL AND b.isbn = ?)
        )
      `).all(userId, `%${item.book_title.toLowerCase()}%`, item.isbn || 'NO_ISBN');

      return {
        ...item,
        availableNearbyCount: matches.length,
        matchingBooks: matches
      };
    });

    res.json({ wishlist: itemsWithMatches });
  } catch (err: any) {
    res.status(500).json({ error: 'Error fetching wishlist' });
  }
}

export async function addToWishlist(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { book_title, author, isbn } = req.body;

    if (!book_title) {
      return res.status(400).json({ error: 'Book title required' });
    }

    const id = 'wsh_' + Math.random().toString(36).substr(2, 9);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO wishlist (id, user_id, book_title, author, isbn, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, userId, book_title, author || null, isbn || null, now);

    const item = db.prepare('SELECT * FROM wishlist WHERE id = ?').get(id);
    res.status(201).json({ message: 'Added to wishlist', item });
  } catch (err: any) {
    res.status(500).json({ error: 'Error adding to wishlist' });
  }
}

export async function removeFromWishlist(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    db.prepare('DELETE FROM wishlist WHERE id = ? AND user_id = ?').run(id, userId);
    res.json({ message: 'Removed from wishlist' });
  } catch (err: any) {
    res.status(500).json({ error: 'Error removing from wishlist' });
  }
}
