import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dice6, Plus, Minus } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { RollDiceInput, DiceRollResult } from '../../../server/src/schema';

export function DiceRoller() {
  const [isOpen, setIsOpen] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [rollHistory, setRollHistory] = useState<DiceRollResult[]>([]);

  // Form state
  const [rollData, setRollData] = useState<RollDiceInput>({
    dice: '1d20',
    modifier: 0,
    roll_type: ''
  });

  // Quick roll presets
  const quickRolls = [
    { dice: '1d20', label: 'd20', description: 'Ability Check' },
    { dice: '1d12', label: 'd12', description: 'Damage' },
    { dice: '1d10', label: 'd10', description: 'Damage' },
    { dice: '1d8', label: 'd8', description: 'Damage' },
    { dice: '1d6', label: 'd6', description: 'Damage' },
    { dice: '1d4', label: 'd4', description: 'Damage' },
    { dice: '2d6', label: '2d6', description: 'Advantage' },
    { dice: '3d6', label: '3d6', description: 'Stats' }
  ];

  const rollTypes = [
    'Ability Check',
    'Skill Check',
    'Attack Roll',
    'Damage Roll',
    'Saving Throw',
    'Initiative',
    'Custom'
  ];

  const handleRoll = async (diceToRoll?: string, rollType?: string) => {
    const diceString = diceToRoll || rollData.dice;
    const type = rollType || rollData.roll_type;

    setIsRolling(true);

    try {
      const result = await trpc.rollDice.mutate({
        dice: diceString,
        modifier: rollData.modifier,
        roll_type: type
      });

      setRollHistory((prev: DiceRollResult[]) => [result, ...prev.slice(0, 9)]); // Keep last 10 rolls
    } catch (error) {
      console.error('Failed to roll dice:', error);
    } finally {
      setIsRolling(false);
    }
  };

  const handleQuickRoll = (dice: string, type: string) => {
    handleRoll(dice, type);
  };

  const adjustModifier = (change: number) => {
    setRollData((prev: RollDiceInput) => ({
      ...prev,
      modifier: Math.max(-10, Math.min(10, prev.modifier + change))
    }));
  };

  const getResultColor = (result: DiceRollResult) => {
    if (result.dice === '1d20') {
      const naturalRoll = result.rolls[0];
      if (naturalRoll === 20) return 'text-green-400';
      if (naturalRoll === 1) return 'text-red-400';
    }
    return 'text-white';
  };

  const getResultBadgeColor = (result: DiceRollResult) => {
    if (result.dice === '1d20') {
      const naturalRoll = result.rolls[0];
      if (naturalRoll === 20) return 'bg-green-600';
      if (naturalRoll === 1) return 'bg-red-600';
    }
    return 'bg-purple-600';
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-purple-600 hover:bg-purple-700">
          <Dice6 className="h-4 w-4 mr-2" />
          Roll Dice
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-slate-900 border-purple-800/50 text-white max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Dice6 className="h-5 w-5" />
            <span>Dice Roller</span>
          </DialogTitle>
          <DialogDescription className="text-purple-300">
            Roll dice for your adventures
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Rolls */}
          <div className="space-y-3">
            <Label className="text-purple-200 text-lg">Quick Rolls</Label>
            <div className="grid grid-cols-4 gap-2">
              {quickRolls.map((roll) => (
                <Button
                  key={roll.dice}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickRoll(roll.dice, roll.description)}
                  disabled={isRolling}
                  className="bg-black/30 border-purple-800/50 hover:bg-purple-600/20"
                >
                  {roll.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Roll */}
          <Card className="bg-black/20 border-purple-800/50">
            <CardHeader>
              <CardTitle className="text-lg">Custom Roll</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dice-input" className="text-purple-200">Dice</Label>
                  <Input
                    id="dice-input"
                    value={rollData.dice}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setRollData((prev: RollDiceInput) => ({ ...prev, dice: e.target.value }))
                    }
                    className="bg-black/30 border-purple-800/50"
                    placeholder="e.g., 1d20, 3d6"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-purple-200">Modifier</Label>
                  <div className="flex items-center space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => adjustModifier(-1)}
                      className="bg-black/30 border-purple-800/50 hover:bg-purple-600/20"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      value={rollData.modifier}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setRollData((prev: RollDiceInput) => ({ ...prev, modifier: parseInt(e.target.value) || 0 }))
                      }
                      className="bg-black/30 border-purple-800/50 text-center"
                      min="-10"
                      max="10"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => adjustModifier(1)}
                      className="bg-black/30 border-purple-800/50 hover:bg-purple-600/20"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="roll-type" className="text-purple-200">Roll Type</Label>
                <Select
                  value={rollData.roll_type || ''}
                  onValueChange={(value: string) =>
                    setRollData((prev: RollDiceInput) => ({ ...prev, roll_type: value }))
                  }
                >
                  <SelectTrigger className="bg-black/30 border-purple-800/50">
                    <SelectValue placeholder="Select roll type" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-purple-800/50">
                    {rollTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={() => handleRoll()}
                disabled={isRolling || !rollData.dice.match(/^\d+d\d+$/)}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {isRolling ? 'Rolling...' : `Roll ${rollData.dice}`}
              </Button>
            </CardContent>
          </Card>

          {/* Roll History */}
          {rollHistory.length > 0 && (
            <div className="space-y-3">
              <Label className="text-purple-200 text-lg">Recent Rolls</Label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {rollHistory.map((result: DiceRollResult, index: number) => (
                  <Card key={index} className="bg-black/20 border-purple-800/50">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Badge className={getResultBadgeColor(result)}>
                            {result.dice}
                          </Badge>
                          {result.roll_type && (
                            <span className="text-purple-300 text-sm">{result.roll_type}</span>
                          )}
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${getResultColor(result)}`}>
                            {result.final_total}
                          </div>
                          {result.modifier !== 0 && (
                            <div className="text-purple-400 text-sm">
                              {result.total} {result.modifier >= 0 ? '+' : ''}{result.modifier}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-purple-300 text-sm mt-2">
                        Individual rolls: [{result.rolls.join(', ')}]
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}