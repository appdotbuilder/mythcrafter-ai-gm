import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, charactersTable, campaignsTable } from '../db/schema';
import { getCampaign } from '../handlers/get_campaign';

describe('getCampaign', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUser: { id: number };
  let testCharacter: { id: number };
  let testCampaign: { id: number };
  let otherUser: { id: number };

  beforeEach(async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    testUser = userResult[0];

    // Create another user for ownership tests
    const otherUserResult = await db.insert(usersTable)
      .values({
        username: 'otheruser',
        email: 'other@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    otherUser = otherUserResult[0];

    // Create test character
    const characterResult = await db.insert(charactersTable)
      .values({
        user_id: testUser.id,
        name: 'Test Character',
        level: 5,
        experience_points: 1000
      })
      .returning()
      .execute();
    testCharacter = characterResult[0];

    // Create test campaign with comprehensive data
    const campaignResult = await db.insert(campaignsTable)
      .values({
        user_id: testUser.id,
        character_id: testCharacter.id,
        title: 'Epic Fantasy Quest',
        genre: 'fantasy',
        status: 'active',
        description: 'A thrilling adventure in a magical realm',
        current_scene: 'The Dark Forest',
        campaign_data: {
          location: 'Shadowlands',
          chapter: 3,
          companions: ['Elf Ranger', 'Dwarf Cleric'],
          inventory: { gold: 500, potions: 3 }
        }
      })
      .returning()
      .execute();
    testCampaign = campaignResult[0];
  });

  it('should retrieve a campaign by ID and user ID', async () => {
    const result = await getCampaign(testCampaign.id, testUser.id);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(testCampaign.id);
    expect(result!.user_id).toEqual(testUser.id);
    expect(result!.character_id).toEqual(testCharacter.id);
    expect(result!.title).toEqual('Epic Fantasy Quest');
    expect(result!.genre).toEqual('fantasy');
    expect(result!.status).toEqual('active');
    expect(result!.description).toEqual('A thrilling adventure in a magical realm');
    expect(result!.current_scene).toEqual('The Dark Forest');
    expect(result!.campaign_data).toEqual({
      location: 'Shadowlands',
      chapter: 3,
      companions: ['Elf Ranger', 'Dwarf Cleric'],
      inventory: { gold: 500, potions: 3 }
    });
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent campaign ID', async () => {
    const result = await getCampaign(99999, testUser.id);

    expect(result).toBeNull();
  });

  it('should return null when campaign belongs to different user', async () => {
    const result = await getCampaign(testCampaign.id, otherUser.id);

    expect(result).toBeNull();
  });

  it('should return null when user ID does not exist', async () => {
    const result = await getCampaign(testCampaign.id, 99999);

    expect(result).toBeNull();
  });

  it('should handle campaign with null optional fields', async () => {
    // Create campaign with minimal data (null optional fields)
    const minimalCampaignResult = await db.insert(campaignsTable)
      .values({
        user_id: testUser.id,
        character_id: testCharacter.id,
        title: 'Simple Campaign',
        genre: 'sci_fi',
        description: null,
        current_scene: null,
        campaign_data: null
      })
      .returning()
      .execute();

    const result = await getCampaign(minimalCampaignResult[0].id, testUser.id);

    expect(result).toBeDefined();
    expect(result!.title).toEqual('Simple Campaign');
    expect(result!.genre).toEqual('sci_fi');
    expect(result!.status).toEqual('active'); // Default value
    expect(result!.description).toBeNull();
    expect(result!.current_scene).toBeNull();
    expect(result!.campaign_data).toBeNull();
  });

  it('should handle campaign with different genres and statuses', async () => {
    // Create campaign with different genre and status
    const horrorCampaignResult = await db.insert(campaignsTable)
      .values({
        user_id: testUser.id,
        character_id: testCharacter.id,
        title: 'Horror Campaign',
        genre: 'horror',
        status: 'paused',
        description: 'A scary adventure',
        current_scene: 'Haunted Mansion',
        campaign_data: { fear_level: 'high', sanity: 60 }
      })
      .returning()
      .execute();

    const result = await getCampaign(horrorCampaignResult[0].id, testUser.id);

    expect(result).toBeDefined();
    expect(result!.genre).toEqual('horror');
    expect(result!.status).toEqual('paused');
    expect(result!.campaign_data).toEqual({ fear_level: 'high', sanity: 60 });
  });

  it('should handle complex campaign_data JSON', async () => {
    const complexData = {
      world: {
        name: 'Aethermoor',
        regions: ['Northern Wastes', 'Central Plains', 'Southern Kingdoms']
      },
      story: {
        act: 2,
        scene: 15,
        plot_points: ['Discovered ancient artifact', 'Met the Oracle', 'Defeated shadow beast']
      },
      party: {
        members: [
          { name: 'Aragorn', class: 'Ranger', hp: 85 },
          { name: 'Legolas', class: 'Archer', hp: 70 }
        ],
        reputation: 'heroic'
      },
      flags: {
        'dragon_encountered': true,
        'treasure_found': false,
        'alliance_formed': true
      }
    };

    const complexCampaignResult = await db.insert(campaignsTable)
      .values({
        user_id: testUser.id,
        character_id: testCharacter.id,
        title: 'Complex Campaign',
        genre: 'fantasy',
        campaign_data: complexData
      })
      .returning()
      .execute();

    const result = await getCampaign(complexCampaignResult[0].id, testUser.id);

    expect(result).toBeDefined();
    expect(result!.campaign_data).toEqual(complexData);
    expect(result!.campaign_data).toHaveProperty('world.name', 'Aethermoor');
    expect(result!.campaign_data).toHaveProperty('story.act', 2);
    expect(result!.campaign_data).toHaveProperty('party.members');
    expect((result!.campaign_data as any).party.members).toHaveLength(2);
  });
});