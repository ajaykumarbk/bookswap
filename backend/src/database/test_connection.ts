import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function testMySQLConnection() {
  console.log('Testing MySQL Connection with parameters:');
  console.log(`Host: ${process.env.MYSQL_HOST}`);
  console.log(`Port: ${process.env.MYSQL_PORT}`);
  console.log(`User: ${process.env.MYSQL_USER}`);
  console.log(`Database: ${process.env.MYSQL_DATABASE}`);
  console.log(`SSL: ${process.env.MYSQL_SSL}`);

  try {
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      ssl: process.env.MYSQL_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
      connectTimeout: 5000
    });

    console.log('✅ Successfully connected to MySQL database!');
    const [rows]: any = await connection.query('SELECT 1 + 1 AS solution, NOW() as current_time');
    console.log('Test Query Result:', rows);
    await connection.end();
  } catch (err: any) {
    console.error('❌ Connection Failed:');
    console.error(err);
  }
}

testMySQLConnection();
