export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  profile_image?: string;
  bio?: string;
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  location_visibility?: string;
  email_verified?: number;
  phone_verified?: number;
  rating: number;
  completed_swaps: number;
  role: 'user' | 'admin';
  is_suspended?: number;
  interested_genres?: string; // JSON string or parsed array
  created_at: string;
}

export interface Book {
  id: string;
  owner_id: string;
  isbn?: string;
  title: string;
  author: string;
  publisher?: string;
  edition?: string;
  publication_year?: number;
  description?: string;
  genre: string;
  language: string;
  condition: 'New' | 'Like New' | 'Very Good' | 'Good' | 'Acceptable' | 'Poor';
  cover_image?: string;
  status: 'Available' | 'Reserved' | 'Swapped' | 'Not Available';
  latitude: number;
  longitude: number;
  views: number;
  swap_requests_count?: number;
  distanceKm?: number;
  owner_name?: string;
  owner_email?: string;
  owner_rating?: number;
  owner_completed_swaps?: number;
  owner_city?: string;
  owner_image?: string;
  created_at: string;
  updated_at: string;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  book_title: string;
  author?: string;
  isbn?: string;
  availableNearbyCount?: number;
  matchingBooks?: Book[];
  created_at: string;
}

export type SwapStatus = 
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'COUNTER_OFFERED'
  | 'MEETUP_PENDING'
  | 'MEETUP_CONFIRMED'
  | 'EXCHANGE_COMPLETED'
  | 'RATED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'DISPUTED';

export interface SwapItem {
  id: string;
  swap_request_id: string;
  book_id: string;
  user_id: string;
  direction: 'OFFERED' | 'REQUESTED';
  title: string;
  author: string;
  cover_image?: string;
  condition?: string;
  genre?: string;
  current_owner_id?: string;
}

export interface Meetup {
  id: string;
  swap_request_id: string;
  date: string;
  time: string;
  location_name: string;
  notes?: string;
  user_a_confirmed: number;
  user_b_confirmed: number;
  created_at: string;
}

export interface SwapRequest {
  id: string;
  requester_id: string;
  owner_id: string;
  status: SwapStatus;
  message?: string;
  counter_offered_by?: string;
  requester_name?: string;
  requester_image?: string;
  requester_rating?: number;
  requester_city?: string;
  owner_name?: string;
  owner_image?: string;
  owner_rating?: number;
  owner_city?: string;
  offeredItems: SwapItem[];
  requestedItems: SwapItem[];
  meetup?: Meetup;
  reviews?: Review[];
  created_at: string;
  updated_at: string;
  expires_at?: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  swap_request_id: string;
  message: string;
  attachment_url?: string;
  sender_name?: string;
  sender_image?: string;
  created_at: string;
  read_at?: string;
}

export interface Review {
  id: string;
  swap_request_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment?: string;
  tags?: string; // JSON array string
  reviewer_name?: string;
  reviewer_image?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  reference_id?: string;
  is_read: number;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  reported_user_id?: string;
  reported_book_id?: string;
  reason: string;
  description: string;
  status: 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';
  admin_notes?: string;
  reporter_name?: string;
  reporter_email?: string;
  reported_user_name?: string;
  reported_user_email?: string;
  reported_book_title?: string;
  created_at: string;
  resolved_at?: string;
}

export interface BookRecommendation {
  book: Book;
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
