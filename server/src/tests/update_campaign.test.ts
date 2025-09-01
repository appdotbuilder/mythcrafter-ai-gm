import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, charactersTable, campaignsTable } from '../db/schema';
import { type UpdateCampaignInput } from '../schema';
import { updateCampaign } from '../handlers/update_campaign';
import { eq } from 'drizzle-orm';

describe('updateCampaign', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testCharacterId: number;
  let testCampaignId: number;

  beforeEach(async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create test character
    const characterResult = await db.insert(charactersTable)
      .values({
        user_id: testUserId,
        name: 'Test Hero',
        race: 'Human',
        character_class: 'Fighter',
        level: 5
      })
      .returning()
      .execute();
    testCharacterId = characterResult[0].id;

    // Create test campaign
    const campaignResult = await db.insert(campaignsTable)
      .values({
        user_id: testUserId,
        character_id: testCharacterId,
        title: 'Original Campaign Title',
        genre: 'fantasy',
        status: 'active',
        description: 'Original description',
        current_scene: 'tavern',
        campaign_data: { chapter: 1, location: 'village' }
      })
      .returning()
      .execute();
    testCampaignId = campaignResult[0].id;
  });

  it('should update campaign title', async () => {
    const input: UpdateCampaignInput = {
      id: testCampaignId,
      title: 'Updated Campaign Title'
    };

    const result = await updateCampaign(input);

    expect(result.title).toEqual('Updated Campaign Title');
    expect(result.description).toEqual('Original description'); // Should remain unchanged
    expect(result.status).toEqual('active'); // Should remain unchanged
  });

  it('should update campaign status', async () => {
    const input: UpdateCampaignInput = {
      id: testCampaignId,
      status: 'paused'
    };

    const result = await updateCampaign(input);

    expect(result.status).toEqual('paused');
    expect(result.title).toEqual('Original Campaign Title'); // Should remain unchanged
  });

  it('should update campaign description', async () => {
    const input: UpdateCampaignInput = {
      id: testCampaignId,
      description: 'New epic adventure description'
    };

    const result = await updateCampaign(input);

    expect(result.description).toEqual('New epic adventure description');
    expect(result.title).toEqual('Original Campaign Title'); // Should remain unchanged
  });

  it('should update current scene', async () => {
    const input: UpdateCampaignInput = {
      id: testCampaignId,
      current_scene: 'dragon lair'
    };

    const result = await updateCampaign(input);

    expect(result.current_scene).toEqual('dragon lair');
    expect(result.title).toEqual('Original Campaign Title'); // Should remain unchanged
  });

  it('should update campaign data', async () => {
    const newCampaignData = { 
      chapter: 3, 
      location: 'mountain', 
      npcs_met: ['wizard', 'merchant'],
      items_found: ['magic sword', 'healing potion']
    };

    const input: UpdateCampaignInput = {
      id: testCampaignId,
      campaign_data: newCampaignData
    };

    const result = await updateCampaign(input);

    expect(result.campaign_data).toEqual(newCampaignData);
    expect(result.title).toEqual('Original Campaign Title'); // Should remain unchanged
  });

  it('should update multiple fields simultaneously', async () => {
    const input: UpdateCampaignInput = {
      id: testCampaignId,
      title: 'Multi-Update Campaign',
      status: 'completed',
      description: 'Campaign has ended',
      current_scene: 'epilogue',
      campaign_data: { final_chapter: true, outcome: 'victory' }
    };

    const result = await updateCampaign(input);

    expect(result.title).toEqual('Multi-Update Campaign');
    expect(result.status).toEqual('completed');
    expect(result.description).toEqual('Campaign has ended');
    expect(result.current_scene).toEqual('epilogue');
    expect(result.campaign_data).toEqual({ final_chapter: true, outcome: 'victory' });
    expect(result.id).toEqual(testCampaignId);
    expect(result.user_id).toEqual(testUserId);
    expect(result.character_id).toEqual(testCharacterId);
    expect(result.genre).toEqual('fantasy');
  });

  it('should update the updated_at timestamp', async () => {
    const originalCampaign = await db.select()
      .from(campaignsTable)
      .where(eq(campaignsTable.id, testCampaignId))
      .execute();

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const input: UpdateCampaignInput = {
      id: testCampaignId,
      title: 'Timestamp Test'
    };

    const result = await updateCampaign(input);

    expect(result.updated_at.getTime()).toBeGreaterThan(originalCampaign[0].updated_at.getTime());
    expect(result.created_at).toEqual(originalCampaign[0].created_at);
  });

  it('should persist changes to database', async () => {
    const input: UpdateCampaignInput = {
      id: testCampaignId,
      title: 'Database Persistence Test',
      status: 'paused'
    };

    await updateCampaign(input);

    // Verify changes were persisted
    const savedCampaign = await db.select()
      .from(campaignsTable)
      .where(eq(campaignsTable.id, testCampaignId))
      .execute();

    expect(savedCampaign).toHaveLength(1);
    expect(savedCampaign[0].title).toEqual('Database Persistence Test');
    expect(savedCampaign[0].status).toEqual('paused');
    expect(savedCampaign[0].description).toEqual('Original description');
  });

  it('should handle null values for optional fields', async () => {
    const input: UpdateCampaignInput = {
      id: testCampaignId,
      description: null,
      current_scene: null,
      campaign_data: null
    };

    const result = await updateCampaign(input);

    expect(result.description).toBeNull();
    expect(result.current_scene).toBeNull();
    expect(result.campaign_data).toBeNull();
    expect(result.title).toEqual('Original Campaign Title'); // Should remain unchanged
  });

  it('should throw error for non-existent campaign', async () => {
    const input: UpdateCampaignInput = {
      id: 99999,
      title: 'Non-existent Campaign'
    };

    await expect(updateCampaign(input)).rejects.toThrow(/Campaign with id 99999 not found/i);
  });

  it('should preserve original values when no updates provided', async () => {
    const input: UpdateCampaignInput = {
      id: testCampaignId
    };

    const result = await updateCampaign(input);

    expect(result.title).toEqual('Original Campaign Title');
    expect(result.description).toEqual('Original description');
    expect(result.status).toEqual('active');
    expect(result.current_scene).toEqual('tavern');
    expect(result.campaign_data).toEqual({ chapter: 1, location: 'village' });
  });
});