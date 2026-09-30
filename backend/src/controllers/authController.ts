import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../database/db';
import { generateToken } from '../utils/jwt';
import { AuthenticatedRequest } from '../middleware/auth';

export async function register(req: Request, res: Response) {
  try {
    const {
      name,
      email,
      password,
      phone,
      city,
      state,
      country,
      latitude,
      longitude,
      interested_genres
    } = req.body;

    if (!name || !email || !password || !city || !state || !country) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const id = 'usr_' + Math.random().toString(36).substr(2, 9);
    const now = new Date().toISOString();
    const defaultLat = latitude || 12.9716;
    const defaultLon = longitude || 77.5946;

    db.prepare(`
      INSERT INTO users (
        id, name, email, password_hash, phone, city, state, country,
        latitude, longitude, interested_genres, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      name,
      email,
      password_hash,
      phone || null,
      city,
      state,
      country,
      defaultLat,
      defaultLon,
      interested_genres ? JSON.stringify(interested_genres) : '[]',
      now,
      now
    );

    const token = generateToken({ id, email, role: 'user' });
    const user = db.prepare('SELECT id, name, email, phone, city, state, country, latitude, longitude, rating, completed_swaps, role, interested_genres FROM users WHERE id = ?').get(id);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: err.message || 'Server error during registration' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.is_suspended) {
      return res.status(403).json({ error: 'Your account has been suspended by an administrator.' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken({ id: user.id, email: user.email, role: user.role });
    delete user.password_hash;

    res.json({
      message: 'Login successful',
      token,
      user
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error during login' });
  }
}

export async function googleLogin(req: Request, res: Response) {
  try {
    const { email, name, picture } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Google authentication failed' });
    }

    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
    const now = new Date().toISOString();

    if (!user) {
      const id = 'usr_' + Math.random().toString(36).substr(2, 9);
      const dummyPasswordHash = await bcrypt.hash('GoogleOAuthSecret' + Math.random(), 10);
      db.prepare(`
        INSERT INTO users (
          id, name, email, password_hash, profile_image, city, state, country,
          latitude, longitude, email_verified, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
      `).run(
        id,
        name || email.split('@')[0],
        email,
        dummyPasswordHash,
        picture || null,
        'Bengaluru',
        'Karnataka',
        'India',
        12.9716,
        77.5946,
        now,
        now
      );
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
    }

    if (user.is_suspended) {
      return res.status(403).json({ error: 'Your account has been suspended by an administrator.' });
    }

    const token = generateToken({ id: user.id, email: user.email, role: user.role });
    delete user.password_hash;

    res.json({
      message: 'Google login successful',
      token,
      user
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Server error during Google auth' });
  }
}

export async function getCurrentUser(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = db.prepare('SELECT id, name, email, phone, profile_image, bio, city, state, country, latitude, longitude, location_visibility, email_verified, phone_verified, rating, completed_swaps, role, is_suspended, interested_genres, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (err: any) {
    res.status(500).json({ error: 'Server error' });
  }
}
