import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, charactersTable, campaignsTable } from '../db/schema';
import { getCampaigns } from '../handlers/get_campaigns';
import { eq } from 'drizzle-orm';

describe('getCampaigns', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when user has no campaigns', async () => {
    // Create a user without campaigns
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    const campaigns = await getCampaigns(userId);

    expect(campaigns).toEqual([]);
  });

  it('should return campaigns for a specific user', async () => {
    // Create a user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create a character for the user
    const characterResult = await db.insert(charactersTable)
      .values({
        user_id: userId,
        name: 'Test Character',
        race: 'Human',
        character_class: 'Fighter'
      })
      .returning()
      .execute();

    const characterId = characterResult[0].id;

    // Create campaigns for the user
    const campaignData = [
      {
        user_id: userId,
        character_id: characterId,
        title: 'The Dragon Quest',
        genre: 'fantasy' as const,
        status: 'active' as const,
        description: 'An epic fantasy adventure',
        current_scene: 'Village tavern'
      },
      {
        user_id: userId,
        character_id: characterId,
        title: 'Cyberpunk Chronicles',
        genre: 'cyberpunk' as const,
        status: 'paused' as const,
        description: 'High-tech, low-life adventure'
      }
    ];

    await db.insert(campaignsTable)
      .values(campaignData)
      .execute();

    const campaigns = await getCampaigns(userId);

    expect(campaigns).toHaveLength(2);

    // Check first campaign
    const dragonQuest = campaigns.find(c => c.title === 'The Dragon Quest');
    expect(dragonQuest).toBeDefined();
    expect(dragonQuest!.genre).toEqual('fantasy');
    expect(dragonQuest!.status).toEqual('active');
    expect(dragonQuest!.description).toEqual('An epic fantasy adventure');
    expect(dragonQuest!.current_scene).toEqual('Village tavern');
    expect(dragonQuest!.id).toBeDefined();
    expect(dragonQuest!.created_at).toBeInstanceOf(Date);
    expect(dragonQuest!.updated_at).toBeInstanceOf(Date);

    // Check second campaign
    const cyberpunkChronicles = campaigns.find(c => c.title === 'Cyberpunk Chronicles');
    expect(cyberpunkChronicles).toBeDefined();
    expect(cyberpunkChronicles!.genre).toEqual('cyberpunk');
    expect(cyberpunkChronicles!.status).toEqual('paused');
    expect(cyberpunkChronicles!.description).toEqual('High-tech, low-life adventure');
    expect(cyberpunkChronicles!.current_scene).toBeNull();
  });

  it('should not return campaigns from other users', async () => {
    // Create two users
    const user1Result = await db.insert(usersTable)
      .values({
        username: 'user1',
        email: 'user1@example.com',
        password_hash: 'hashed_password1'
      })
      .returning()
      .execute();

    const user2Result = await db.insert(usersTable)
      .values({
        username: 'user2',
        email: 'user2@example.com',
        password_hash: 'hashed_password2'
      })
      .returning()
      .execute();

    const user1Id = user1Result[0].id;
    const user2Id = user2Result[0].id;

    // Create characters for both users
    const char1Result = await db.insert(charactersTable)
      .values({
        user_id: user1Id,
        name: 'Character 1',
        race: 'Elf',
        character_class: 'Wizard'
      })
      .returning()
      .execute();

    const char2Result = await db.insert(charactersTable)
      .values({
        user_id: user2Id,
        name: 'Character 2',
        race: 'Dwarf',
        character_class: 'Cleric'
      })
      .returning()
      .execute();

    // Create campaigns for both users
    await db.insert(campaignsTable)
      .values([
        {
          user_id: user1Id,
          character_id: char1Result[0].id,
          title: 'User 1 Campaign',
          genre: 'fantasy' as const
        },
        {
          user_id: user2Id,
          character_id: char2Result[0].id,
          title: 'User 2 Campaign',
          genre: 'sci_fi' as const
        }
      ])
      .execute();

    // Get campaigns for user 1
    const user1Campaigns = await getCampaigns(user1Id);

    expect(user1Campaigns).toHaveLength(1);
    expect(user1Campaigns[0].title).toEqual('User 1 Campaign');
    expect(user1Campaigns[0].user_id).toEqual(user1Id);

    // Get campaigns for user 2
    const user2Campaigns = await getCampaigns(user2Id);

    expect(user2Campaigns).toHaveLength(1);
    expect(user2Campaigns[0].title).toEqual('User 2 Campaign');
    expect(user2Campaigns[0].user_id).toEqual(user2Id);
  });

  it('should handle campaigns with complex JSON data', async () => {
    // Create user and character
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const characterResult = await db.insert(charactersTable)
      .values({
        user_id: userResult[0].id,
        name: 'Test Character',
        race: 'Human',
        character_class: 'Rogue'
      })
      .returning()
      .execute();

    // Create campaign with complex JSON data
    const campaignData = {
      variables: {
        questProgress: 50,
        npcsMetr: ['Gandalf', 'Aragorn'],
        inventory: {
          gold: 1000,
          items: ['sword', 'shield', 'potion']
        }
      },
      flags: {
        dragonDefeated: false,
        kingdomSaved: false
      }
    };

    await db.insert(campaignsTable)
      .values({
        user_id: userResult[0].id,
        character_id: characterResult[0].id,
        title: 'Complex Campaign',
        genre: 'fantasy' as const,
        campaign_data: campaignData
      })
      .execute();

    const campaigns = await getCampaigns(userResult[0].id);

    expect(campaigns).toHaveLength(1);
    expect(campaigns[0].title).toEqual('Complex Campaign');
    expect(campaigns[0].campaign_data).toEqual(campaignData);
  });

  it('should retrieve campaigns from database correctly', async () => {
    // Create user and character
    const userResult = await db.insert(usersTable)
      .values({
        username: 'dbuser',
        email: 'db@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const characterResult = await db.insert(charactersTable)
      .values({
        user_id: userResult[0].id,
        name: 'DB Character',
        race: 'Halfling',
        character_class: 'Bard'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;
    const characterId = characterResult[0].id;

    // Create campaign through handler
    await db.insert(campaignsTable)
      .values({
        user_id: userId,
        character_id: characterId,
        title: 'Database Test Campaign',
        genre: 'horror' as const,
        status: 'completed' as const,
        description: 'A finished horror campaign'
      })
      .execute();

    // Verify through direct database query
    const directQuery = await db.select()
      .from(campaignsTable)
      .where(eq(campaignsTable.user_id, userId))
      .execute();

    expect(directQuery).toHaveLength(1);
    expect(directQuery[0].title).toEqual('Database Test Campaign');

    // Verify through handler
    const handlerResult = await getCampaigns(userId);

    expect(handlerResult).toHaveLength(1);
    expect(handlerResult[0].title).toEqual('Database Test Campaign');
    expect(handlerResult[0].genre).toEqual('horror');
    expect(handlerResult[0].status).toEqual('completed');
    // Compare essential fields (campaign_data types differ between direct query and handler)
    expect(handlerResult[0].id).toEqual(directQuery[0].id);
    expect(handlerResult[0].title).toEqual(directQuery[0].title);
    expect(handlerResult[0].genre).toEqual(directQuery[0].genre);
    expect(handlerResult[0].status).toEqual(directQuery[0].status);
  });
});