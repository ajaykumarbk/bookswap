import fs from 'fs';
import path from 'path';
import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

// Embedded Fallback Storage
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const dbFilePath = path.join(dataDir, 'db_store.json');

interface Tables {
  users: any[];
  books: any[];
  wishlist: any[];
  swap_requests: any[];
  swap_items: any[];
  messages: any[];
  meetups: any[];
  reviews: any[];
  notifications: any[];
  reports: any[];
  audit_logs: any[];
  user_blocks: any[];
}

class DatabaseManager {
  private mode: 'mysql' | 'embedded' = 'embedded';
  private pool: mysql.Pool | null = null;
  private data: Tables = {
    users: [],
    books: [],
    wishlist: [],
    swap_requests: [],
    swap_items: [],
    messages: [],
    meetups: [],
    reviews: [],
    notifications: [],
    reports: [],
    audit_logs: [],
    user_blocks: []
  };

  constructor() {
    if (process.env.MYSQL_HOST && process.env.MYSQL_HOST !== '127.0.0.1_disabled') {
      try {
        const useSSL = process.env.MYSQL_SSL === 'true';
        this.pool = mysql.createPool({
          host: process.env.MYSQL_HOST,
          port: parseInt(process.env.MYSQL_PORT || '3306'),
          user: process.env.MYSQL_USER || 'admin',
          password: process.env.MYSQL_PASSWORD || '',
          database: process.env.MYSQL_DATABASE || 'bookswap',
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0,
          ssl: useSSL ? { rejectUnauthorized: false } : undefined
        });
        this.mode = 'mysql';
        console.log(`🔌 Initializing MySQL Connection Pool to ${process.env.MYSQL_HOST}:${process.env.MYSQL_PORT || 3306}...`);
      } catch (err) {
        console.warn('Could not initialize MySQL pool, using embedded store:', err);
        this.mode = 'embedded';
        this.loadEmbedded();
      }
    } else {
      this.mode = 'embedded';
      this.loadEmbedded();
    }
  }

  public getMode() {
    return this.mode;
  }

  private loadEmbedded() {
    if (fs.existsSync(dbFilePath)) {
      try {
        const raw = fs.readFileSync(dbFilePath, 'utf-8');
        this.data = JSON.parse(raw);
        for (const k of ['users','books','wishlist','swap_requests','swap_items','messages','meetups','reviews','notifications','reports','audit_logs','user_blocks'] as (keyof Tables)[]) {
          if (!this.data[k]) this.data[k] = [];
        }
      } catch (err) {
        console.error('Failed reading embedded store:', err);
      }
    }
  }

  public saveEmbedded() {
    if (this.mode === 'embedded') {
      try {
        fs.writeFileSync(dbFilePath, JSON.stringify(this.data, null, 2), 'utf-8');
      } catch (err) {}
    }
  }

  public pragma(query: string) {}
  public exec(query: string) {}

  public prepare(sql: string) {
    const self = this;
    const cleanSql = sql.replace(/\s+/g, ' ').trim();

    return {
      all(...params: any[]): any[] {
        if (self.mode === 'mysql' && self.pool) {
          return self.executeSelectSync(cleanSql, params);
        }
        return self.executeEmbeddedSelect(cleanSql, params);
      },
      get(...params: any[]): any {
        if (self.mode === 'mysql' && self.pool) {
          const res = self.executeSelectSync(cleanSql, params);
          return res.length > 0 ? res[0] : undefined;
        }
        const res = self.executeEmbeddedSelect(cleanSql, params);
        return res.length > 0 ? res[0] : undefined;
      },
      run(...params: any[]): { changes: number } {
        if (self.mode === 'mysql' && self.pool) {
          return self.executeUpdateSync(cleanSql, params);
        }
        return self.executeEmbeddedUpdate(cleanSql, params);
      }
    };
  }

  public transaction(fn: Function) {
    return (...args: any[]) => {
      const res = fn(...args);
      this.saveEmbedded();
      return res;
    };
  }

  // --- MySQL Execution Handlers ---
  private executeSelectSync(sql: string, params: any[]): any[] {
    try {
      // Map SQLite or generic placeholders if needed
      let formattedSql = sql.replace(/`condition`/g, '`condition`');
      if (formattedSql.toLowerCase().includes('from books b join users u')) {
        formattedSql = formattedSql.replace(/b\.condition/g, 'b.`condition`');
      }

      // De-async de-promise for synchronous prepare interface compatibility
      const deasync = require('deasync');
      let result: any[] = [];
      let done = false;
      let error: any = null;

      this.pool!.query(formattedSql, params, (err, rows: any) => {
        if (err) error = err;
        else result = Array.isArray(rows) ? rows : [];
        done = true;
      });

      deasync.loopWhile(() => !done);

      if (error) {
        // Fallback to embedded if MySQL query fails
        console.warn('MySQL Query Error:', error.message, 'falling back to embedded mode query');
        return this.executeEmbeddedSelect(sql, params);
      }

      return result;
    } catch (e: any) {
      return this.executeEmbeddedSelect(sql, params);
    }
  }

  private executeUpdateSync(sql: string, params: any[]): { changes: number } {
    try {
      let formattedSql = sql.replace(/`condition`/g, '`condition`');
      const deasync = require('deasync');
      let changes = 1;
      let done = false;
      let error: any = null;

      this.pool!.query(formattedSql, params, (err, res: any) => {
        if (err) error = err;
        else changes = res?.affectedRows || 1;
        done = true;
      });

      deasync.loopWhile(() => !done);

      if (error) {
        console.warn('MySQL Update Error:', error.message);
        return this.executeEmbeddedUpdate(sql, params);
      }

      return { changes };
    } catch (e) {
      return this.executeEmbeddedUpdate(sql, params);
    }
  }

  // --- Embedded DB Engine ---
  private executeEmbeddedSelect(sql: string, params: any[]): any[] {
    this.loadEmbedded();
    const lower = sql.toLowerCase();

    if (lower.includes('count(*)')) {
      let count = 0;
      let tableName = '';
      if (lower.includes('from users')) tableName = 'users';
      else if (lower.includes('from books')) tableName = 'books';
      else if (lower.includes('from swap_requests')) tableName = 'swap_requests';
      else if (lower.includes('from reports')) tableName = 'reports';
      else if (lower.includes('from notifications')) tableName = 'notifications';

      let list = (this.data as any)[tableName] || [];
      if (lower.includes('where user_id = ? and is_read = 0')) {
        list = list.filter((n: any) => n.user_id === params[0] && (n.is_read === 0 || n.is_read === false));
      } else if (lower.includes('where is_suspended = 0')) {
        list = list.filter((u: any) => !u.is_suspended);
      } else if (lower.includes('where status = \'available\'')) {
        list = list.filter((b: any) => b.status === 'Available');
      } else if (lower.includes('where status in (\'exchange_completed\', \'rated\')')) {
        list = list.filter((s: any) => s.status === 'EXCHANGE_COMPLETED' || s.status === 'RATED');
      } else if (lower.includes('where status = \'pending\'')) {
        list = list.filter((s: any) => s.status === 'PENDING');
      } else if (lower.includes('where is_suspended = 1')) {
        list = list.filter((u: any) => u.is_suspended);
      }
      return [{ count: list.length }];
    }

    if (lower.includes('from users')) {
      let result = [...this.data.users];
      if (lower.includes('where email = ?')) {
        result = result.filter(u => u.email === params[0]);
      } else if (lower.includes('where id = ?')) {
        result = result.filter(u => u.id === params[0]);
      } else if (lower.includes('where id = ? and is_suspended = 0')) {
        result = result.filter(u => u.id === params[0] && !u.is_suspended);
      }
      return result;
    }

    if (lower.includes('from books')) {
      let result = [...this.data.books];
      if (lower.includes('where id = ?')) {
        result = result.filter(b => b.id === params[0]);
      } else if (lower.includes('where owner_id = ?')) {
        const ownerId = params[0];
        result = result.filter(b => b.owner_id === ownerId);
        if (lower.includes('and status = \'available\'')) {
          result = result.filter(b => b.status === 'Available');
        }
        if (lower.includes('and id != ?')) {
          const excludeId = params[1];
          result = result.filter(b => b.id !== excludeId);
        }
      }

      if (lower.includes('b.status = \'available\'')) {
        result = result.filter(b => b.status === 'Available');
      }

      let paramIdx = 0;
      if (lower.includes('b.owner_id != ?')) {
        const exclOwner = params[paramIdx++];
        result = result.filter(b => b.owner_id !== exclOwner);
      }
      if (lower.includes('b.status = ?')) {
        const st = params[paramIdx++];
        result = result.filter(b => b.status === st);
      }
      if (lower.includes('b.title like ? or b.author like ?')) {
        const term = (params[paramIdx] || '').toString().replace(/%/g, '').toLowerCase();
        paramIdx += 4;
        result = result.filter(b => 
          b.title.toLowerCase().includes(term) ||
          b.author.toLowerCase().includes(term) ||
          (b.isbn && b.isbn.toLowerCase().includes(term)) ||
          b.genre.toLowerCase().includes(term)
        );
      }
      if (lower.includes('b.genre = ?')) {
        const g = params[paramIdx++];
        result = result.filter(b => b.genre === g);
      }
      if (lower.includes('b.language = ?')) {
        const l = params[paramIdx++];
        result = result.filter(b => b.language === l);
      }
      if (lower.includes('b.condition = ?')) {
        const c = params[paramIdx++];
        result = result.filter(b => b.condition === c);
      }

      return result.map(b => {
        const owner = this.data.users.find(u => u.id === b.owner_id) || {};
        return {
          ...b,
          owner_name: owner.name || 'Anonymous',
          owner_email: owner.email || '',
          owner_rating: owner.rating || 5.0,
          owner_completed_swaps: owner.completed_swaps || 0,
          owner_city: owner.city || 'Local',
          owner_image: owner.profile_image || null,
          owner_joined: owner.created_at || new Date().toISOString()
        };
      });
    }

    if (lower.includes('from wishlist')) {
      let result = [...this.data.wishlist];
      if (lower.includes('where user_id = ?')) {
        result = result.filter(w => w.user_id === params[0]);
      } else if (lower.includes('lower(book_title) like ?')) {
        const term = (params[0] || '').toString().replace(/%/g, '').toLowerCase();
        const isbn = params[1];
        result = result.filter(w => (w.book_title && w.book_title.toLowerCase().includes(term)) || (w.isbn && w.isbn === isbn));
      } else if (lower.includes('where id = ?')) {
        result = result.filter(w => w.id === params[0]);
      }
      return result;
    }

    if (lower.includes('from swap_requests')) {
      let result = [...this.data.swap_requests];
      if (lower.includes('where sr.id = ?') || lower.includes('where id = ?')) {
        const id = params[0];
        result = result.filter(s => s.id === id);
      } else if (lower.includes('requester_id = ? and owner_id = ?')) {
        result = result.filter(s => s.requester_id === params[0] && s.owner_id === params[1]);
      } else if (lower.includes('requester_id = ? or owner_id = ?') || lower.includes('sr.requester_id = ? or sr.owner_id = ?')) {
        const uId = params[0];
        result = result.filter(s => s.requester_id === uId || s.owner_id === uId);
      } else if (lower.includes('sr.owner_id = ?')) {
        result = result.filter(s => s.owner_id === params[0]);
      } else if (lower.includes('sr.requester_id = ?')) {
        result = result.filter(s => s.requester_id === params[0]);
      }

      if (lower.includes('sr.status = ?')) {
        const st = params[params.length - 1];
        result = result.filter(s => s.status === st);
      }

      return result.map(s => {
        const reqUser = this.data.users.find(u => u.id === s.requester_id) || {};
        const ownUser = this.data.users.find(u => u.id === s.owner_id) || {};
        return {
          ...s,
          requester_name: reqUser.name || 'Requester',
          requester_image: reqUser.profile_image || null,
          requester_rating: reqUser.rating || 5.0,
          requester_city: reqUser.city || 'City',
          owner_name: ownUser.name || 'Owner',
          owner_image: ownUser.profile_image || null,
          owner_rating: ownUser.rating || 5.0,
          owner_city: ownUser.city || 'City'
        };
      });
    }

    if (lower.includes('from swap_items')) {
      let result = [...this.data.swap_items];
      let pIdx = 0;
      if (lower.includes('swap_request_id = ?')) {
        const sId = params[pIdx++];
        result = result.filter(i => i.swap_request_id === sId);
      }
      if (lower.includes('book_id = ?')) {
        const bId = params[pIdx++];
        result = result.filter(i => i.book_id === bId);
      }

      return result.map(i => {
        const book = this.data.books.find(b => b.id === i.book_id) || {};
        return {
          ...i,
          title: book.title || 'Unknown Title',
          author: book.author || 'Unknown Author',
          cover_image: book.cover_image || '',
          condition: book.condition || 'Good',
          genre: book.genre || 'General',
          current_owner_id: book.owner_id
        };
      });
    }

    if (lower.includes('from messages')) {
      let result = [...this.data.messages];
      if (lower.includes('where m.swap_request_id = ?') || lower.includes('where swap_request_id = ?')) {
        result = result.filter(m => m.swap_request_id === params[0]);
      } else if (lower.includes('where id = ?')) {
        result = result.filter(m => m.id === params[0]);
      }

      return result.map(m => {
        const sender = this.data.users.find(u => u.id === m.sender_id) || {};
        return {
          ...m,
          sender_name: sender.name || 'User',
          sender_image: sender.profile_image || null
        };
      });
    }

    if (lower.includes('from meetups')) {
      let result = [...this.data.meetups];
      if (lower.includes('where swap_request_id = ?')) {
        result = result.filter(m => m.swap_request_id === params[0]);
      }
      return result;
    }

    if (lower.includes('from reviews')) {
      let result = [...this.data.reviews];
      if (lower.includes('where r.reviewee_id = ?') || lower.includes('where reviewee_id = ?')) {
        result = result.filter(r => r.reviewee_id === params[0]);
      } else if (lower.includes('where swap_request_id = ?')) {
        result = result.filter(r => r.swap_request_id === params[0]);
        if (lower.includes('and reviewer_id = ?')) {
          result = result.filter(r => r.reviewer_id === params[1]);
        }
      }

      return result.map(r => {
        const reviewer = this.data.users.find(u => u.id === r.reviewer_id) || {};
        return {
          ...r,
          reviewer_name: reviewer.name || 'Reviewer',
          reviewer_image: reviewer.profile_image || null
        };
      });
    }

    if (lower.includes('from notifications')) {
      let result = [...this.data.notifications];
      if (lower.includes('where user_id = ?')) {
        result = result.filter(n => n.user_id === params[0]);
      }
      return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    if (lower.includes('from reports')) {
      let result = [...this.data.reports];
      return result.map(r => {
        const reporter = this.data.users.find(u => u.id === r.reporter_id) || {};
        const reportedUser = this.data.users.find(u => u.id === r.reported_user_id) || {};
        const reportedBook = this.data.books.find(b => b.id === r.reported_book_id) || {};
        return {
          ...r,
          reporter_name: reporter.name || 'Reporter',
          reporter_email: reporter.email || '',
          reported_user_name: reportedUser.name || 'User',
          reported_user_email: reportedUser.email || '',
          reported_book_title: reportedBook.title || 'N/A'
        };
      });
    }

    if (lower.includes('from audit_logs')) {
      let result = [...this.data.audit_logs];
      return result.map(a => {
        const user = this.data.users.find(u => u.id === a.user_id) || {};
        return {
          ...a,
          user_name: user.name || 'System',
          user_email: user.email || 'system@bookswap.org'
        };
      }).sort((x, y) => new Date(y.created_at).getTime() - new Date(x.created_at).getTime());
    }

    if (lower.includes('from user_blocks')) {
      return [...this.data.user_blocks];
    }

    return [];
  }

  private executeEmbeddedUpdate(sql: string, params: any[]): { changes: number } {
    this.loadEmbedded();
    const lower = sql.toLowerCase();

    if (lower.includes('insert into users')) {
      const u = {
        id: params[0], name: params[1], email: params[2], password_hash: params[3], phone: params[4],
        city: params[5], state: params[6], country: params[7], latitude: params[8], longitude: params[9],
        interested_genres: params[10], created_at: params[11], updated_at: params[12],
        profile_image: params[4] && params[4].startsWith('http') ? params[4] : null,
        bio: '', rating: 5.0, completed_swaps: 0, role: 'user', is_suspended: 0
      };
      const idx = this.data.users.findIndex(x => x.email === u.email);
      if (idx >= 0) this.data.users[idx] = { ...this.data.users[idx], ...u };
      else this.data.users.push(u);
      this.saveEmbedded();
      return { changes: 1 };
    }

    if (lower.includes('insert into books')) {
      const b = {
        id: params[0], owner_id: params[1], isbn: params[2], title: params[3], author: params[4],
        publisher: params[5], edition: params[6], publication_year: params[7], description: params[8],
        genre: params[9], language: params[10], condition: params[11], cover_image: params[12],
        status: params[13], latitude: params[14], longitude: params[15], views: 0, swap_requests_count: 0,
        created_at: params[16], updated_at: params[17]
      };
      this.data.books.push(b);
      this.saveEmbedded();
      return { changes: 1 };
    }

    if (lower.includes('insert into wishlist')) {
      const w = { id: params[0], user_id: params[1], book_title: params[2], author: params[3], isbn: params[4], created_at: params[5] };
      this.data.wishlist.push(w);
      this.saveEmbedded();
      return { changes: 1 };
    }

    if (lower.includes('insert into swap_requests')) {
      const s = { id: params[0], requester_id: params[1], owner_id: params[2], status: params[3], message: params[4], created_at: params[5], updated_at: params[6], expires_at: params[7] };
      this.data.swap_requests.push(s);
      this.saveEmbedded();
      return { changes: 1 };
    }

    if (lower.includes('insert into swap_items')) {
      const i = { id: params[0], swap_request_id: params[1], book_id: params[2], user_id: params[3], direction: params[4] };
      this.data.swap_items.push(i);
      this.saveEmbedded();
      return { changes: 1 };
    }

    if (lower.includes('insert into messages')) {
      const m = { id: params[0], sender_id: params[1], receiver_id: params[2], swap_request_id: params[3], message: params[4], attachment_url: params[5], created_at: params[6], read_at: null };
      this.data.messages.push(m);
      this.saveEmbedded();
      return { changes: 1 };
    }

    if (lower.includes('insert into meetups')) {
      const m = { id: params[0], swap_request_id: params[1], date: params[2], time: params[3], location_name: params[4], notes: params[5], user_a_confirmed: params[6], user_b_confirmed: params[7], created_at: params[8] };
      this.data.meetups.push(m);
      this.saveEmbedded();
      return { changes: 1 };
    }

    if (lower.includes('insert into reviews')) {
      const r = { id: params[0], swap_request_id: params[1], reviewer_id: params[2], reviewee_id: params[3], rating: params[4], comment: params[5], tags: params[6], created_at: params[7] };
      this.data.reviews.push(r);
      this.saveEmbedded();
      return { changes: 1 };
    }

    if (lower.includes('insert into notifications')) {
      const n = { id: params[0], user_id: params[1], type: params[2], title: params[3], message: params[4], reference_id: params[5], is_read: 0, created_at: params[6] };
      this.data.notifications.push(n);
      this.saveEmbedded();
      return { changes: 1 };
    }

    if (lower.includes('insert into reports')) {
      const r = { id: params[0], reporter_id: params[1], reported_user_id: params[2], reported_book_id: params[3], reason: params[4], description: params[5], status: params[6], created_at: params[7] };
      this.data.reports.push(r);
      this.saveEmbedded();
      return { changes: 1 };
    }

    if (lower.includes('insert into audit_logs')) {
      const a = { id: params[0], user_id: params[1], action: params[2], details: params[3], created_at: params[4] };
      this.data.audit_logs.push(a);
      this.saveEmbedded();
      return { changes: 1 };
    }

    if (lower.includes('insert or ignore into user_blocks')) {
      const b = { id: params[0], blocker_id: params[1], blocked_id: params[2], created_at: params[3] };
      if (!this.data.user_blocks.some(x => x.blocker_id === b.blocker_id && x.blocked_id === b.blocked_id)) {
        this.data.user_blocks.push(b);
      }
      this.saveEmbedded();
      return { changes: 1 };
    }

    if (lower.includes('update users')) {
      if (lower.includes('set name = ?')) {
        const userId = params[12];
        const u = this.data.users.find(x => x.id === userId);
        if (u) {
          u.name = params[0]; u.phone = params[1]; u.bio = params[2]; u.city = params[3];
          u.state = params[4]; u.country = params[5]; u.latitude = params[6]; u.longitude = params[7];
          u.location_visibility = params[8]; u.interested_genres = params[9]; u.profile_image = params[10];
          u.updated_at = params[11];
        }
      } else if (lower.includes('set rating = ?')) {
        const u = this.data.users.find(x => x.id === params[1]);
        if (u) u.rating = params[0];
      } else if (lower.includes('set completed_swaps = completed_swaps + 1')) {
        const u = this.data.users.find(x => x.id === params[0]);
        if (u) u.completed_swaps = (u.completed_swaps || 0) + 1;
      } else if (lower.includes('set is_suspended = ?')) {
        const u = this.data.users.find(x => x.id === params[2]);
        if (u) { u.is_suspended = params[0]; u.updated_at = params[1]; }
      }
      this.saveEmbedded();
      return { changes: 1 };
    }

    if (lower.includes('update books')) {
      if (lower.includes('set views = views + 1')) {
        const b = this.data.books.find(x => x.id === params[0]);
        if (b) b.views = (b.views || 0) + 1;
      } else if (lower.includes('set swap_requests_count = swap_requests_count + 1')) {
        const b = this.data.books.find(x => x.id === params[0]);
        if (b) b.swap_requests_count = (b.swap_requests_count || 0) + 1;
      } else if (lower.includes('set status = ?')) {
        if (lower.includes('where id = ? and status = \'reserved\'')) {
          const b = this.data.books.find(x => x.id === params[0] && x.status === 'Reserved');
          if (b) b.status = 'Available';
        } else if (lower.includes('set owner_id = ?')) {
          const b = this.data.books.find(x => x.id === params[2]);
          if (b) { b.owner_id = params[0]; b.status = params[1]; b.updated_at = new Date().toISOString(); }
        } else {
          const b = this.data.books.find(x => x.id === params[0]);
          if (b) b.status = 'Reserved';
        }
      } else if (lower.includes('set title = ?')) {
        const b = this.data.books.find(x => x.id === params[12]);
        if (b) {
          b.title = params[0]; b.author = params[1]; b.publisher = params[2]; b.edition = params[3];
          b.publication_year = params[4]; b.description = params[5]; b.genre = params[6];
          b.language = params[7]; b.condition = params[8]; b.cover_image = params[9]; b.status = params[10];
          b.updated_at = params[11];
        }
      } else if (lower.includes('set latitude = ?, longitude = ?')) {
        const uId = params[2];
        for (const b of this.data.books) {
          if (b.owner_id === uId) { b.latitude = params[0]; b.longitude = params[1]; }
        }
      }
      this.saveEmbedded();
      return { changes: 1 };
    }

    if (lower.includes('update swap_requests')) {
      const sId = params[params.length - 1];
      const s = this.data.swap_requests.find(x => x.id === sId);
      if (s) {
        if (lower.includes('set status = \'accepted\'')) {
          s.status = 'ACCEPTED'; s.updated_at = params[0];
        } else if (lower.includes('set status = \'rejected\'')) {
          s.status = 'REJECTED'; s.updated_at = params[0];
        } else if (lower.includes('set status = \'counter_offered\'')) {
          s.status = 'COUNTER_OFFERED'; s.counter_offered_by = params[0]; s.message = params[1]; s.updated_at = params[2];
        } else if (lower.includes('set status = \'meetup_pending\'')) {
          s.status = 'MEETUP_PENDING'; s.updated_at = params[0];
        } else if (lower.includes('set status = \'meetup_confirmed\'')) {
          s.status = 'MEETUP_CONFIRMED'; s.updated_at = params[0];
        } else if (lower.includes('set status = \'exchange_completed\'')) {
          s.status = 'EXCHANGE_COMPLETED'; s.updated_at = params[0];
        } else if (lower.includes('set status = \'rated\'')) {
          s.status = 'RATED'; s.updated_at = params[0];
        } else if (lower.includes('set status = \'cancelled\'')) {
          s.status = 'CANCELLED'; s.updated_at = params[0];
        }
      }
      this.saveEmbedded();
      return { changes: 1 };
    }

    if (lower.includes('update meetups')) {
      const m = this.data.meetups.find(x => x.id === params[params.length - 1]);
      if (m) {
        if (lower.includes('set date = ?')) {
          m.date = params[0]; m.time = params[1]; m.location_name = params[2]; m.notes = params[3];
          m.user_a_confirmed = params[4]; m.user_b_confirmed = params[5];
        } else if (lower.includes('set user_a_confirmed = ?')) {
          m.user_a_confirmed = params[0]; m.user_b_confirmed = params[1];
        }
      }
      this.saveEmbedded();
      return { changes: 1 };
    }

    if (lower.includes('update messages')) {
      if (lower.includes('set read_at = ?')) {
        for (const m of this.data.messages) {
          if (m.swap_request_id === params[1] && m.receiver_id === params[2]) m.read_at = params[0];
        }
      }
      this.saveEmbedded();
      return { changes: 1 };
    }

    if (lower.includes('update notifications')) {
      if (lower.includes('set is_read = 1 where user_id = ?')) {
        for (const n of this.data.notifications) {
          if (n.user_id === params[0]) n.is_read = 1;
        }
      } else if (lower.includes('set is_read = 1 where id = ?')) {
        const n = this.data.notifications.find(x => x.id === params[0] && x.user_id === params[1]);
        if (n) n.is_read = 1;
      }
      this.saveEmbedded();
      return { changes: 1 };
    }

    if (lower.includes('update reports')) {
      const r = this.data.reports.find(x => x.id === params[3]);
      if (r) { r.status = params[0]; r.admin_notes = params[1]; r.resolved_at = params[2]; }
      this.saveEmbedded();
      return { changes: 1 };
    }

    if (lower.includes('delete from wishlist')) {
      this.data.wishlist = this.data.wishlist.filter(w => !(w.id === params[0] && w.user_id === params[1]));
      this.saveEmbedded();
      return { changes: 1 };
    }

    if (lower.includes('delete from books')) {
      this.data.books = this.data.books.filter(b => b.id !== params[0]);
      this.saveEmbedded();
      return { changes: 1 };
    }

    if (lower.includes('delete from swap_items')) {
      this.data.swap_items = this.data.swap_items.filter(i => i.swap_request_id !== params[0]);
      this.saveEmbedded();
      return { changes: 1 };
    }

    this.saveEmbedded();
    return { changes: 0 };
  }
}

export const db = new DatabaseManager();

export function initDatabase() {
  console.log(`Database Manager initialized in [${db.getMode().toUpperCase()}] mode.`);
}
