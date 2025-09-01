import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, charactersTable, campaignsTable, gameSessionsTable } from '../db/schema';
import { getGameSessions } from '../handlers/get_game_sessions';

describe('getGameSessions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no game sessions exist for campaign', async () => {
    // Create user, character, and campaign but no game sessions
    const [user] = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    const [character] = await db.insert(charactersTable)
      .values({
        user_id: user.id,
        name: 'Test Character'
      })
      .returning()
      .execute();

    const [campaign] = await db.insert(campaignsTable)
      .values({
        user_id: user.id,
        character_id: character.id,
        title: 'Test Campaign',
        genre: 'fantasy'
      })
      .returning()
      .execute();

    const result = await getGameSessions(campaign.id);

    expect(result).toEqual([]);
  });

  it('should return game sessions for a specific campaign', async () => {
    // Create prerequisite data
    const [user] = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    const [character] = await db.insert(charactersTable)
      .values({
        user_id: user.id,
        name: 'Test Character'
      })
      .returning()
      .execute();

    const [campaign] = await db.insert(campaignsTable)
      .values({
        user_id: user.id,
        character_id: character.id,
        title: 'Test Campaign',
        genre: 'fantasy'
      })
      .returning()
      .execute();

    // Create game sessions
    const sessionData = [
      {
        campaign_id: campaign.id,
        session_number: 1,
        narrative: 'The adventure begins in a tavern...',
        dice_rolls: [
          {
            roll_type: 'initiative',
            dice: '1d20',
            result: 15,
            modifier: 2,
            total: 17,
            timestamp: new Date()
          }
        ]
      },
      {
        campaign_id: campaign.id,
        session_number: 2,
        narrative: 'Our heroes encounter a dragon...',
        dice_rolls: [
          {
            roll_type: 'attack',
            dice: '1d20',
            result: 18,
            modifier: 5,
            total: 23,
            timestamp: new Date()
          }
        ]
      }
    ];

    await db.insert(gameSessionsTable)
      .values(sessionData)
      .execute();

    const result = await getGameSessions(campaign.id);

    expect(result).toHaveLength(2);
    
    // Should be ordered by session_number descending (newest first)
    expect(result[0].session_number).toEqual(2);
    expect(result[1].session_number).toEqual(1);
    
    // Verify session data
    expect(result[0].narrative).toEqual('Our heroes encounter a dragon...');
    expect(result[1].narrative).toEqual('The adventure begins in a tavern...');
    
    // Verify dice rolls structure
    expect(result[0].dice_rolls).toBeDefined();
    expect(Array.isArray(result[0].dice_rolls)).toBe(true);
    expect(result[0].dice_rolls).toHaveLength(1);
    expect((result[0].dice_rolls as any[])[0].roll_type).toEqual('attack');
  });

  it('should only return sessions for the specified campaign', async () => {
    // Create prerequisite data for two campaigns
    const [user] = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    const [character] = await db.insert(charactersTable)
      .values({
        user_id: user.id,
        name: 'Test Character'
      })
      .returning()
      .execute();

    const campaigns = await db.insert(campaignsTable)
      .values([
        {
          user_id: user.id,
          character_id: character.id,
          title: 'Campaign 1',
          genre: 'fantasy'
        },
        {
          user_id: user.id,
          character_id: character.id,
          title: 'Campaign 2',
          genre: 'sci_fi'
        }
      ])
      .returning()
      .execute();

    // Create sessions for both campaigns
    await db.insert(gameSessionsTable)
      .values([
        {
          campaign_id: campaigns[0].id,
          session_number: 1,
          narrative: 'Campaign 1 Session 1'
        },
        {
          campaign_id: campaigns[0].id,
          session_number: 2,
          narrative: 'Campaign 1 Session 2'
        },
        {
          campaign_id: campaigns[1].id,
          session_number: 1,
          narrative: 'Campaign 2 Session 1'
        }
      ])
      .execute();

    // Get sessions for first campaign only
    const result = await getGameSessions(campaigns[0].id);

    expect(result).toHaveLength(2);
    result.forEach(session => {
      expect(session.campaign_id).toEqual(campaigns[0].id);
    });
    
    // Verify content
    expect(result.some(s => s.narrative === 'Campaign 1 Session 1')).toBe(true);
    expect(result.some(s => s.narrative === 'Campaign 1 Session 2')).toBe(true);
    expect(result.some(s => s.narrative === 'Campaign 2 Session 1')).toBe(false);
  });

  it('should handle sessions with null dice_rolls', async () => {
    // Create prerequisite data
    const [user] = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    const [character] = await db.insert(charactersTable)
      .values({
        user_id: user.id,
        name: 'Test Character'
      })
      .returning()
      .execute();

    const [campaign] = await db.insert(campaignsTable)
      .values({
        user_id: user.id,
        character_id: character.id,
        title: 'Test Campaign',
        genre: 'fantasy'
      })
      .returning()
      .execute();

    // Create session without dice rolls
    await db.insert(gameSessionsTable)
      .values({
        campaign_id: campaign.id,
        session_number: 1,
        narrative: 'A session with no dice rolls',
        dice_rolls: null
      })
      .execute();

    const result = await getGameSessions(campaign.id);

    expect(result).toHaveLength(1);
    expect(result[0].dice_rolls).toBeNull();
    expect(result[0].narrative).toEqual('A session with no dice rolls');
  });

  it('should return sessions ordered by session_number descending', async () => {
    // Create prerequisite data
    const [user] = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    const [character] = await db.insert(charactersTable)
      .values({
        user_id: user.id,
        name: 'Test Character'
      })
      .returning()
      .execute();

    const [campaign] = await db.insert(campaignsTable)
      .values({
        user_id: user.id,
        character_id: character.id,
        title: 'Test Campaign',
        genre: 'fantasy'
      })
      .returning()
      .execute();

    // Create sessions out of order
    await db.insert(gameSessionsTable)
      .values([
        {
          campaign_id: campaign.id,
          session_number: 3,
          narrative: 'Session 3'
        },
        {
          campaign_id: campaign.id,
          session_number: 1,
          narrative: 'Session 1'
        },
        {
          campaign_id: campaign.id,
          session_number: 5,
          narrative: 'Session 5'
        },
        {
          campaign_id: campaign.id,
          session_number: 2,
          narrative: 'Session 2'
        }
      ])
      .execute();

    const result = await getGameSessions(campaign.id);

    expect(result).toHaveLength(4);
    
    // Should be in descending order (newest/highest session number first)
    expect(result[0].session_number).toEqual(5);
    expect(result[1].session_number).toEqual(3);
    expect(result[2].session_number).toEqual(2);
    expect(result[3].session_number).toEqual(1);
  });

  it('should return empty array for non-existent campaign', async () => {
    const result = await getGameSessions(99999);

    expect(result).toEqual([]);
  });
});