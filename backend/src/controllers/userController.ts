import { Response } from 'express';
import { db } from '../database/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { blurCoordinates, calculateHaversineDistance } from '../utils/haversine';

export async function updateProfile(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { name, phone, bio, city, state, country, latitude, longitude, location_visibility, interested_genres, profile_image } = req.body;

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
    if (!user) return res.status(404).json({ error: 'User not found' });

    const updatedName = name !== undefined ? name : user.name;
    const updatedPhone = phone !== undefined ? phone : user.phone;
    const updatedBio = bio !== undefined ? bio : user.bio;
    const updatedCity = city !== undefined ? city : user.city;
    const updatedState = state !== undefined ? state : user.state;
    const updatedCountry = country !== undefined ? country : user.country;
    const updatedLat = latitude !== undefined ? latitude : user.latitude;
    const updatedLon = longitude !== undefined ? longitude : user.longitude;
    const updatedVis = location_visibility !== undefined ? location_visibility : user.location_visibility;
    const updatedGenres = interested_genres !== undefined ? JSON.stringify(interested_genres) : user.interested_genres;
    const updatedImage = profile_image !== undefined ? profile_image : user.profile_image;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE users
      SET name = ?, phone = ?, bio = ?, city = ?, state = ?, country = ?,
          latitude = ?, longitude = ?, location_visibility = ?, interested_genres = ?,
          profile_image = ?, updated_at = ?
      WHERE id = ?
    `).run(
      updatedName, updatedPhone, updatedBio, updatedCity, updatedState, updatedCountry,
      updatedLat, updatedLon, updatedVis, updatedGenres, updatedImage, now, userId
    );

    // Update coordinates on user's available books if location changed
    if (latitude !== undefined || longitude !== undefined) {
      db.prepare(`UPDATE books SET latitude = ?, longitude = ? WHERE owner_id = ?`).run(updatedLat, updatedLon, userId);
    }

    const updatedUser = db.prepare('SELECT id, name, email, phone, profile_image, bio, city, state, country, latitude, longitude, location_visibility, rating, completed_swaps, role, interested_genres FROM users WHERE id = ?').get(userId);

    res.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error updating profile' });
  }
}

export async function getUserPublicProfile(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;

    const user = db.prepare(`
      SELECT id, name, profile_image, bio, city, state, country, latitude, longitude,
             rating, completed_swaps, created_at, interested_genres
      FROM users WHERE id = ? AND is_suspended = 0
    `).get(id) as any;

    if (!user) return res.status(404).json({ error: 'User not found' });

    // Calculate distance if current user is logged in
    let distanceKm: number | null = null;
    if (currentUserId) {
      const currentUser = db.prepare('SELECT latitude, longitude FROM users WHERE id = ?').get(currentUserId) as any;
      if (currentUser) {
        distanceKm = calculateHaversineDistance(currentUser.latitude, currentUser.longitude, user.latitude, user.longitude);
      }
    }

    // Blur exact coordinates for privacy protection!
    const blurredLoc = blurCoordinates(user.latitude, user.longitude);
    user.latitude = blurredLoc.lat;
    user.longitude = blurredLoc.lon;

    // Fetch user's available books
    const books = db.prepare(`SELECT * FROM books WHERE owner_id = ? AND status = 'Available'`).all(id);

    // Fetch user reviews
    const reviews = db.prepare(`
      SELECT r.*, u.name as reviewer_name, u.profile_image as reviewer_image
      FROM reviews r
      JOIN users u ON r.reviewer_id = u.id
      WHERE r.reviewee_id = ?
      ORDER BY r.created_at DESC
    `).all(id);

    res.json({
      user,
      distanceKm,
      availableBooks: books,
      reviews
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Error fetching user profile' });
  }
}

export async function blockUser(req: AuthenticatedRequest, res: Response) {
  try {
    const blockerId = req.user!.id;
    const { id: blockedId } = req.params;

    if (blockerId === blockedId) {
      return res.status(400).json({ error: 'You cannot block yourself' });
    }

    const id = 'blk_' + Math.random().toString(36).substr(2, 9);
    const now = new Date().toISOString();

    db.prepare(`INSERT OR IGNORE INTO user_blocks (id, blocker_id, blocked_id, created_at) VALUES (?, ?, ?, ?)`).run(
      id, blockerId, blockedId, now
    );

    res.json({ message: 'User blocked successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Error blocking user' });
  }
}
