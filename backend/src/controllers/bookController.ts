import { Request, Response } from 'express';
import { db } from '../database/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { calculateHaversineDistance, blurCoordinates } from '../utils/haversine';
import { fetchBookMetadataByISBN } from '../services/isbnService';
import { getRecommendedBooks } from '../services/recommendationEngine';

export async function lookupISBN(req: Request, res: Response) {
  try {
    const isbn = req.params.isbn;
    const metadata = await fetchBookMetadataByISBN(isbn);
    if (!metadata) {
      return res.status(404).json({ error: 'Book metadata not found for this ISBN' });
    }
    res.json(metadata);
  } catch (err: any) {
    res.status(500).json({ error: 'Error fetching ISBN metadata' });
  }
}

export async function createBook(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const {
      isbn,
      title,
      author,
      publisher,
      edition,
      publication_year,
      description,
      genre,
      language,
      condition,
      cover_image,
      availability
    } = req.body;

    if (!title || !author || !genre || !condition) {
      return res.status(400).json({ error: 'Missing required book details (title, author, genre, condition)' });
    }

    const user = db.prepare('SELECT latitude, longitude FROM users WHERE id = ?').get(userId) as any;
    if (!user) return res.status(404).json({ error: 'User not found' });

    const id = 'bk_' + Math.random().toString(36).substr(2, 9);
    const now = new Date().toISOString();
    const status = availability || 'Available';
    const defaultCover = cover_image || `https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600`;

    db.prepare(`
      INSERT INTO books (
        id, owner_id, isbn, title, author, publisher, edition, publication_year,
        description, genre, language, condition, cover_image, status, latitude, longitude,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, userId, isbn || null, title, author, publisher || null, edition || null,
      publication_year || null, description || '', genre, language || 'English',
      condition, defaultCover, status, user.latitude, user.longitude, now, now
    );

    // Check wishlist matches across platform and notify users!
    const titleLower = title.toLowerCase();
    const wishlistMatches = db.prepare(`
      SELECT user_id FROM wishlist 
      WHERE LOWER(book_title) LIKE ? OR (isbn IS NOT NULL AND isbn = ?)
    `).all(`%${titleLower}%`, isbn || 'NO_ISBN') as any[];

    for (const match of wishlistMatches) {
      if (match.user_id !== userId) {
        const notifId = 'ntf_' + Math.random().toString(36).substr(2, 9);
        db.prepare(`
          INSERT INTO notifications (id, user_id, type, title, message, reference_id, created_at)
          VALUES (?, ?, 'WISHLIST_MATCH', ?, ?, ?, ?)
        `).run(
          notifId,
          match.user_id,
          'Wishlist Book Available!',
          `A book from your wishlist "${title}" is now available for swap nearby!`,
          id,
          now
        );
      }
    }

    const newBook = db.prepare('SELECT * FROM books WHERE id = ?').get(id);
    res.status(201).json({ message: 'Book created successfully', book: newBook });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error creating book' });
  }
}

export async function getBooks(req: AuthenticatedRequest, res: Response) {
  try {
    const {
      search,
      genre,
      language,
      condition,
      availability,
      radius,
      lat,
      lng,
      sort,
      limit = 20,
      offset = 0
    } = req.query as any;

    const userLat = lat ? parseFloat(lat) : (req.user ? (db.prepare('SELECT latitude FROM users WHERE id = ?').get(req.user.id) as any)?.latitude : 12.9716);
    const userLng = lng ? parseFloat(lng) : (req.user ? (db.prepare('SELECT longitude FROM users WHERE id = ?').get(req.user.id) as any)?.longitude : 77.5946);
    const radiusKm = radius ? parseFloat(radius) : 50;

    let query = `
      SELECT b.*, u.name as owner_name, u.rating as owner_rating, u.city as owner_city, u.profile_image as owner_image
      FROM books b
      JOIN users u ON b.owner_id = u.id
      WHERE u.is_suspended = 0
    `;
    const params: any[] = [];

    if (availability) {
      query += ` AND b.status = ?`;
      params.push(availability);
    } else {
      query += ` AND b.status = 'Available'`;
    }

    if (search) {
      query += ` AND (b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ? OR b.genre LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    if (genre && genre !== 'All') {
      query += ` AND b.genre = ?`;
      params.push(genre);
    }

    if (language && language !== 'All') {
      query += ` AND b.language = ?`;
      params.push(language);
    }

    if (condition && condition !== 'All') {
      query += ` AND b.condition = ?`;
      params.push(condition);
    }

    const allMatching = db.prepare(query).all(...params) as any[];

    // Calculate distance and filter by radius
    let results = allMatching.map(book => {
      const dist = calculateHaversineDistance(userLat || 12.9716, userLng || 77.5946, book.latitude, book.longitude);
      const blurred = blurCoordinates(book.latitude, book.longitude);
      return {
        ...book,
        latitude: blurred.lat,
        longitude: blurred.lon,
        distanceKm: dist
      };
    }).filter(b => b.distanceKm <= radiusKm);

    // Sorting
    if (sort === 'Nearest') {
      results.sort((a, b) => a.distanceKm - b.distanceKm);
    } else if (sort === 'Recently Added') {
      results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sort === 'Best Rated Owner') {
      results.sort((a, b) => (b.owner_rating || 0) - (a.owner_rating || 0));
    } else if (sort === 'Most Requested') {
      results.sort((a, b) => (b.swap_requests_count || 0) - (a.swap_requests_count || 0));
    }

    const paginated = results.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    res.json({
      total: results.length,
      books: paginated
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Error fetching books' });
  }
}

export async function getNearbyBooks(req: Request, res: Response) {
  try {
    const { lat, lng, radius = 10, limit = 20 } = req.query as any;
    const userLat = parseFloat(lat || '12.9716');
    const userLng = parseFloat(lng || '77.5946');
    const radiusKm = parseFloat(radius);

    const query = `
      SELECT b.*, u.name as owner_name, u.rating as owner_rating, u.city as owner_city
      FROM books b
      JOIN users u ON b.owner_id = u.id
      WHERE b.status = 'Available' AND u.is_suspended = 0
    `;
    const books = db.prepare(query).all() as any[];

    const nearby = books.map(book => {
      const dist = calculateHaversineDistance(userLat, userLng, book.latitude, book.longitude);
      const blurred = blurCoordinates(book.latitude, book.longitude);
      return {
        ...book,
        latitude: blurred.lat, // Never expose exact coordinates!
        longitude: blurred.lon,
        distanceKm: dist
      };
    }).filter(b => b.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, parseInt(limit));

    res.json({ books: nearby, radiusKm });
  } catch (err: any) {
    res.status(500).json({ error: 'Error fetching nearby books' });
  }
}

export async function getRecommended(req: AuthenticatedRequest, res: Response) {
  try {
    const { lat, lng, radius = 25 } = req.query as any;
    let userLat = lat ? parseFloat(lat) : 12.9716;
    let userLng = lng ? parseFloat(lng) : 77.5946;

    if (req.user) {
      const user = db.prepare('SELECT latitude, longitude FROM users WHERE id = ?').get(req.user.id) as any;
      if (user) {
        userLat = user.latitude;
        userLng = user.longitude;
      }
    }

    const recommendations = getRecommendedBooks(req.user?.id, userLat, userLng, parseFloat(radius), 12);
    res.json({ recommendations });
  } catch (err: any) {
    res.status(500).json({ error: 'Error fetching recommendations' });
  }
}

export async function getBookById(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    // Increment views
    db.prepare('UPDATE books SET views = views + 1 WHERE id = ?').run(id);

    const book = db.prepare(`
      SELECT b.*, u.name as owner_name, u.rating as owner_rating, u.completed_swaps as owner_completed_swaps,
             u.city as owner_city, u.profile_image as owner_image, u.created_at as owner_joined
      FROM books b
      JOIN users u ON b.owner_id = u.id
      WHERE b.id = ?
    `).get(id) as any;

    if (!book) return res.status(404).json({ error: 'Book not found' });

    let distanceKm: number | null = null;
    if (req.user) {
      const currentUser = db.prepare('SELECT latitude, longitude FROM users WHERE id = ?').get(req.user.id) as any;
      if (currentUser) {
        distanceKm = calculateHaversineDistance(currentUser.latitude, currentUser.longitude, book.latitude, book.longitude);
      }
    }

    const blurred = blurCoordinates(book.latitude, book.longitude);
    book.latitude = blurred.lat;
    book.longitude = blurred.lon;

    // Owner's other books
    const ownerOtherBooks = db.prepare(`
      SELECT * FROM books WHERE owner_id = ? AND id != ? AND status = 'Available' LIMIT 4
    `).all(book.owner_id, id);

    res.json({ book, distanceKm, ownerOtherBooks });
  } catch (err: any) {
    res.status(500).json({ error: 'Error fetching book details' });
  }
}

export async function updateBook(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const book = db.prepare('SELECT * FROM books WHERE id = ?').get(id) as any;
    if (!book) return res.status(404).json({ error: 'Book not found' });
    if (book.owner_id !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to edit this book' });
    }

    const {
      title, author, publisher, edition, publication_year,
      description, genre, language, condition, cover_image, status
    } = req.body;

    const now = new Date().toISOString();

    db.prepare(`
      UPDATE books
      SET title = ?, author = ?, publisher = ?, edition = ?, publication_year = ?,
          description = ?, genre = ?, language = ?, condition = ?, cover_image = ?,
          status = ?, updated_at = ?
      WHERE id = ?
    `).run(
      title || book.title, author || book.author, publisher || book.publisher,
      edition || book.edition, publication_year || book.publication_year,
      description || book.description, genre || book.genre, language || book.language,
      condition || book.condition, cover_image || book.cover_image, status || book.status,
      now, id
    );

    const updatedBook = db.prepare('SELECT * FROM books WHERE id = ?').get(id);
    res.json({ message: 'Book updated successfully', book: updatedBook });
  } catch (err: any) {
    res.status(500).json({ error: 'Error updating book' });
  }
}

export async function deleteBook(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const book = db.prepare('SELECT * FROM books WHERE id = ?').get(id) as any;
    if (!book) return res.status(404).json({ error: 'Book not found' });
    if (book.owner_id !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to delete this book' });
    }

    // Check active swap requests
    const activeSwaps = db.prepare(`
      SELECT si.swap_request_id FROM swap_items si
      JOIN swap_requests sr ON si.swap_request_id = sr.id
      WHERE si.book_id = ? AND sr.status IN ('PENDING', 'ACCEPTED', 'MEETUP_PENDING', 'MEETUP_CONFIRMED')
    `).all(id);

    if (activeSwaps.length > 0) {
      return res.status(400).json({ error: 'Cannot delete book with active pending or accepted swap requests.' });
    }

    db.prepare('DELETE FROM books WHERE id = ?').run(id);
    res.json({ message: 'Book removed successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Error deleting book' });
  }
}
