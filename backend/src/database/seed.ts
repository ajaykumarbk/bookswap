import bcrypt from 'bcryptjs';
import { db, initDatabase } from './db';

export async function seedDatabase() {
  console.log('Seeding demo data into BookSwap database...');

  initDatabase();

  const now = new Date().toISOString();
  const salt = await bcrypt.genSalt(10);
  const commonPasswordHash = await bcrypt.hash('password123', salt);
  const adminPasswordHash = await bcrypt.hash('admin123', salt);

  // 1. Seed 20 Users
  const usersData = [
    { id: 'usr_admin', name: 'BookSwap Admin', email: 'admin@bookswap.org', password_hash: adminPasswordHash, phone: '+91 9876543210', city: 'Bengaluru', state: 'Karnataka', country: 'India', lat: 12.9716, lon: 77.5946, role: 'admin', rating: 5.0, swaps: 45, bio: 'Official platform moderator & avid collector of classic science literature.' },
    { id: 'usr_1', name: 'Rahul Sharma', email: 'rahul@example.com', password_hash: commonPasswordHash, phone: '+91 9876543211', city: 'Bengaluru', state: 'Karnataka', country: 'India', lat: 12.9784, lon: 77.6408, role: 'user', rating: 4.9, swaps: 18, bio: 'Tech lead who loves non-fiction, productivity, and psychology books.' },
    { id: 'usr_2', name: 'Ajay Kumar', email: 'ajay@example.com', password_hash: commonPasswordHash, phone: '+91 9876543212', city: 'Bengaluru', state: 'Karnataka', country: 'India', lat: 12.9698, lon: 77.7500, role: 'user', rating: 4.8, swaps: 22, bio: 'Full stack engineer building open source tools and reading sci-fi thrillers.' },
    { id: 'usr_3', name: 'Priya Patel', email: 'priya@example.com', password_hash: commonPasswordHash, phone: '+91 9876543213', city: 'Bengaluru', state: 'Karnataka', country: 'India', lat: 12.9352, lon: 77.6245, role: 'user', rating: 5.0, swaps: 12, bio: 'UX designer passionate about product design, biography, and fiction.' },
    { id: 'usr_4', name: 'Ananya Rao', email: 'ananya@example.com', password_hash: commonPasswordHash, phone: '+91 9876543214', city: 'Bengaluru', state: 'Karnataka', country: 'India', lat: 12.9279, lon: 77.6271, role: 'user', rating: 4.7, swaps: 15, bio: 'Literature student exploring classic philosophy and modern novels.' },
    { id: 'usr_5', name: 'Vikram Singh', email: 'vikram@example.com', password_hash: commonPasswordHash, phone: '+91 9876543215', city: 'Bengaluru', state: 'Karnataka', country: 'India', lat: 13.0358, lon: 77.5970, role: 'user', rating: 4.6, swaps: 8, bio: 'Startup founder reading behavioral economics, finance, and leadership.' },
    { id: 'usr_6', name: 'Sneha Reddy', email: 'sneha@example.com', password_hash: commonPasswordHash, phone: '+91 9876543216', city: 'Bengaluru', state: 'Karnataka', country: 'India', lat: 12.9141, lon: 77.6411, role: 'user', rating: 4.9, swaps: 27, bio: 'Book club host, avid fiction reader, always looking for book swaps!' },
    { id: 'usr_7', name: 'Karan Malhotra', email: 'karan@example.com', password_hash: commonPasswordHash, phone: '+91 9876543217', city: 'Mumbai', state: 'Maharashtra', country: 'India', lat: 19.0760, lon: 72.8777, role: 'user', rating: 4.5, swaps: 9, bio: 'Finance analyst reading investment strategies and biographies.' },
    { id: 'usr_8', name: 'Neha Gupta', email: 'neha@example.com', password_hash: commonPasswordHash, phone: '+91 9876543218', city: 'Delhi', state: 'Delhi', country: 'India', lat: 28.6139, lon: 77.2090, role: 'user', rating: 4.8, swaps: 14, bio: 'Journalist and historian reading political science and memoirs.' },
    { id: 'usr_9', name: 'Rohan Mehta', email: 'rohan@example.com', password_hash: commonPasswordHash, phone: '+91 9876543219', city: 'Bengaluru', state: 'Karnataka', country: 'India', lat: 12.9600, lon: 77.6480, role: 'user', rating: 4.4, swaps: 6, bio: 'Software developer interested in AI, distributed systems, and fantasy.' },
    { id: 'usr_10', name: 'Kavya Nair', email: 'kavya@example.com', password_hash: commonPasswordHash, phone: '+91 9876543220', city: 'Bengaluru', state: 'Karnataka', country: 'India', lat: 12.9900, lon: 77.5800, role: 'user', rating: 4.9, swaps: 31, bio: 'Architect loving design, photography, and mystery thrillers.' },
    { id: 'usr_11', name: 'Amit Verma', email: 'amit@example.com', password_hash: commonPasswordHash, phone: '+91 9876543221', city: 'Bengaluru', state: 'Karnataka', country: 'India', lat: 12.9750, lon: 77.6050, role: 'user', rating: 4.3, swaps: 4, bio: 'Casual reader into self-improvement and productivity.' },
    { id: 'usr_12', name: 'Divya Joshi', email: 'divya@example.com', password_hash: commonPasswordHash, phone: '+91 9876543222', city: 'Bengaluru', state: 'Karnataka', country: 'India', lat: 12.9400, lon: 77.6100, role: 'user', rating: 4.8, swaps: 11, bio: 'Psychology student exploring human behavior and mental health.' },
    { id: 'usr_13', name: 'Siddharth Roy', email: 'siddharth@example.com', password_hash: commonPasswordHash, phone: '+91 9876543223', city: 'Bengaluru', state: 'Karnataka', country: 'India', lat: 12.9650, lon: 77.5950, role: 'user', rating: 4.9, swaps: 20, bio: 'History buff and antique book trader.' },
    { id: 'usr_14', name: 'Meera Iyer', email: 'meera@example.com', password_hash: commonPasswordHash, phone: '+91 9876543224', city: 'Bengaluru', state: 'Karnataka', country: 'India', lat: 12.9800, lon: 77.6200, role: 'user', rating: 4.6, swaps: 7, bio: 'Poetry lover and creative writing enthusiast.' },
    { id: 'usr_15', name: 'Tarun Saxena', email: 'tarun@example.com', password_hash: commonPasswordHash, phone: '+91 9876543225', city: 'Hyderabad', state: 'Telangana', country: 'India', lat: 17.3850, lon: 78.4867, role: 'user', rating: 4.7, swaps: 13, bio: 'Data scientist reading astrophysics and machine learning.' },
    { id: 'usr_16', name: 'Ritu Kapoor', email: 'ritu@example.com', password_hash: commonPasswordHash, phone: '+91 9876543226', city: 'Bengaluru', state: 'Karnataka', country: 'India', lat: 12.9550, lon: 77.7100, role: 'user', rating: 4.8, swaps: 19, bio: 'Product manager enjoying business strategies and mindfulness.' },
    { id: 'usr_17', name: 'Varun Das', email: 'varun@example.com', password_hash: commonPasswordHash, phone: '+91 9876543227', city: 'Bengaluru', state: 'Karnataka', country: 'India', lat: 12.9200, lon: 77.6800, role: 'user', rating: 4.2, swaps: 3, bio: 'Avid sci-fi reader and comic book collector.' },
    { id: 'usr_18', name: 'Pooja Bhatia', email: 'pooja@example.com', password_hash: commonPasswordHash, phone: '+91 9876543228', city: 'Bengaluru', state: 'Karnataka', country: 'India', lat: 13.0100, lon: 77.6500, role: 'user', rating: 4.9, swaps: 16, bio: 'Teacher reading children literature and educational philosophy.' },
    { id: 'usr_19', name: 'Manish Kumar', email: 'manish@example.com', password_hash: commonPasswordHash, phone: '+91 9876543229', city: 'Bengaluru', state: 'Karnataka', country: 'India', lat: 12.9050, lon: 77.5850, role: 'user', rating: 4.5, swaps: 8, bio: 'Fitness trainer reading health, nutrition, and habits.' }
  ];

  for (const u of usersData) {
    db.prepare(`
      INSERT INTO users (
        id, name, email, password_hash, phone, city, state, country,
        latitude, longitude, rating, completed_swaps, role, bio, profile_image,
        interested_genres, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      u.id, u.name, u.email, u.password_hash, u.phone, u.city, u.state, u.country,
      u.lat, u.lon, u.rating, u.swaps, u.role, u.bio,
      `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 50)}?auto=format&fit=crop&q=80&w=200`,
      JSON.stringify(['Self Help', 'Technology', 'Fiction', 'Business', 'Psychology']),
      now, now
    );
  }

  // 2. Seed 50 Realistic Books
  const booksMaster = [
    { title: 'Atomic Habits', author: 'James Clear', isbn: '9780735211292', genre: 'Self Help', publisher: 'Avery', year: 2018, condition: 'Like New', cover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600', desc: 'An easy & proven way to build good habits & break bad ones.' },
    { title: 'The Psychology of Money', author: 'Morgan Housel', isbn: '9780857197689', genre: 'Business', publisher: 'Harriman House', year: 2020, condition: 'Very Good', cover: 'https://images.unsplash.com/photo-1592496431122-2349e0fbc666?auto=format&fit=crop&q=80&w=600', desc: 'Timeless lessons on wealth, greed, and happiness.' },
    { title: 'Deep Work', author: 'Cal Newport', isbn: '9781455586691', genre: 'Technology', publisher: 'Grand Central', year: 2016, condition: 'Very Good', cover: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=600', desc: 'Rules for focused success in a distracted world.' },
    { title: 'Clean Code', author: 'Robert C. Martin', isbn: '9780132350884', genre: 'Technology', publisher: 'Prentice Hall', year: 2008, condition: 'Good', cover: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=600', desc: 'A handbook of agile software craftsmanship.' },
    { title: 'The Alchemist', author: 'Paulo Coelho', isbn: '9780062315007', genre: 'Fiction', publisher: 'HarperOne', year: 1988, condition: 'Like New', cover: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=600', desc: 'A fable about following your dream.' },
    { title: 'Sapiens: A Brief History of Humankind', author: 'Yuval Noah Harari', isbn: '9780062316097', genre: 'Science', publisher: 'Harper', year: 2014, condition: 'Very Good', cover: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=600', desc: 'Explores how Homo sapiens came to dominate planet Earth.' },
    { title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann', isbn: '9781491903063', genre: 'Technology', publisher: "O'Reilly", year: 2017, condition: 'Like New', cover: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&q=80&w=600', desc: 'The big ideas behind reliable, scalable, and maintainable systems.' },
    { title: 'Rich Dad Poor Dad', author: 'Robert T. Kiyosaki', isbn: '9781612680194', genre: 'Business', publisher: 'Plata Publishing', year: 1997, condition: 'Good', cover: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=600', desc: 'What the rich teach their kids about money that the poor and middle class do not!' },
    { title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', isbn: '9780374533557', genre: 'Psychology', publisher: 'Farrar, Straus and Giroux', year: 2011, condition: 'Very Good', cover: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&q=80&w=600', desc: 'Explains the two systems that drive the way we think.' },
    { title: 'Dune', author: 'Frank Herbert', isbn: '9780441172719', genre: 'Fantasy', publisher: 'Ace', year: 1965, condition: 'Acceptable', cover: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=80&w=600', desc: 'Set on the desert planet Arrakis, Dune is the story of the boy Paul Atreides.' },
    { title: 'The Pragmatic Programmer', author: 'Andrew Hunt & David Thomas', isbn: '9780135957059', genre: 'Technology', publisher: 'Addison-Wesley', year: 2019, condition: 'Like New', cover: 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&q=80&w=600', desc: 'Your journey to mastery in software development.' },
    { title: 'Man’s Search for Meaning', author: 'Viktor E. Frankl', isbn: '9780807014295', genre: 'Psychology', publisher: 'Beacon Press', year: 1946, condition: 'Very Good', cover: 'https://images.unsplash.com/photo-1476275466078-4007374efbbe?auto=format&fit=crop&q=80&w=600', desc: 'Psychiatrist Viktor Frankl’s memoir of life in Nazi death camps.' },
    { title: 'Zero to One', author: 'Peter Thiel', isbn: '9780804139298', genre: 'Business', publisher: 'Currency', year: 2014, condition: 'Like New', cover: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&q=80&w=600', desc: 'Notes on startups, or how to build the future.' },
    { title: 'To Kill a Mockingbird', author: 'Harper Lee', isbn: '9780060935467', genre: 'Fiction', publisher: 'Harper Perennial', year: 1960, condition: 'Good', cover: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600', desc: 'The unforgettable novel of a childhood in a sleepy Southern town.' },
    { title: 'Guns, Germs, and Steel', author: 'Jared Diamond', isbn: '9780393317558', genre: 'Science', publisher: 'W. W. Norton', year: 1997, condition: 'Very Good', cover: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&q=80&w=600', desc: 'Fates of human societies across continents.' }
  ];

  for (let i = 1; i <= 50; i++) {
    const template = booksMaster[(i - 1) % booksMaster.length];
    const ownerIndex = (i % (usersData.length - 1)) + 1; // Exclude admin from all books owner
    const owner = usersData[ownerIndex];
    const bookId = `bk_${i}`;

    db.prepare(`
      INSERT INTO books (
        id, owner_id, isbn, title, author, publisher, edition, publication_year,
        description, genre, language, condition, cover_image, status, latitude, longitude,
        views, swap_requests_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      bookId,
      owner.id,
      template.isbn + i,
      `${template.title}${i > 15 ? ` (Vol. ${(i % 3) + 1})` : ''}`,
      template.author,
      template.publisher,
      '1st Edition',
      template.year,
      template.desc,
      template.genre,
      'English',
      template.condition,
      template.cover,
      i === 5 ? 'Reserved' : (i === 12 ? 'Swapped' : 'Available'),
      owner.lat,
      owner.lon,
      Math.floor(Math.random() * 80) + 10,
      Math.floor(Math.random() * 5),
      now,
      now
    );
  }

  // 3. Seed Wishlist Entries
  db.prepare(`INSERT INTO wishlist (id, user_id, book_title, author, isbn, created_at) VALUES (?, ?, ?, ?, ?, ?)`).run(
    'wsh_1', 'usr_1', 'The Psychology of Money', 'Morgan Housel', '9780857197689', now
  );
  db.prepare(`INSERT INTO wishlist (id, user_id, book_title, author, isbn, created_at) VALUES (?, ?, ?, ?, ?, ?)`).run(
    'wsh_2', 'usr_2', 'Atomic Habits', 'James Clear', '9780735211292', now
  );
  db.prepare(`INSERT INTO wishlist (id, user_id, book_title, author, isbn, created_at) VALUES (?, ?, ?, ?, ?, ?)`).run(
    'wsh_3', 'usr_3', 'Clean Code', 'Robert C. Martin', '9780132350884', now
  );

  // 4. Seed Active & Completed Swap Requests
  // Active Swap Request: Rahul -> Ajay
  db.prepare(`
    INSERT INTO swap_requests (id, requester_id, owner_id, status, message, created_at, updated_at, expires_at)
    VALUES (?, ?, ?, 'MEETUP_CONFIRMED', ?, ?, ?, ?)
  `).run('swp_active1', 'usr_1', 'usr_2', 'Hi Ajay, I would love to exchange Atomic Habits for your Psychology of Money book.', now, now, now);

  db.prepare(`INSERT INTO swap_items (id, swap_request_id, book_id, user_id, direction) VALUES (?, ?, ?, ?, 'OFFERED')`).run('swpi_1', 'swp_active1', 'bk_1', 'usr_1');
  db.prepare(`INSERT INTO swap_items (id, swap_request_id, book_id, user_id, direction) VALUES (?, ?, ?, ?, 'REQUESTED')`).run('swpi_2', 'swp_active1', 'bk_2', 'usr_2');

  db.prepare(`
    INSERT INTO meetups (id, swap_request_id, date, time, location_name, notes, user_a_confirmed, user_b_confirmed, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, 1, ?)
  `).run('mtp_1', 'swp_active1', '2026-10-04', '17:00', 'Central Library Coffee Lounge, MG Road', 'Let us meet near the main entrance stairs.', now);

  // Seed Messages for active swap
  db.prepare(`INSERT INTO messages (id, sender_id, receiver_id, swap_request_id, message, created_at) VALUES (?, ?, ?, ?, ?, ?)`).run('msg_1', 'usr_1', 'usr_2', 'swp_active1', 'Hi Ajay, can we meet this Saturday?', now);
  db.prepare(`INSERT INTO messages (id, sender_id, receiver_id, swap_request_id, message, created_at) VALUES (?, ?, ?, ?, ?, ?)`).run('msg_2', 'usr_2', 'usr_1', 'swp_active1', 'Hey Rahul, Saturday 5 PM at Central Library works great for me!', now);

  // Completed Swap Request: Priya -> Rahul
  db.prepare(`
    INSERT INTO swap_requests (id, requester_id, owner_id, status, message, created_at, updated_at)
    VALUES (?, ?, ?, 'EXCHANGE_COMPLETED', ?, ?, ?)
  `).run('swp_comp1', 'usr_3', 'usr_1', 'Exchanged Deep Work for Sapiens.', now, now);

  db.prepare(`INSERT INTO swap_items (id, swap_request_id, book_id, user_id, direction) VALUES (?, ?, ?, ?, 'OFFERED')`).run('swpi_3', 'swp_comp1', 'bk_3', 'usr_3');
  db.prepare(`INSERT INTO swap_items (id, swap_request_id, book_id, user_id, direction) VALUES (?, ?, ?, ?, 'REQUESTED')`).run('swpi_4', 'swp_comp1', 'bk_6', 'usr_1');

  // Reviews
  db.prepare(`
    INSERT INTO reviews (id, swap_request_id, reviewer_id, reviewee_id, rating, comment, tags, created_at)
    VALUES (?, ?, ?, ?, 5, ?, ?, ?)
  `).run('rvw_1', 'swp_comp1', 'usr_3', 'usr_1', 'Rahul was punctual, friendly, and the book was in pristine condition!', JSON.stringify(['Punctual', 'Great Condition', 'Friendly']), now);

  // Notifications
  db.prepare(`INSERT INTO notifications (id, user_id, type, title, message, reference_id, created_at) VALUES (?, ?, 'SWAP_REQUEST', ?, ?, ?, ?)`).run(
    'ntf_seed1', 'usr_1', 'SWAP_REQUEST', 'New Swap Request Received', 'Ajay Kumar accepted your swap request for Atomic Habits.', 'swp_active1', now
  );

  console.log('Database successfully seeded with 20 users, 50 books, swaps, chat, reviews, and wishlists!');
}

if (require.main === module) {
  seedDatabase();
}
