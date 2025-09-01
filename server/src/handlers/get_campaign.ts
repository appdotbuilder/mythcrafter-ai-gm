import { db } from '../db';
import { campaignsTable } from '../db/schema';
import { type Campaign } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function getCampaign(campaignId: number, userId: number): Promise<Campaign | null> {
  try {
    // Query campaign by ID and user ID to ensure ownership
    const results = await db.select()
      .from(campaignsTable)
      .where(and(
        eq(campaignsTable.id, campaignId),
        eq(campaignsTable.user_id, userId)
      ))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const campaign = results[0];
    
    // Return the campaign with proper type conversion
    return {
      id: campaign.id,
      user_id: campaign.user_id,
      character_id: campaign.character_id,
      title: campaign.title,
      genre: campaign.genre,
      status: campaign.status,
      description: campaign.description,
      current_scene: campaign.current_scene,
      campaign_data: campaign.campaign_data as Record<string, any> | null,
      created_at: campaign.created_at,
      updated_at: campaign.updated_at
    };
  } catch (error) {
    console.error('Campaign retrieval failed:', error);
    throw error;
  }
}