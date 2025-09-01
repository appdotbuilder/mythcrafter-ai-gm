import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createUserInputSchema,
  loginInputSchema,
  createCharacterInputSchema,
  updateCharacterInputSchema,
  createCampaignInputSchema,
  updateCampaignInputSchema,
  createGameSessionInputSchema,
  rollDiceInputSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { loginUser } from './handlers/login_user';
import { createCharacter } from './handlers/create_character';
import { getCharacters } from './handlers/get_characters';
import { getCharacter } from './handlers/get_character';
import { updateCharacter } from './handlers/update_character';
import { createCampaign } from './handlers/create_campaign';
import { getCampaigns } from './handlers/get_campaigns';
import { getCampaign } from './handlers/get_campaign';
import { updateCampaign } from './handlers/update_campaign';
import { createGameSession } from './handlers/create_game_session';
import { getGameSessions } from './handlers/get_game_sessions';
import { rollDice } from './handlers/roll_dice';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User authentication routes
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),

  login: publicProcedure
    .input(loginInputSchema)
    .mutation(({ input }) => loginUser(input)),

  // Character management routes
  createCharacter: publicProcedure
    .input(createCharacterInputSchema)
    .mutation(({ input }) => createCharacter(input)),

  getCharacters: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getCharacters(input.userId)),

  getCharacter: publicProcedure
    .input(z.object({ characterId: z.number(), userId: z.number() }))
    .query(({ input }) => getCharacter(input.characterId, input.userId)),

  updateCharacter: publicProcedure
    .input(updateCharacterInputSchema)
    .mutation(({ input }) => updateCharacter(input)),

  // Campaign management routes
  createCampaign: publicProcedure
    .input(createCampaignInputSchema)
    .mutation(({ input }) => createCampaign(input)),

  getCampaigns: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getCampaigns(input.userId)),

  getCampaign: publicProcedure
    .input(z.object({ campaignId: z.number(), userId: z.number() }))
    .query(({ input }) => getCampaign(input.campaignId, input.userId)),

  updateCampaign: publicProcedure
    .input(updateCampaignInputSchema)
    .mutation(({ input }) => updateCampaign(input)),

  // Game session routes
  createGameSession: publicProcedure
    .input(createGameSessionInputSchema)
    .mutation(({ input }) => createGameSession(input)),

  getGameSessions: publicProcedure
    .input(z.object({ campaignId: z.number() }))
    .query(({ input }) => getGameSessions(input.campaignId)),

  // Game mechanics routes
  rollDice: publicProcedure
    .input(rollDiceInputSchema)
    .mutation(({ input }) => rollDice(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`MythCrafter TRPC server listening at port: ${port}`);
}

start();