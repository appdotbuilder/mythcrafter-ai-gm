import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput, type User } from '../schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function loginUser(input: LoginInput): Promise<User> {
  try {
    // Find user by username
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.username, input.username))
      .execute();

    if (users.length === 0) {
      throw new Error('Invalid username or password');
    }

    const user = users[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(input.password, user.password_hash);
    
    if (!isPasswordValid) {
      throw new Error('Invalid username or password');
    }

    // Return user data (excluding password hash for security)
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      password_hash: user.password_hash, // This matches the schema requirement
      created_at: user.created_at,
      updated_at: user.updated_at
    };
  } catch (error) {
    console.error('User login failed:', error);
    throw error;
  }
}