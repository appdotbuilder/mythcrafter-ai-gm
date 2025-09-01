import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, charactersTable, campaignsTable, gameSessionsTable } from '../db/schema';
import { type CreateGameSessionInput } from '../schema';
import { createGameSession } from '../handlers/create_game_session';
import { eq } from 'drizzle-orm';

// Test data setup
const testUser = {
  username: 'testgamer',
  email: 'test@example.com',
  password_hash: 'hashedpassword123'
};

const testCharacter = {
  name: 'Aragorn',
  race: 'Human',
  character_class: 'Ranger',
  level: 5,
  experience_points: 6500,
  strength: 16,
  dexterity: 14,
  constitution: 15,
  intelligence: 12,
  wisdom: 13,
  charisma: 11,
  hit_points: 45,
  max_hit_points: 50,
  armor_class: 16,
  backstory: 'A ranger from the north',
  notes: 'Excellent tracker'
};

const testCampaign = {
  title: 'The Fellowship Quest',
  genre: 'fantasy' as const,
  description: 'An epic fantasy adventure',
  current_scene: 'The Prancing Pony',
  campaign_data: { location: 'Bree', day: 1 }
};

const testGameSessionInput: CreateGameSessionInput = {
  campaign_id: 1,
  session_number: 1,
  narrative: 'The party arrives at the tavern and meets a mysterious hooded figure who offers them a quest.',
  dice_rolls: [
    {
      roll_type: 'perception',
      dice: '1d20',
      result: 15,
      modifier: 3,
      total: 18,
      timestamp: new Date()
    },
    {
      roll_type: 'insight',
      dice: '1d20',
      result: 8,
      modifier: 1,
      total: 9,
      timestamp: new Date()
    }
  ]
};

describe('createGameSession', () => {
  let userId: number;
  let characterId: number;
  let campaignId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    userId = userResult[0].id;

    const characterResult = await db.insert(charactersTable)
      .values({ ...testCharacter, user_id: userId })
      .returning()
      .execute();
    characterId = characterResult[0].id;

    const campaignResult = await db.insert(campaignsTable)
      .values({ ...testCampaign, user_id: userId, character_id: characterId })
      .returning()
      .execute();
    campaignId = campaignResult[0].id;

    // Update input with correct campaign_id
    testGameSessionInput.campaign_id = campaignId;
  });

  afterEach(resetDB);

  it('should create a game session with dice rolls', async () => {
    const result = await createGameSession(testGameSessionInput);

    // Basic field validation
    expect(result.campaign_id).toEqual(campaignId);
    expect(result.session_number).toEqual(1);
    expect(result.narrative).toEqual(testGameSessionInput.narrative);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    
    // Verify dice rolls structure (dates are serialized as strings in JSONB)
    expect(Array.isArray(result.dice_rolls)).toBe(true);
    expect(result.dice_rolls).toHaveLength(2);
    expect(result.dice_rolls?.[0].roll_type).toBe('perception');
    expect(result.dice_rolls?.[0].dice).toBe('1d20');
    expect(result.dice_rolls?.[0].result).toBe(15);
    expect(result.dice_rolls?.[0].modifier).toBe(3);
    expect(result.dice_rolls?.[0].total).toBe(18);
  });

  it('should create a game session without dice rolls', async () => {
    const inputWithoutDiceRolls: CreateGameSessionInput = {
      campaign_id: campaignId,
      session_number: 2,
      narrative: 'A quiet evening at camp with no significant events.',
      dice_rolls: null
    };

    const result = await createGameSession(inputWithoutDiceRolls);

    expect(result.campaign_id).toEqual(campaignId);
    expect(result.session_number).toEqual(2);
    expect(result.narrative).toEqual(inputWithoutDiceRolls.narrative);
    expect(result.dice_rolls).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save game session to database', async () => {
    const result = await createGameSession(testGameSessionInput);

    // Query database to verify the record was saved
    const gameSessions = await db.select()
      .from(gameSessionsTable)
      .where(eq(gameSessionsTable.id, result.id))
      .execute();

    expect(gameSessions).toHaveLength(1);
    
    const savedSession = gameSessions[0];
    expect(savedSession.campaign_id).toEqual(campaignId);
    expect(savedSession.session_number).toEqual(1);
    expect(savedSession.narrative).toEqual(testGameSessionInput.narrative);
    expect(savedSession.created_at).toBeInstanceOf(Date);
    
    // Verify dice rolls were saved correctly
    expect(Array.isArray(savedSession.dice_rolls)).toBe(true);
    expect(savedSession.dice_rolls).toHaveLength(2);
  });

  it('should handle complex dice roll data', async () => {
    const complexDiceRolls = [
      {
        roll_type: 'attack',
        dice: '1d20',
        result: 19,
        modifier: 5,
        total: 24,
        timestamp: new Date('2023-12-01T10:00:00Z')
      },
      {
        roll_type: 'damage',
        dice: '2d6',
        result: 11,
        modifier: 3,
        total: 14,
        timestamp: new Date('2023-12-01T10:01:00Z')
      },
      {
        roll_type: 'saving_throw',
        dice: '1d20',
        result: 12,
        modifier: 2,
        total: 14,
        timestamp: new Date('2023-12-01T10:02:00Z')
      }
    ];

    const complexInput: CreateGameSessionInput = {
      campaign_id: campaignId,
      session_number: 3,
      narrative: 'Epic battle with a dragon! Multiple attacks and saving throws.',
      dice_rolls: complexDiceRolls
    };

    const result = await createGameSession(complexInput);

    expect(Array.isArray(result.dice_rolls)).toBe(true);
    expect(result.dice_rolls?.length).toBe(3);
    
    // Verify specific dice roll data (without exact date comparison due to JSONB serialization)
    expect(result.dice_rolls?.[0].roll_type).toBe('attack');
    expect(result.dice_rolls?.[0].dice).toBe('1d20');
    expect(result.dice_rolls?.[0].result).toBe(19);
    expect(result.dice_rolls?.[0].modifier).toBe(5);
    expect(result.dice_rolls?.[0].total).toBe(24);
    
    expect(result.dice_rolls?.[1].dice).toBe('2d6');
    expect(result.dice_rolls?.[1].result).toBe(11);
    
    expect(result.dice_rolls?.[2].roll_type).toBe('saving_throw');
    expect(result.dice_rolls?.[2].total).toBe(14);
  });

  it('should handle long narrative text', async () => {
    const longNarrative = `
      The party ventured deep into the ancient dungeon, their torchlight casting eerie shadows on the moss-covered walls.
      As they rounded a corner, they discovered a vast chamber filled with treasure chests and magical artifacts.
      However, their joy was short-lived as a massive stone guardian awakened from its centuries-long slumber.
      The battle was fierce and lasted for what felt like hours, with spell after spell being cast and sword strikes
      ringing against stone. Finally, through clever tactics and teamwork, they managed to defeat the guardian
      and claim the legendary Sword of Kings that lay hidden beneath the chamber's altar.
    `.trim();

    const longNarrativeInput: CreateGameSessionInput = {
      campaign_id: campaignId,
      session_number: 4,
      narrative: longNarrative,
      dice_rolls: [
        {
          roll_type: 'initiative',
          dice: '1d20',
          result: 16,
          modifier: 2,
          total: 18,
          timestamp: new Date()
        }
      ]
    };

    const result = await createGameSession(longNarrativeInput);

    expect(result.narrative).toEqual(longNarrative);
    expect(result.narrative.length).toBeGreaterThan(500);
  });

  it('should throw error when campaign does not exist', async () => {
    const invalidInput: CreateGameSessionInput = {
      campaign_id: 99999, // Non-existent campaign ID
      session_number: 1,
      narrative: 'This should fail due to invalid campaign_id'
    };

    await expect(createGameSession(invalidInput)).rejects.toThrow(/violates foreign key constraint/i);
  });
});