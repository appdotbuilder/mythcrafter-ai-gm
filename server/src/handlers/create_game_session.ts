import { db } from '../db';
import { gameSessionsTable } from '../db/schema';
import { type CreateGameSessionInput, type GameSession } from '../schema';

export const createGameSession = async (input: CreateGameSessionInput): Promise<GameSession> => {
  try {
    // Insert game session record
    const result = await db.insert(gameSessionsTable)
      .values({
        campaign_id: input.campaign_id,
        session_number: input.session_number,
        narrative: input.narrative,
        dice_rolls: input.dice_rolls || null
      })
      .returning()
      .execute();

    const gameSession = result[0];
    
    // Handle dice_rolls typing - the database returns JSONB as unknown
    return {
      ...gameSession,
      dice_rolls: gameSession.dice_rolls as GameSession['dice_rolls']
    };
  } catch (error) {
    console.error('Game session creation failed:', error);
    throw error;
  }
};