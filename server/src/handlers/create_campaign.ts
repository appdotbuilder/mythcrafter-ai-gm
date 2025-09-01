import { db } from '../db';
import { campaignsTable, usersTable, charactersTable } from '../db/schema';
import { type CreateCampaignInput, type Campaign } from '../schema';
import { eq } from 'drizzle-orm';

export async function createCampaign(input: CreateCampaignInput): Promise<Campaign> {
  try {
    // Verify that the user exists
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (user.length === 0) {
      throw new Error(`User with id ${input.user_id} not found`);
    }

    // Verify that the character exists and belongs to the user
    const character = await db.select()
      .from(charactersTable)
      .where(eq(charactersTable.id, input.character_id))
      .execute();

    if (character.length === 0) {
      throw new Error(`Character with id ${input.character_id} not found`);
    }

    if (character[0].user_id !== input.user_id) {
      throw new Error(`Character ${input.character_id} does not belong to user ${input.user_id}`);
    }

    // Insert the campaign record
    const result = await db.insert(campaignsTable)
      .values({
        user_id: input.user_id,
        character_id: input.character_id,
        title: input.title,
        genre: input.genre,
        status: 'active',
        description: input.description || null,
        current_scene: input.current_scene || null,
        campaign_data: input.campaign_data || null
      })
      .returning()
      .execute();

    const campaign = result[0];
    return {
      ...campaign,
      campaign_data: campaign.campaign_data as Record<string, any> | null
    };
  } catch (error) {
    console.error('Campaign creation failed:', error);
    throw error;
  }
}