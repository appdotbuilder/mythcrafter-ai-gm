import { db } from '../db';
import { gameSessionsTable } from '../db/schema';
import { type GameSession } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getGameSessions(campaignId: number): Promise<GameSession[]> {
  try {
    const results = await db.select()
      .from(gameSessionsTable)
      .where(eq(gameSessionsTable.campaign_id, campaignId))
      .orderBy(desc(gameSessionsTable.session_number))
      .execute();

    return results.map(result => ({
      ...result,
      dice_rolls: result.dice_rolls as GameSession['dice_rolls']
    }));
  } catch (error) {
    console.error('Get game sessions failed:', error);
    throw error;
  }
}