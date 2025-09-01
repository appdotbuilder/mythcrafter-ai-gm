import { db } from '../db';
import { campaignsTable } from '../db/schema';
import { type UpdateCampaignInput, type Campaign } from '../schema';
import { eq } from 'drizzle-orm';

export const updateCampaign = async (input: UpdateCampaignInput): Promise<Campaign> => {
  try {
    // Build update object with only provided fields
    const updateData: Partial<typeof campaignsTable.$inferInsert> = {
      updated_at: new Date()
    };

    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    if (input.status !== undefined) {
      updateData.status = input.status;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.current_scene !== undefined) {
      updateData.current_scene = input.current_scene;
    }
    if (input.campaign_data !== undefined) {
      updateData.campaign_data = input.campaign_data;
    }

    // Update the campaign and return the updated record
    const result = await db.update(campaignsTable)
      .set(updateData)
      .where(eq(campaignsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Campaign with id ${input.id} not found`);
    }

    const campaign = result[0];
    return {
      ...campaign,
      campaign_data: campaign.campaign_data as Record<string, any> | null
    };
  } catch (error) {
    console.error('Campaign update failed:', error);
    throw error;
  }
};