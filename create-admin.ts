import { drizzle } from 'drizzle-orm/mysql2';
import { users } from './drizzle/schema';

const db = drizzle(process.env.DATABASE_URL!);

async function createAdmin() {
  try {
    await db.insert(users).values({
      openId: 'shaun-admin',
      name: 'Shaun Critzer',
      email: 'shaun@shauncritzer.com',
      loginMethod: 'manual',
      role: 'admin',
    });
    console.log('Admin user created successfully');
  } catch (error: any) {
    if (error.message?.includes('Duplicate entry')) {
      console.log('Admin user already exists');
    } else {
      throw error;
    }
  }
  process.exit(0);
}

createAdmin();
