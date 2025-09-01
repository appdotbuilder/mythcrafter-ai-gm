import { describe, expect, it } from 'bun:test';
import { type RollDiceInput } from '../schema';
import { rollDice } from '../handlers/roll_dice';

// Basic test input
const testInput: RollDiceInput = {
  dice: '1d20',
  modifier: 0,
  roll_type: 'attack'
};

describe('rollDice', () => {
  it('should roll a single d20 with no modifier', async () => {
    const result = await rollDice(testInput);

    // Validate structure
    expect(result.dice).toEqual('1d20');
    expect(result.rolls).toHaveLength(1);
    expect(result.modifier).toEqual(0);
    expect(result.roll_type).toEqual('attack');

    // Validate roll range (1-20 for d20)
    expect(result.rolls[0]).toBeGreaterThanOrEqual(1);
    expect(result.rolls[0]).toBeLessThanOrEqual(20);
    expect(typeof result.rolls[0]).toBe('number');
    expect(Number.isInteger(result.rolls[0])).toBe(true);

    // Validate calculations
    expect(result.total).toEqual(result.rolls[0]);
    expect(result.final_total).toEqual(result.total + result.modifier);
  });

  it('should roll multiple dice correctly', async () => {
    const input: RollDiceInput = {
      dice: '3d6',
      modifier: 2
    };

    const result = await rollDice(input);

    expect(result.dice).toEqual('3d6');
    expect(result.rolls).toHaveLength(3);
    expect(result.modifier).toEqual(2);
    expect(result.roll_type).toBeNull(); // No roll_type provided

    // Validate each roll is within range (1-6 for d6)
    result.rolls.forEach(roll => {
      expect(roll).toBeGreaterThanOrEqual(1);
      expect(roll).toBeLessThanOrEqual(6);
      expect(Number.isInteger(roll)).toBe(true);
    });

    // Validate calculations
    const expectedTotal = result.rolls.reduce((sum, roll) => sum + roll, 0);
    expect(result.total).toEqual(expectedTotal);
    expect(result.final_total).toEqual(result.total + 2);
  });

  it('should handle negative modifiers', async () => {
    const input: RollDiceInput = {
      dice: '1d6',
      modifier: -3,
      roll_type: 'damage'
    };

    const result = await rollDice(input);

    expect(result.modifier).toEqual(-3);
    expect(result.final_total).toEqual(result.total - 3);
    expect(result.roll_type).toEqual('damage');

    // Roll should still be valid (1-6)
    expect(result.rolls[0]).toBeGreaterThanOrEqual(1);
    expect(result.rolls[0]).toBeLessThanOrEqual(6);
  });

  it('should handle large dice sizes', async () => {
    const input: RollDiceInput = {
      dice: '1d100',
      modifier: 0
    };

    const result = await rollDice(input);

    expect(result.dice).toEqual('1d100');
    expect(result.rolls[0]).toBeGreaterThanOrEqual(1);
    expect(result.rolls[0]).toBeLessThanOrEqual(100);
  });

  it('should handle multiple large dice with large modifiers', async () => {
    const input: RollDiceInput = {
      dice: '10d10',
      modifier: 25,
      roll_type: 'massive_damage'
    };

    const result = await rollDice(input);

    expect(result.dice).toEqual('10d10');
    expect(result.rolls).toHaveLength(10);
    expect(result.modifier).toEqual(25);

    // Each roll should be 1-10
    result.rolls.forEach(roll => {
      expect(roll).toBeGreaterThanOrEqual(1);
      expect(roll).toBeLessThanOrEqual(10);
    });

    // Total should be at least 10 (all 1s) and at most 100 (all 10s)
    expect(result.total).toBeGreaterThanOrEqual(10);
    expect(result.total).toBeLessThanOrEqual(100);
    expect(result.final_total).toEqual(result.total + 25);
  });

  it('should use default modifier value', async () => {
    const input: RollDiceInput = {
      dice: '2d4',
      modifier: 0 // Testing with explicit 0 value (schema default)
    };

    const result = await rollDice(input);

    expect(result.modifier).toEqual(0);
    expect(result.final_total).toEqual(result.total);
  });

  it('should handle edge case of 1d1 (always rolls 1)', async () => {
    const input: RollDiceInput = {
      dice: '1d1',
      modifier: 5
    };

    const result = await rollDice(input);

    expect(result.rolls[0]).toEqual(1);
    expect(result.total).toEqual(1);
    expect(result.final_total).toEqual(6);
  });

  it('should handle maximum allowed dice count', async () => {
    const input: RollDiceInput = {
      dice: '100d4',
      modifier: 0
    };

    const result = await rollDice(input);

    expect(result.rolls).toHaveLength(100);
    result.rolls.forEach(roll => {
      expect(roll).toBeGreaterThanOrEqual(1);
      expect(roll).toBeLessThanOrEqual(4);
    });
  });

  // Error cases
  it('should reject invalid dice notation', async () => {
    const input: RollDiceInput = {
      dice: 'invalid',
      modifier: 0
    };

    await expect(rollDice(input)).rejects.toThrow(/invalid dice notation/i);
  });

  it('should reject zero dice count', async () => {
    const input: RollDiceInput = {
      dice: '0d6',
      modifier: 0
    };

    await expect(rollDice(input)).rejects.toThrow(/number of dice must be positive/i);
  });

  it('should reject negative dice count', async () => {
    const input: RollDiceInput = {
      dice: '-1d6',
      modifier: 0
    };

    await expect(rollDice(input)).rejects.toThrow(/invalid dice notation/i);
  });

  it('should reject zero die size', async () => {
    const input: RollDiceInput = {
      dice: '1d0',
      modifier: 0
    };

    await expect(rollDice(input)).rejects.toThrow(/die size must be positive/i);
  });

  it('should reject excessive dice count', async () => {
    const input: RollDiceInput = {
      dice: '101d6',
      modifier: 0
    };

    await expect(rollDice(input)).rejects.toThrow(/number of dice cannot exceed 100/i);
  });

  it('should reject excessive die size', async () => {
    const input: RollDiceInput = {
      dice: '1d1001',
      modifier: 0
    };

    await expect(rollDice(input)).rejects.toThrow(/die size cannot exceed 1000/i);
  });

  // Statistical validation - run multiple rolls to ensure randomness
  it('should produce varied results over multiple rolls', async () => {
    const input: RollDiceInput = {
      dice: '1d20',
      modifier: 0
    };

    const results: number[] = [];
    for (let i = 0; i < 20; i++) {
      const result = await rollDice(input);
      results.push(result.rolls[0]);
    }

    // Should have more than one unique result (very high probability with 20 rolls on d20)
    const uniqueResults = new Set(results);
    expect(uniqueResults.size).toBeGreaterThan(1);

    // All results should be in valid range
    results.forEach(roll => {
      expect(roll).toBeGreaterThanOrEqual(1);
      expect(roll).toBeLessThanOrEqual(20);
    });
  });
});