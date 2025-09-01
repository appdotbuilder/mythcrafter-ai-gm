import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput } from '../schema';
import { loginUser } from '../handlers/login_user';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

// Test inputs
const testUserData = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123'
};

const validLoginInput: LoginInput = {
  username: 'testuser',
  password: 'password123'
};

const invalidPasswordInput: LoginInput = {
  username: 'testuser',
  password: 'wrongpassword'
};

const invalidUsernameInput: LoginInput = {
  username: 'nonexistentuser',
  password: 'password123'
};

describe('loginUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should successfully login with valid credentials', async () => {
    // Create a test user with hashed password
    const hashedPassword = await bcrypt.hash(testUserData.password, 10);
    
    const [createdUser] = await db.insert(usersTable)
      .values({
        username: testUserData.username,
        email: testUserData.email,
        password_hash: hashedPassword
      })
      .returning()
      .execute();

    // Attempt login with valid credentials
    const result = await loginUser(validLoginInput);

    // Verify returned user data
    expect(result.id).toBe(createdUser.id);
    expect(result.username).toBe(testUserData.username);
    expect(result.email).toBe(testUserData.email);
    expect(result.password_hash).toBe(hashedPassword);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should reject login with invalid password', async () => {
    // Create a test user with hashed password
    const hashedPassword = await bcrypt.hash(testUserData.password, 10);
    
    await db.insert(usersTable)
      .values({
        username: testUserData.username,
        email: testUserData.email,
        password_hash: hashedPassword
      })
      .execute();

    // Attempt login with wrong password
    expect(loginUser(invalidPasswordInput)).rejects.toThrow(/invalid username or password/i);
  });

  it('should reject login with non-existent username', async () => {
    // Create a test user (but try to login with different username)
    const hashedPassword = await bcrypt.hash(testUserData.password, 10);
    
    await db.insert(usersTable)
      .values({
        username: testUserData.username,
        email: testUserData.email,
        password_hash: hashedPassword
      })
      .execute();

    // Attempt login with non-existent username
    expect(loginUser(invalidUsernameInput)).rejects.toThrow(/invalid username or password/i);
  });

  it('should verify password is properly hashed in database', async () => {
    // Create a test user with hashed password
    const hashedPassword = await bcrypt.hash(testUserData.password, 10);
    
    const [createdUser] = await db.insert(usersTable)
      .values({
        username: testUserData.username,
        email: testUserData.email,
        password_hash: hashedPassword
      })
      .returning()
      .execute();

    // Verify password is hashed and not stored as plain text
    expect(createdUser.password_hash).not.toBe(testUserData.password);
    expect(createdUser.password_hash.startsWith('$2')).toBe(true); // bcrypt hash format
    
    // Verify bcrypt can validate the hash
    const isValid = await bcrypt.compare(testUserData.password, createdUser.password_hash);
    expect(isValid).toBe(true);
  });

  it('should handle case-sensitive username correctly', async () => {
    // Create a test user
    const hashedPassword = await bcrypt.hash(testUserData.password, 10);
    
    await db.insert(usersTable)
      .values({
        username: testUserData.username.toLowerCase(), // 'testuser'
        email: testUserData.email,
        password_hash: hashedPassword
      })
      .execute();

    // Try to login with different case username
    const upperCaseUsernameInput: LoginInput = {
      username: testUserData.username.toUpperCase(), // 'TESTUSER'
      password: testUserData.password
    };

    // This should fail because usernames are case-sensitive
    expect(loginUser(upperCaseUsernameInput)).rejects.toThrow(/invalid username or password/i);
  });

  it('should query database correctly for existing user', async () => {
    // Create a test user
    const hashedPassword = await bcrypt.hash(testUserData.password, 10);
    
    const [createdUser] = await db.insert(usersTable)
      .values({
        username: testUserData.username,
        email: testUserData.email,
        password_hash: hashedPassword
      })
      .returning()
      .execute();

    // Successfully login
    await loginUser(validLoginInput);

    // Verify user still exists in database after login
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.username, testUserData.username))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].id).toBe(createdUser.id);
    expect(users[0].username).toBe(testUserData.username);
  });
});