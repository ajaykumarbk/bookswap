import { db } from '../database/db';
import { calculateHaversineDistance } from '../utils/haversine';

export interface BookRecommendation {
  book: any;
  recommendationScore: number;
  matchReasons: {
    wishlistMatch: boolean;
    wishlistScore: number;
    genreScore: number;
    distanceScore: number;
    ratingScore: number;
  };
  distanceKm: number;
}

export function getRecommendedBooks(
  userId: string | undefined,
  userLat: number,
  userLon: number,
  maxRadiusKm: number = 25,
  limit: number = 12
): BookRecommendation[] {
  // Fetch all available books not owned by current user
  let query = `
    SELECT b.*, u.name as owner_name, u.rating as owner_rating, u.completed_swaps as owner_completed_swaps,
           u.city as owner_city, u.profile_image as owner_image
    FROM books b
    JOIN users u ON b.owner_id = u.id
    WHERE b.status = 'Available' AND u.is_suspended = 0
  `;
  const params: any[] = [];

  if (userId) {
    query += ` AND b.owner_id != ?`;
    params.push(userId);
  }

  const books = db.prepare(query).all(...params) as any[];

  // Fetch user wishlist and genre preferences if logged in
  let wishlistTitles: string[] = [];
  let userGenres: string[] = [];

  if (userId) {
    const user = db.prepare(`SELECT interested_genres FROM users WHERE id = ?`).get(userId) as any;
    if (user && user.interested_genres) {
      try {
        userGenres = JSON.parse(user.interested_genres);
      } catch (e) {}
    }

    const wishlistItems = db.prepare(`SELECT book_title, author, isbn FROM wishlist WHERE user_id = ?`).all(userId) as any[];
    wishlistTitles = wishlistItems.map(w => w.book_title.toLowerCase());
  }

  const recommendations: BookRecommendation[] = [];

  for (const book of books) {
    const distanceKm = calculateHaversineDistance(userLat, userLon, book.latitude, book.longitude);
    
    // Filter by radius if strict radius specified
    if (distanceKm > maxRadiusKm) continue;

    // 1. Wishlist Score (30%)
    let wishlistMatch = false;
    let wishlistScore = 0;
    const titleLower = book.title.toLowerCase();
    if (wishlistTitles.some(w => titleLower.includes(w) || w.includes(titleLower))) {
      wishlistMatch = true;
      wishlistScore = 30;
    }

    // 2. Genre Score (25%)
    let genreScore = 0;
    if (userGenres.length > 0) {
      if (userGenres.some(g => g.toLowerCase() === book.genre.toLowerCase())) {
        genreScore = 25;
      } else {
        genreScore = 10;
      }
    } else {
      genreScore = 15; // Neutral baseline score
    }

    // 3. Distance Score (20%) - Max 20 points for < 2km, decaying to 0 points at maxRadiusKm
    let distanceScore = Math.max(0, Math.round(20 * (1 - distanceKm / maxRadiusKm)));

    // 4. Rating & Popularity Score (10% + 15% popularity)
    const ownerRating = book.owner_rating || 4.5;
    const ratingScore = Math.round((ownerRating / 5.0) * 15);
    const viewsScore = Math.min(10, Math.round((book.views || 0) / 5));

    const totalScore = wishlistScore + genreScore + distanceScore + ratingScore + viewsScore;

    recommendations.push({
      book,
      recommendationScore: Math.min(100, totalScore),
      matchReasons: {
        wishlistMatch,
        wishlistScore,
        genreScore,
        distanceScore,
        ratingScore: ratingScore + viewsScore
      },
      distanceKm
    });
  }

  // Sort by highest recommendation score
  recommendations.sort((a, b) => b.recommendationScore - a.recommendationScore);

  return recommendations.slice(0, limit);
}
