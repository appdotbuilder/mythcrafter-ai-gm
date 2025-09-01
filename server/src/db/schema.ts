import { serial, text, pgTable, timestamp, integer, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const campaignGenreEnum = pgEnum('campaign_genre', [
  'fantasy',
  'cyberpunk', 
  'sci_fi',
  'horror',
  'western',
  'modern',
  'steampunk',
  'post_apocalyptic'
]);

export const campaignStatusEnum = pgEnum('campaign_status', [
  'active',
  'paused',
  'completed'
]);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Characters table
export const charactersTable = pgTable('characters', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').references(() => usersTable.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  race: text('race'),
  character_class: text('character_class'),
  level: integer('level').notNull().default(1),
  experience_points: integer('experience_points').notNull().default(0),
  
  // Core stats
  strength: integer('strength').notNull().default(10),
  dexterity: integer('dexterity').notNull().default(10),
  constitution: integer('constitution').notNull().default(10),
  intelligence: integer('intelligence').notNull().default(10),
  wisdom: integer('wisdom').notNull().default(10),
  charisma: integer('charisma').notNull().default(10),
  
  // Health and resources
  hit_points: integer('hit_points').notNull().default(10),
  max_hit_points: integer('max_hit_points').notNull().default(10),
  armor_class: integer('armor_class').notNull().default(10),
  
  // Equipment and inventory stored as JSON
  inventory: jsonb('inventory'),
  equipment: jsonb('equipment'),
  
  // Character backstory and notes
  backstory: text('backstory'),
  notes: text('notes'),
  
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Campaigns table
export const campaignsTable = pgTable('campaigns', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').references(() => usersTable.id, { onDelete: 'cascade' }).notNull(),
  character_id: integer('character_id').references(() => charactersTable.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  genre: campaignGenreEnum('genre').notNull(),
  status: campaignStatusEnum('status').notNull().default('active'),
  description: text('description'),
  
  // Campaign progress and state
  current_scene: text('current_scene'),
  campaign_data: jsonb('campaign_data'), // Stores campaign state, variables, etc.
  
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Game sessions table for tracking individual play sessions
export const gameSessionsTable = pgTable('game_sessions', {
  id: serial('id').primaryKey(),
  campaign_id: integer('campaign_id').references(() => campaignsTable.id, { onDelete: 'cascade' }).notNull(),
  session_number: integer('session_number').notNull(),
  narrative: text('narrative').notNull(), // The story/events that happened in this session
  dice_rolls: jsonb('dice_rolls'), // Array of dice roll objects
  
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  characters: many(charactersTable),
  campaigns: many(campaignsTable)
}));

export const charactersRelations = relations(charactersTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [charactersTable.user_id],
    references: [usersTable.id]
  }),
  campaigns: many(campaignsTable)
}));

export const campaignsRelations = relations(campaignsTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [campaignsTable.user_id],
    references: [usersTable.id]
  }),
  character: one(charactersTable, {
    fields: [campaignsTable.character_id],
    references: [charactersTable.id]
  }),
  gameSessions: many(gameSessionsTable)
}));

export const gameSessionsRelations = relations(gameSessionsTable, ({ one }) => ({
  campaign: one(campaignsTable, {
    fields: [gameSessionsTable.campaign_id],
    references: [campaignsTable.id]
  })
}));

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;

export type Character = typeof charactersTable.$inferSelect;
export type NewCharacter = typeof charactersTable.$inferInsert;

export type Campaign = typeof campaignsTable.$inferSelect;
export type NewCampaign = typeof campaignsTable.$inferInsert;

export type GameSession = typeof gameSessionsTable.$inferSelect;
export type NewGameSession = typeof gameSessionsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = {
  users: usersTable,
  characters: charactersTable,
  campaigns: campaignsTable,
  gameSessions: gameSessionsTable
};