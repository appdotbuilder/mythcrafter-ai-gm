import { db } from '../db';
import { campaignsTable } from '../db/schema';
import { type Campaign } from '../schema';
import { eq } from 'drizzle-orm';

export async function getCampaigns(userId: number): Promise<Campaign[]> {
  try {
    // Fetch all campaigns for the specified user
    const results = await db.select()
      .from(campaignsTable)
      .where(eq(campaignsTable.user_id, userId))
      .execute();

    // Convert campaign_data from unknown to proper type
    return results.map(campaign => ({
      ...campaign,
      campaign_data: campaign.campaign_data as Record<string, any> | null
    }));
  } catch (error) {
    console.error('Failed to fetch campaigns:', error);
    throw error;
  }
}