import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, charactersTable, campaignsTable } from '../db/schema';
import { type CreateCampaignInput } from '../schema';
import { createCampaign } from '../handlers/create_campaign';
import { eq } from 'drizzle-orm';

describe('createCampaign', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testCharacterId: number;

  beforeEach(async () => {
    // Create a test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create a test character
    const characterResult = await db.insert(charactersTable)
      .values({
        user_id: testUserId,
        name: 'Test Hero',
        race: 'Human',
        character_class: 'Fighter'
      })
      .returning()
      .execute();
    testCharacterId = characterResult[0].id;
  });

  it('should create a campaign with all required fields', async () => {
    const testInput: CreateCampaignInput = {
      user_id: testUserId,
      character_id: testCharacterId,
      title: 'The Great Adventure',
      genre: 'fantasy',
      description: 'An epic fantasy campaign',
      current_scene: 'The tavern at the crossroads',
      campaign_data: { world_state: 'peaceful', weather: 'sunny' }
    };

    const result = await createCampaign(testInput);

    expect(result.id).toBeDefined();
    expect(result.user_id).toEqual(testUserId);
    expect(result.character_id).toEqual(testCharacterId);
    expect(result.title).toEqual('The Great Adventure');
    expect(result.genre).toEqual('fantasy');
    expect(result.status).toEqual('active');
    expect(result.description).toEqual('An epic fantasy campaign');
    expect(result.current_scene).toEqual('The tavern at the crossroads');
    expect(result.campaign_data).toEqual({ world_state: 'peaceful', weather: 'sunny' });
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a campaign with only required fields', async () => {
    const testInput: CreateCampaignInput = {
      user_id: testUserId,
      character_id: testCharacterId,
      title: 'Minimal Campaign',
      genre: 'cyberpunk'
    };

    const result = await createCampaign(testInput);

    expect(result.id).toBeDefined();
    expect(result.user_id).toEqual(testUserId);
    expect(result.character_id).toEqual(testCharacterId);
    expect(result.title).toEqual('Minimal Campaign');
    expect(result.genre).toEqual('cyberpunk');
    expect(result.status).toEqual('active');
    expect(result.description).toBeNull();
    expect(result.current_scene).toBeNull();
    expect(result.campaign_data).toBeNull();
  });

  it('should persist campaign to database', async () => {
    const testInput: CreateCampaignInput = {
      user_id: testUserId,
      character_id: testCharacterId,
      title: 'Database Test Campaign',
      genre: 'horror',
      description: 'A spooky campaign'
    };

    const result = await createCampaign(testInput);

    // Query the database to verify persistence
    const campaigns = await db.select()
      .from(campaignsTable)
      .where(eq(campaignsTable.id, result.id))
      .execute();

    expect(campaigns).toHaveLength(1);
    expect(campaigns[0].title).toEqual('Database Test Campaign');
    expect(campaigns[0].genre).toEqual('horror');
    expect(campaigns[0].status).toEqual('active');
    expect(campaigns[0].description).toEqual('A spooky campaign');
  });

  it('should handle all available genres', async () => {
    const genres = [
      'fantasy', 'cyberpunk', 'sci_fi', 'horror', 
      'western', 'modern', 'steampunk', 'post_apocalyptic'
    ] as const;

    for (const genre of genres) {
      const testInput: CreateCampaignInput = {
        user_id: testUserId,
        character_id: testCharacterId,
        title: `${genre} Campaign`,
        genre: genre
      };

      const result = await createCampaign(testInput);
      expect(result.genre).toEqual(genre);
    }
  });

  it('should throw error for non-existent user', async () => {
    const testInput: CreateCampaignInput = {
      user_id: 9999,
      character_id: testCharacterId,
      title: 'Invalid User Campaign',
      genre: 'fantasy'
    };

    await expect(createCampaign(testInput)).rejects.toThrow(/user with id 9999 not found/i);
  });

  it('should throw error for non-existent character', async () => {
    const testInput: CreateCampaignInput = {
      user_id: testUserId,
      character_id: 9999,
      title: 'Invalid Character Campaign',
      genre: 'fantasy'
    };

    await expect(createCampaign(testInput)).rejects.toThrow(/character with id 9999 not found/i);
  });

  it('should throw error when character does not belong to user', async () => {
    // Create another user and character
    const otherUserResult = await db.insert(usersTable)
      .values({
        username: 'otheruser',
        email: 'other@example.com',
        password_hash: 'other_hash'
      })
      .returning()
      .execute();

    const otherCharacterResult = await db.insert(charactersTable)
      .values({
        user_id: otherUserResult[0].id,
        name: 'Other Hero',
        race: 'Elf'
      })
      .returning()
      .execute();

    const testInput: CreateCampaignInput = {
      user_id: testUserId,
      character_id: otherCharacterResult[0].id,
      title: 'Wrong Owner Campaign',
      genre: 'fantasy'
    };

    await expect(createCampaign(testInput)).rejects.toThrow(/character .* does not belong to user/i);
  });

  it('should handle complex campaign_data', async () => {
    const complexData = {
      world_state: {
        kingdoms: ['Arathorn', 'Gondor', 'Rohan'],
        current_threat: 'Dragon of the North',
        alliances: {
          player_faction: 'Knights of Light',
          enemies: ['Shadow Cult', 'Orc Tribes']
        }
      },
      player_choices: [
        { choice: 'Saved the village', consequence: 'Gained reputation' },
        { choice: 'Spared the bandit', consequence: 'Enemy became ally' }
      ],
      inventory_state: {
        special_items: ['Magic Sword', 'Ancient Map'],
        currency: { gold: 500, silver: 250 }
      }
    };

    const testInput: CreateCampaignInput = {
      user_id: testUserId,
      character_id: testCharacterId,
      title: 'Complex Data Campaign',
      genre: 'fantasy',
      campaign_data: complexData
    };

    const result = await createCampaign(testInput);
    expect(result.campaign_data).toEqual(complexData);
  });
});