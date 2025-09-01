import { type RollDiceInput, type DiceRollResult } from '../schema';

export const rollDice = async (input: RollDiceInput): Promise<DiceRollResult> => {
  try {
    // Parse dice notation (e.g., "1d20", "3d6")
    const diceMatch = input.dice.match(/^(\d+)d(\d+)$/);
    if (!diceMatch) {
      throw new Error(`Invalid dice notation: ${input.dice}. Must be in format like '1d20' or '3d6'`);
    }

    const numDice = parseInt(diceMatch[1], 10);
    const dieSize = parseInt(diceMatch[2], 10);

    // Validate dice parameters
    if (numDice <= 0) {
      throw new Error(`Number of dice must be positive, got: ${numDice}`);
    }
    
    if (numDice > 100) {
      throw new Error(`Number of dice cannot exceed 100, got: ${numDice}`);
    }

    if (dieSize <= 0) {
      throw new Error(`Die size must be positive, got: ${dieSize}`);
    }

    if (dieSize > 1000) {
      throw new Error(`Die size cannot exceed 1000, got: ${dieSize}`);
    }

    // Roll the dice
    const rolls: number[] = [];
    for (let i = 0; i < numDice; i++) {
      const roll = Math.floor(Math.random() * dieSize) + 1;
      rolls.push(roll);
    }

    // Calculate totals
    const total = rolls.reduce((sum, roll) => sum + roll, 0);
    const finalTotal = total + input.modifier;

    return {
      dice: input.dice,
      rolls: rolls,
      total: total,
      modifier: input.modifier,
      final_total: finalTotal,
      roll_type: input.roll_type || null
    };
  } catch (error) {
    console.error('Dice rolling failed:', error);
    throw error;
  }
};