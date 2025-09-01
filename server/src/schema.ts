import { z } from 'zod';

// User schema
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().email(),
  password_hash: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Campaign genre enum
export const campaignGenreSchema = z.enum([
  'fantasy',
  'cyberpunk',
  'sci_fi',
  'horror',
  'western',
  'modern',
  'steampunk',
  'post_apocalyptic'
]);

export type CampaignGenre = z.infer<typeof campaignGenreSchema>;

// Campaign status enum
export const campaignStatusSchema = z.enum([
  'active',
  'paused',
  'completed'
]);

export type CampaignStatus = z.infer<typeof campaignStatusSchema>;

// Character schema
export const characterSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  name: z.string(),
  race: z.string().nullable(),
  character_class: z.string().nullable(),
  level: z.number().int(),
  experience_points: z.number().int(),
  
  // Core stats
  strength: z.number().int(),
  dexterity: z.number().int(),
  constitution: z.number().int(),
  intelligence: z.number().int(),
  wisdom: z.number().int(),
  charisma: z.number().int(),
  
  // Health and resources
  hit_points: z.number().int(),
  max_hit_points: z.number().int(),
  armor_class: z.number().int(),
  
  // Equipment and inventory stored as JSON
  inventory: z.record(z.any()).nullable(),
  equipment: z.record(z.any()).nullable(),
  
  // Character backstory and notes
  backstory: z.string().nullable(),
  notes: z.string().nullable(),
  
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Character = z.infer<typeof characterSchema>;

// Campaign schema
export const campaignSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  character_id: z.number(),
  title: z.string(),
  genre: campaignGenreSchema,
  status: campaignStatusSchema,
  description: z.string().nullable(),
  
  // Campaign progress and state
  current_scene: z.string().nullable(),
  campaign_data: z.record(z.any()).nullable(), // Stores campaign state, variables, etc.
  
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Campaign = z.infer<typeof campaignSchema>;

// Game session schema for tracking individual play sessions
export const gameSessionSchema = z.object({
  id: z.number(),
  campaign_id: z.number(),
  session_number: z.number().int(),
  narrative: z.string(), // The story/events that happened in this session
  dice_rolls: z.array(z.object({
    roll_type: z.string(),
    dice: z.string(), // e.g., "1d20", "3d6"
    result: z.number().int(),
    modifier: z.number().int(),
    total: z.number().int(),
    timestamp: z.coerce.date()
  })).nullable(),
  
  created_at: z.coerce.date()
});

export type GameSession = z.infer<typeof gameSessionSchema>;

// Input schemas for creating entities
export const createUserInputSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(6)
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const createCharacterInputSchema = z.object({
  user_id: z.number(),
  name: z.string().min(1).max(100),
  race: z.string().nullable().optional(),
  character_class: z.string().nullable().optional(),
  level: z.number().int().min(1).default(1),
  experience_points: z.number().int().nonnegative().default(0),
  
  // Core stats - default to 10 for balanced character
  strength: z.number().int().min(1).max(20).default(10),
  dexterity: z.number().int().min(1).max(20).default(10),
  constitution: z.number().int().min(1).max(20).default(10),
  intelligence: z.number().int().min(1).max(20).default(10),
  wisdom: z.number().int().min(1).max(20).default(10),
  charisma: z.number().int().min(1).max(20).default(10),
  
  hit_points: z.number().int().positive().optional(),
  max_hit_points: z.number().int().positive().optional(),
  armor_class: z.number().int().min(1).default(10),
  
  inventory: z.record(z.any()).nullable().optional(),
  equipment: z.record(z.any()).nullable().optional(),
  backstory: z.string().nullable().optional(),
  notes: z.string().nullable().optional()
});

export type CreateCharacterInput = z.infer<typeof createCharacterInputSchema>;

export const createCampaignInputSchema = z.object({
  user_id: z.number(),
  character_id: z.number(),
  title: z.string().min(1).max(200),
  genre: campaignGenreSchema,
  description: z.string().nullable().optional(),
  current_scene: z.string().nullable().optional(),
  campaign_data: z.record(z.any()).nullable().optional()
});

export type CreateCampaignInput = z.infer<typeof createCampaignInputSchema>;

export const createGameSessionInputSchema = z.object({
  campaign_id: z.number(),
  session_number: z.number().int().positive(),
  narrative: z.string(),
  dice_rolls: z.array(z.object({
    roll_type: z.string(),
    dice: z.string(),
    result: z.number().int(),
    modifier: z.number().int(),
    total: z.number().int(),
    timestamp: z.coerce.date()
  })).nullable().optional()
});

export type CreateGameSessionInput = z.infer<typeof createGameSessionInputSchema>;

// Update schemas
export const updateCharacterInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).max(100).optional(),
  race: z.string().nullable().optional(),
  character_class: z.string().nullable().optional(),
  level: z.number().int().min(1).max(20).optional(),
  experience_points: z.number().int().nonnegative().optional(),
  
  strength: z.number().int().min(1).max(20).optional(),
  dexterity: z.number().int().min(1).max(20).optional(),
  constitution: z.number().int().min(1).max(20).optional(),
  intelligence: z.number().int().min(1).max(20).optional(),
  wisdom: z.number().int().min(1).max(20).optional(),
  charisma: z.number().int().min(1).max(20).optional(),
  
  hit_points: z.number().int().nonnegative().optional(),
  max_hit_points: z.number().int().positive().optional(),
  armor_class: z.number().int().min(1).optional(),
  
  inventory: z.record(z.any()).nullable().optional(),
  equipment: z.record(z.any()).nullable().optional(),
  backstory: z.string().nullable().optional(),
  notes: z.string().nullable().optional()
});

export type UpdateCharacterInput = z.infer<typeof updateCharacterInputSchema>;

export const updateCampaignInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).max(200).optional(),
  status: campaignStatusSchema.optional(),
  description: z.string().nullable().optional(),
  current_scene: z.string().nullable().optional(),
  campaign_data: z.record(z.any()).nullable().optional()
});

export type UpdateCampaignInput = z.infer<typeof updateCampaignInputSchema>;

// Authentication schemas
export const loginInputSchema = z.object({
  username: z.string(),
  password: z.string()
});

export type LoginInput = z.infer<typeof loginInputSchema>;

// Dice roll schema for game mechanics
export const rollDiceInputSchema = z.object({
  dice: z.string().regex(/^\d+d\d+$/, "Must be in format like '1d20' or '3d6'"),
  modifier: z.number().int().default(0),
  roll_type: z.string().optional()
});

export type RollDiceInput = z.infer<typeof rollDiceInputSchema>;

export const diceRollResultSchema = z.object({
  dice: z.string(),
  rolls: z.array(z.number().int()),
  total: z.number().int(),
  modifier: z.number().int(),
  final_total: z.number().int(),
  roll_type: z.string().nullable()
});

export type DiceRollResult = z.infer<typeof diceRollResultSchema>;