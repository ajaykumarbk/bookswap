import { Response } from 'express';
import { db } from '../database/db';
import { AuthenticatedRequest } from '../middleware/auth';

export async function createSwapRequest(req: AuthenticatedRequest, res: Response) {
  try {
    const requesterId = req.user!.id;
    const { owner_id, requested_book_ids, offered_book_ids, message } = req.body;

    if (!owner_id || !requested_book_ids || !offered_book_ids || requested_book_ids.length === 0 || offered_book_ids.length === 0) {
      return res.status(400).json({ error: 'Must select at least one requested book and one offered book.' });
    }

    if (requesterId === owner_id) {
      return res.status(400).json({ error: 'You cannot request a swap with yourself.' });
    }

    // Check duplicate pending requests between these users for the same books
    const existingActive = db.prepare(`
      SELECT id FROM swap_requests
      WHERE requester_id = ? AND owner_id = ? AND status IN ('PENDING', 'ACCEPTED', 'MEETUP_PENDING', 'MEETUP_CONFIRMED')
    `).get(requesterId, owner_id);

    if (existingActive) {
      return res.status(400).json({ error: 'You already have an active swap request with this user.' });
    }

    const swapId = 'swp_' + Math.random().toString(36).substr(2, 9);
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days expiry

    const transaction = db.transaction(() => {
      // Create swap_request record
      db.prepare(`
        INSERT INTO swap_requests (id, requester_id, owner_id, status, message, created_at, updated_at, expires_at)
        VALUES (?, ?, ?, 'PENDING', ?, ?, ?, ?)
      `).run(swapId, requesterId, owner_id, message || 'Hi, I would like to exchange books with you.', now, now, expiresAt);

      // Insert offered books
      for (const bookId of offered_book_ids) {
        const itemId = 'swpi_' + Math.random().toString(36).substr(2, 9);
        db.prepare(`
          INSERT INTO swap_items (id, swap_request_id, book_id, user_id, direction)
          VALUES (?, ?, ?, ?, 'OFFERED')
        `).run(itemId, swapId, bookId, requesterId);
      }

      // Insert requested books
      for (const bookId of requested_book_ids) {
        const itemId = 'swpi_' + Math.random().toString(36).substr(2, 9);
        db.prepare(`
          INSERT INTO swap_items (id, swap_request_id, book_id, user_id, direction)
          VALUES (?, ?, ?, ?, 'REQUESTED')
        `).run(itemId, swapId, bookId, owner_id);

        // Increment book swap requests count
        db.prepare('UPDATE books SET swap_requests_count = swap_requests_count + 1 WHERE id = ?').run(bookId);
      }

      // Send notification to owner
      const requester = db.prepare('SELECT name FROM users WHERE id = ?').get(requesterId) as any;
      const notifId = 'ntf_' + Math.random().toString(36).substr(2, 9);
      db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, message, reference_id, created_at)
        VALUES (?, ?, 'SWAP_REQUEST', ?, ?, ?, ?)
      `).run(
        notifId,
        owner_id,
        'New Swap Request!',
        `${requester.name} sent you a swap request for your book!`,
        swapId,
        now
      );
    });

    transaction();

    const swapDetails = getSwapFullDetails(swapId);
    res.status(201).json({ message: 'Swap request sent successfully', swap: swapDetails });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error creating swap request' });
  }
}

export async function getSwaps(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { status, type } = req.query;

    let query = `
      SELECT sr.*,
        req.name as requester_name, req.profile_image as requester_image, req.rating as requester_rating, req.city as requester_city,
        own.name as owner_name, own.profile_image as owner_image, own.rating as owner_rating, own.city as owner_city
      FROM swap_requests sr
      JOIN users req ON sr.requester_id = req.id
      JOIN users own ON sr.owner_id = own.id
      WHERE (sr.requester_id = ? OR sr.owner_id = ?)
    `;
    const params: any[] = [userId, userId];

    if (type === 'received') {
      query = query.replace('(sr.requester_id = ? OR sr.owner_id = ?)', 'sr.owner_id = ?');
      params.length = 0;
      params.push(userId);
    } else if (type === 'sent') {
      query = query.replace('(sr.requester_id = ? OR sr.owner_id = ?)', 'sr.requester_id = ?');
      params.length = 0;
      params.push(userId);
    }

    if (status) {
      query += ` AND sr.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY sr.updated_at DESC`;

    const swaps = db.prepare(query).all(...params) as any[];

    // Attach swap items and meetup info to each swap
    const detailedSwaps = swaps.map(swap => {
      const items = db.prepare(`
        SELECT si.*, b.title, b.author, b.cover_image, b.condition
        FROM swap_items si
        JOIN books b ON si.book_id = b.id
        WHERE si.swap_request_id = ?
      `).all(swap.id);

      const meetup = db.prepare(`SELECT * FROM meetups WHERE swap_request_id = ?`).get(swap.id);

      return {
        ...swap,
        offeredItems: items.filter((i: any) => i.direction === 'OFFERED'),
        requestedItems: items.filter((i: any) => i.direction === 'REQUESTED'),
        meetup
      };
    });

    res.json({ swaps: detailedSwaps });
  } catch (err: any) {
    res.status(500).json({ error: 'Error fetching swaps' });
  }
}

export async function getSwapById(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const swap = getSwapFullDetails(id);
    if (!swap) return res.status(404).json({ error: 'Swap request not found' });

    if (swap.requester_id !== userId && swap.owner_id !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to view this swap' });
    }

    res.json({ swap });
  } catch (err: any) {
    res.status(500).json({ error: 'Error fetching swap' });
  }
}

export async function acceptSwap(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const now = new Date().toISOString();

    const swap = db.prepare('SELECT * FROM swap_requests WHERE id = ?').get(id) as any;
    if (!swap) return res.status(404).json({ error: 'Swap request not found' });

    if (swap.owner_id !== userId && (swap.status !== 'COUNTER_OFFERED' || swap.requester_id !== userId)) {
      return res.status(403).json({ error: 'Only the recipient can accept this swap request.' });
    }

    if (swap.status !== 'PENDING' && swap.status !== 'COUNTER_OFFERED') {
      return res.status(400).json({ error: `Cannot accept swap in current state: ${swap.status}` });
    }

    const transaction = db.transaction(() => {
      // Update swap status to ACCEPTED
      db.prepare(`UPDATE swap_requests SET status = 'ACCEPTED', updated_at = ? WHERE id = ?`).run(now, id);

      // Set items status to Reserved
      const items = db.prepare('SELECT book_id FROM swap_items WHERE swap_request_id = ?').all(id) as any[];
      for (const item of items) {
        db.prepare(`UPDATE books SET status = 'Reserved' WHERE id = ?`).run(item.book_id);
      }

      // Notify counterparty
      const recipientId = swap.owner_id === userId ? swap.requester_id : swap.owner_id;
      const user = db.prepare('SELECT name FROM users WHERE id = ?').get(userId) as any;
      const notifId = 'ntf_' + Math.random().toString(36).substr(2, 9);
      db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, message, reference_id, created_at)
        VALUES (?, ?, 'SWAP_ACCEPTED', ?, ?, ?, ?)
      `).run(
        notifId,
        recipientId,
        'Swap Request Accepted!',
        `${user.name} accepted your swap request! You can now chat and arrange a public meetup.`,
        id,
        now
      );
    });

    transaction();

    const updatedSwap = getSwapFullDetails(id);
    res.json({ message: 'Swap accepted! Chat is now enabled.', swap: updatedSwap });
  } catch (err: any) {
    res.status(500).json({ error: 'Error accepting swap' });
  }
}

export async function rejectSwap(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const now = new Date().toISOString();

    const swap = db.prepare('SELECT * FROM swap_requests WHERE id = ?').get(id) as any;
    if (!swap) return res.status(404).json({ error: 'Swap request not found' });

    if (swap.requester_id !== userId && swap.owner_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    db.prepare(`UPDATE swap_requests SET status = 'REJECTED', updated_at = ? WHERE id = ?`).run(now, id);

    // Notify requester
    const recipientId = swap.owner_id === userId ? swap.requester_id : swap.owner_id;
    const user = db.prepare('SELECT name FROM users WHERE id = ?').get(userId) as any;
    const notifId = 'ntf_' + Math.random().toString(36).substr(2, 9);
    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, reference_id, created_at)
      VALUES (?, ?, 'SWAP_REJECTED', ?, ?, ?, ?)
    `).run(
      notifId,
      recipientId,
      'Swap Request Declined',
      `${user.name} declined the swap request.`,
      id,
      now
    );

    const updatedSwap = getSwapFullDetails(id);
    res.json({ message: 'Swap rejected', swap: updatedSwap });
  } catch (err: any) {
    res.status(500).json({ error: 'Error rejecting swap' });
  }
}

export async function counterOfferSwap(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { offered_book_ids, requested_book_ids, message } = req.body;
    const now = new Date().toISOString();

    const swap = db.prepare('SELECT * FROM swap_requests WHERE id = ?').get(id) as any;
    if (!swap) return res.status(404).json({ error: 'Swap request not found' });

    const transaction = db.transaction(() => {
      // Remove previous swap items
      db.prepare('DELETE FROM swap_items WHERE swap_request_id = ?').run(id);

      // Insert new offered & requested items
      for (const bookId of offered_book_ids) {
        const itemId = 'swpi_' + Math.random().toString(36).substr(2, 9);
        db.prepare(`INSERT INTO swap_items (id, swap_request_id, book_id, user_id, direction) VALUES (?, ?, ?, ?, 'OFFERED')`).run(itemId, id, bookId, userId);
      }
      const otherUserId = swap.owner_id === userId ? swap.requester_id : swap.owner_id;
      for (const bookId of requested_book_ids) {
        const itemId = 'swpi_' + Math.random().toString(36).substr(2, 9);
        db.prepare(`INSERT INTO swap_items (id, swap_request_id, book_id, user_id, direction) VALUES (?, ?, ?, ?, 'REQUESTED')`).run(itemId, id, bookId, otherUserId);
      }

      db.prepare(`
        UPDATE swap_requests
        SET status = 'COUNTER_OFFERED', counter_offered_by = ?, message = ?, updated_at = ?
        WHERE id = ?
      `).run(userId, message || 'I propose a counter offer with these books.', now, id);

      const user = db.prepare('SELECT name FROM users WHERE id = ?').get(userId) as any;
      const notifId = 'ntf_' + Math.random().toString(36).substr(2, 9);
      db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, message, reference_id, created_at)
        VALUES (?, ?, 'COUNTER_OFFER', ?, ?, ?, ?)
      `).run(
        notifId,
        otherUserId,
        'New Counter Offer!',
        `${user.name} proposed a counter offer for your swap.`,
        id,
        now
      );
    });

    transaction();

    const updatedSwap = getSwapFullDetails(id);
    res.json({ message: 'Counter offer sent successfully', swap: updatedSwap });
  } catch (err: any) {
    res.status(500).json({ error: 'Error making counter offer' });
  }
}

export async function arrangeMeetup(req: AuthenticatedRequest, res: Response) {
  try {
    const { id: swapId } = req.params;
    const userId = req.user!.id;
    const { date, time, location_name, notes } = req.body;
    const now = new Date().toISOString();

    const swap = db.prepare('SELECT * FROM swap_requests WHERE id = ?').get(swapId) as any;
    if (!swap) return res.status(404).json({ error: 'Swap request not found' });

    const existingMeetup = db.prepare('SELECT * FROM meetups WHERE swap_request_id = ?').get(swapId) as any;
    const meetupId = existingMeetup ? existingMeetup.id : 'mtp_' + Math.random().toString(36).substr(2, 9);

    const isUserA = swap.requester_id === userId;

    if (existingMeetup) {
      db.prepare(`
        UPDATE meetups
        SET date = ?, time = ?, location_name = ?, notes = ?,
            user_a_confirmed = ?, user_b_confirmed = ?
        WHERE id = ?
      `).run(date, time, location_name, notes || '', isUserA ? 1 : 0, isUserA ? 0 : 1, meetupId);
    } else {
      db.prepare(`
        INSERT INTO meetups (id, swap_request_id, date, time, location_name, notes, user_a_confirmed, user_b_confirmed, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(meetupId, swapId, date, time, location_name, notes || '', isUserA ? 1 : 0, isUserA ? 0 : 1, now);
    }

    db.prepare(`UPDATE swap_requests SET status = 'MEETUP_PENDING', updated_at = ? WHERE id = ?`).run(now, swapId);

    const updatedSwap = getSwapFullDetails(swapId);
    res.json({ message: 'Meetup proposed. Awaiting partner confirmation.', swap: updatedSwap });
  } catch (err: any) {
    res.status(500).json({ error: 'Error arranging meetup' });
  }
}

export async function confirmMeetup(req: AuthenticatedRequest, res: Response) {
  try {
    const { id: swapId } = req.params;
    const userId = req.user!.id;
    const now = new Date().toISOString();

    const swap = db.prepare('SELECT * FROM swap_requests WHERE id = ?').get(swapId) as any;
    const meetup = db.prepare('SELECT * FROM meetups WHERE swap_request_id = ?').get(swapId) as any;

    if (!swap || !meetup) return res.status(404).json({ error: 'Meetup details not found' });

    const isUserA = swap.requester_id === userId;
    const userAConf = isUserA ? 1 : meetup.user_a_confirmed;
    const userBConf = !isUserA ? 1 : meetup.user_b_confirmed;

    db.prepare(`UPDATE meetups SET user_a_confirmed = ?, user_b_confirmed = ? WHERE id = ?`).run(userAConf, userBConf, meetup.id);

    if (userAConf === 1 && userBConf === 1) {
      db.prepare(`UPDATE swap_requests SET status = 'MEETUP_CONFIRMED', updated_at = ? WHERE id = ?`).run(now, swapId);
      
      // Notify both users
      const partnerId = isUserA ? swap.owner_id : swap.requester_id;
      const notifId = 'ntf_' + Math.random().toString(36).substr(2, 9);
      db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, message, reference_id, created_at)
        VALUES (?, ?, 'MEETUP_CONFIRMED', ?, ?, ?, ?)
      `).run(notifId, partnerId, 'Meetup Confirmed!', `Your exchange meetup at ${meetup.location_name} on ${meetup.date} is fully confirmed!`, swapId, now);
    }

    const updatedSwap = getSwapFullDetails(swapId);
    res.json({ message: 'Meetup confirmed!', swap: updatedSwap });
  } catch (err: any) {
    res.status(500).json({ error: 'Error confirming meetup' });
  }
}

export async function completeExchange(req: AuthenticatedRequest, res: Response) {
  try {
    const { id: swapId } = req.params;
    const userId = req.user!.id;
    const now = new Date().toISOString();

    const swap = db.prepare('SELECT * FROM swap_requests WHERE id = ?').get(swapId) as any;
    if (!swap) return res.status(404).json({ error: 'Swap not found' });

    const items = db.prepare(`
      SELECT si.*, b.owner_id as current_owner_id, b.title
      FROM swap_items si
      JOIN books b ON si.book_id = b.id
      WHERE si.swap_request_id = ?
    `).all(swapId) as any[];

    const transaction = db.transaction(() => {
      // 1. Swap Ownership of Books in Database!
      // Offered books move from Requester -> Owner
      // Requested books move from Owner -> Requester
      for (const item of items) {
        const newOwner = item.direction === 'OFFERED' ? swap.owner_id : swap.requester_id;
        db.prepare(`
          UPDATE books
          SET owner_id = ?, status = 'Swapped', updated_at = ?
          WHERE id = ?
        `).run(newOwner, now, item.book_id);
      }

      // 2. Increment completed swaps count for both users
      db.prepare('UPDATE users SET completed_swaps = completed_swaps + 1 WHERE id = ?').run(swap.requester_id);
      db.prepare('UPDATE users SET completed_swaps = completed_swaps + 1 WHERE id = ?').run(swap.owner_id);

      // 3. Set swap status to EXCHANGE_COMPLETED
      db.prepare(`UPDATE swap_requests SET status = 'EXCHANGE_COMPLETED', updated_at = ? WHERE id = ?`).run(now, swapId);

      // 4. Send Notifications
      const notif1 = 'ntf_' + Math.random().toString(36).substr(2, 9);
      const notif2 = 'ntf_' + Math.random().toString(36).substr(2, 9);
      db.prepare(`INSERT INTO notifications (id, user_id, type, title, message, reference_id, created_at) VALUES (?, ?, 'EXCHANGE_COMPLETED', 'Exchange Completed!', 'Congratulations on completing your book swap! Please leave a review.', ?, ?)`).run(notif1, swap.requester_id, swapId, now);
      db.prepare(`INSERT INTO notifications (id, user_id, type, title, message, reference_id, created_at) VALUES (?, ?, 'EXCHANGE_COMPLETED', 'Exchange Completed!', 'Congratulations on completing your book swap! Please leave a review.', ?, ?)`).run(notif2, swap.owner_id, swapId, now);
    });

    transaction();

    const updatedSwap = getSwapFullDetails(swapId);
    res.json({ message: 'Book exchange successfully completed! Ownership updated.', swap: updatedSwap });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error completing exchange' });
  }
}

export async function cancelSwap(req: AuthenticatedRequest, res: Response) {
  try {
    const { id: swapId } = req.params;
    const userId = req.user!.id;
    const now = new Date().toISOString();

    const swap = db.prepare('SELECT * FROM swap_requests WHERE id = ?').get(swapId) as any;
    if (!swap) return res.status(404).json({ error: 'Swap not found' });

    if (swap.requester_id !== userId && swap.owner_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const transaction = db.transaction(() => {
      // Revert reserved books back to Available
      const items = db.prepare('SELECT book_id FROM swap_items WHERE swap_request_id = ?').all(swapId) as any[];
      for (const item of items) {
        db.prepare(`UPDATE books SET status = 'Available' WHERE id = ? AND status = 'Reserved'`).run(item.book_id);
      }

      db.prepare(`UPDATE swap_requests SET status = 'CANCELLED', updated_at = ? WHERE id = ?`).run(now, swapId);
    });

    transaction();

    const updatedSwap = getSwapFullDetails(swapId);
    res.json({ message: 'Swap cancelled', swap: updatedSwap });
  } catch (err: any) {
    res.status(500).json({ error: 'Error cancelling swap' });
  }
}

export function getSwapFullDetails(swapId: string): any {
  const swap = db.prepare(`
    SELECT sr.*,
      req.name as requester_name, req.profile_image as requester_image, req.rating as requester_rating, req.city as requester_city,
      own.name as owner_name, own.profile_image as owner_image, own.rating as owner_rating, own.city as owner_city
    FROM swap_requests sr
    JOIN users req ON sr.requester_id = req.id
    JOIN users own ON sr.owner_id = own.id
    WHERE sr.id = ?
  `).get(swapId) as any;

  if (!swap) return null;

  const items = db.prepare(`
    SELECT si.*, b.title, b.author, b.cover_image, b.condition, b.genre
    FROM swap_items si
    JOIN books b ON si.book_id = b.id
    WHERE si.swap_request_id = ?
  `).all(swapId);

  const meetup = db.prepare('SELECT * FROM meetups WHERE swap_request_id = ?').get(swapId);
  const reviews = db.prepare('SELECT * FROM reviews WHERE swap_request_id = ?').all(swapId);

  return {
    ...swap,
    offeredItems: items.filter((i: any) => i.direction === 'OFFERED'),
    requestedItems: items.filter((i: any) => i.direction === 'REQUESTED'),
    meetup,
    reviews
  };
}
