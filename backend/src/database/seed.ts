import { initDatabase } from './db';

export async function seedDatabase() {
  initDatabase();
  console.log('Database initialized in clean mode (no dummy data).');
}

if (require.main === module) {
  seedDatabase();
}
