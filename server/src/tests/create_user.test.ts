import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Test input data
const testInput: CreateUserInput = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'testpassword123'
};

const secondTestInput: CreateUserInput = {
  username: 'anotheruser',
  email: 'another@example.com',
  password: 'anotherpassword456'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user with hashed password', async () => {
    const result = await createUser(testInput);

    // Basic field validation
    expect(result.username).toEqual('testuser');
    expect(result.email).toEqual('test@example.com');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    
    // Password should be hashed, not plain text
    expect(result.password_hash).not.toEqual('testpassword123');
    expect(result.password_hash).toMatch(/^\$[a-z0-9]+\$/); // Bun password hash format
    expect(result.password_hash.length).toBeGreaterThan(50); // Hashed passwords are long
  });

  it('should save user to database', async () => {
    const result = await createUser(testInput);

    // Query database to verify user was saved
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].username).toEqual('testuser');
    expect(users[0].email).toEqual('test@example.com');
    expect(users[0].password_hash).toEqual(result.password_hash);
    expect(users[0].created_at).toBeInstanceOf(Date);
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should verify hashed password can be validated', async () => {
    const result = await createUser(testInput);

    // Verify that the hashed password can be verified with original password
    const isValid = await Bun.password.verify('testpassword123', result.password_hash);
    expect(isValid).toBe(true);

    // Verify wrong password fails
    const isInvalid = await Bun.password.verify('wrongpassword', result.password_hash);
    expect(isInvalid).toBe(false);
  });

  it('should create multiple users with different passwords', async () => {
    const user1 = await createUser(testInput);
    const user2 = await createUser(secondTestInput);

    // Users should have different IDs and password hashes
    expect(user1.id).not.toEqual(user2.id);
    expect(user1.password_hash).not.toEqual(user2.password_hash);

    // Both passwords should be verifiable
    const user1Valid = await Bun.password.verify('testpassword123', user1.password_hash);
    const user2Valid = await Bun.password.verify('anotherpassword456', user2.password_hash);
    
    expect(user1Valid).toBe(true);
    expect(user2Valid).toBe(true);
  });

  it('should handle duplicate username error', async () => {
    await createUser(testInput);

    // Try to create another user with same username
    const duplicateInput: CreateUserInput = {
      username: 'testuser', // Same username
      email: 'different@example.com',
      password: 'differentpassword'
    };

    await expect(createUser(duplicateInput)).rejects.toThrow(/unique/i);
  });

  it('should handle duplicate email error', async () => {
    await createUser(testInput);

    // Try to create another user with same email
    const duplicateInput: CreateUserInput = {
      username: 'differentuser',
      email: 'test@example.com', // Same email
      password: 'differentpassword'
    };

    await expect(createUser(duplicateInput)).rejects.toThrow(/unique/i);
  });

  it('should automatically set timestamps', async () => {
    const beforeCreation = new Date();
    const result = await createUser(testInput);
    const afterCreation = new Date();

    // created_at and updated_at should be set automatically
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    
    // Timestamps should be within reasonable range
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
  });
});