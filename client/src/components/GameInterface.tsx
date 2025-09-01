import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
//import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Send, 
  Heart, 
  Shield, 
  User as UserIcon, 
  Scroll, 
  Save,
  RefreshCw
} from 'lucide-react';

import { DiceRoller } from '@/components/DiceRoller';
import { trpc } from '@/utils/trpc';
import type { Campaign, Character, GameSession } from '../../../server/src/schema';

interface GameInterfaceProps {
  campaign: Campaign;
  character: Character;
  onCampaignUpdated: (campaign: Campaign) => void;
  onCharacterUpdated: (character: Character) => void;
}

interface GameMessage {
  id: string;
  type: 'player' | 'gm' | 'system';
  content: string;
  timestamp: Date;
}

export function GameInterface({
  campaign,
  character,
  onCampaignUpdated,
  onCharacterUpdated
}: GameInterfaceProps) {
  const [messages, setMessages] = useState<GameMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [gameSessions, setGameSessions] = useState<GameSession[]>([]);
  
  // Character state for quick updates
  const [currentHP, setCurrentHP] = useState(character.hit_points);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load game sessions
  const loadGameSessions = useCallback(async () => {
    try {
      const sessions = await trpc.getGameSessions.query({ campaignId: campaign.id });
      setGameSessions(sessions);
    } catch (error) {
      console.error('Failed to load game sessions:', error);
    }
  }, [campaign.id]);

  useEffect(() => {
    loadGameSessions();
  }, [loadGameSessions]);

  // Initialize with campaign scene or welcome message
  useEffect(() => {
    const welcomeMessages: GameMessage[] = [
      {
        id: 'welcome',
        type: 'system',
        content: `Welcome to "${campaign.title}"! Your adventure begins...`,
        timestamp: new Date()
      }
    ];

    if (campaign.current_scene) {
      welcomeMessages.push({
        id: 'current-scene',
        type: 'gm',
        content: campaign.current_scene,
        timestamp: new Date()
      });
    } else {
      // Generate an opening scene based on genre (stub implementation)
      const openingScenes = {
        fantasy: "You find yourself at the entrance of an ancient tavern, 'The Prancing Pony.' The wooden sign creaks in the wind as adventurers of all kinds move in and out. What do you do?",
        cyberpunk: "Neon lights reflect off wet pavement as you stand in the shadow of towering corporate megastructures. Your cybernetic implant hums with incoming data. The night is full of possibilities.",
        sci_fi: "The airlock hisses as you step aboard the starship. The captain's voice echoes through the corridors: 'Welcome aboard, recruit. We have a situation that requires your expertise.'",
        horror: "The old mansion looms before you, its windows like hollow eyes staring into your soul. The door creaks open at your touch, though you don't remember knocking...",
        western: "The dusty frontier town stretches before you. Tumbleweeds roll past the saloon doors, and somewhere in the distance, a horse whinnies. The sheriff's badge weighs heavy in your pocket.",
        modern: "The city never sleeps, and neither do its problems. Your phone buzzes with a new message from an unknown contact. The job sounds dangerous, but the pay is too good to ignore.",
        steampunk: "Steam hisses from the great machines that power the city. Your brass goggles fog slightly as you adjust your leather coat. The Inventor's Guild has a job for someone with your skills.",
        post_apocalyptic: "The wasteland stretches endlessly in all directions. Your Geiger counter clicks steadily as you approach the ruins of what was once a great city. Survival is all that matters now."
      };

      welcomeMessages.push({
        id: 'opening-scene',
        type: 'gm',
        content: openingScenes[campaign.genre] || "Your adventure begins in a mysterious land full of wonder and danger...",
        timestamp: new Date()
      });
    }

    setMessages(welcomeMessages);
  }, [campaign]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isSending) return;

    const playerMessage: GameMessage = {
      id: Date.now().toString(),
      type: 'player',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages((prev: GameMessage[]) => [...prev, playerMessage]);
    setInputMessage('');
    setIsSending(true);

    try {
      // Simulate AI GM response (stub implementation)
      // In a real implementation, this would call an AI service
      setTimeout(() => {
        const gmResponses = [
          "The GM considers your action carefully...",
          "As you proceed, you notice something interesting...",
          "Roll a d20 for your action!",
          "The environment shifts around you...",
          "You hear a mysterious sound in the distance...",
          "Your character feels a surge of determination...",
          "The path ahead becomes clearer...",
          "Something glints in the shadows..."
        ];

        const gmMessage: GameMessage = {
          id: Date.now().toString() + '_gm',
          type: 'gm',
          content: gmResponses[Math.floor(Math.random() * gmResponses.length)],
          timestamp: new Date()
        };

        setMessages((prev: GameMessage[]) => [...prev, gmMessage]);
        setIsSending(false);
      }, 1000 + Math.random() * 2000); // Random delay between 1-3 seconds

    } catch (error) {
      console.error('Failed to get GM response:', error);
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const updateCharacterHP = async (newHP: number) => {
    const clampedHP = Math.max(0, Math.min(newHP, character.max_hit_points));
    setCurrentHP(clampedHP);

    try {
      const updatedCharacter = await trpc.updateCharacter.mutate({
        id: character.id,
        hit_points: clampedHP
      });
      onCharacterUpdated(updatedCharacter);
    } catch (error) {
      console.error('Failed to update character HP:', error);
    }
  };

  const saveCampaign = async () => {
    setIsLoading(true);
    try {
      // Create a narrative summary of recent messages for the game session
      const recentMessages = messages.slice(-10);
      const narrative = recentMessages
        .map((msg: GameMessage) => `[${msg.type.toUpperCase()}] ${msg.content}`)
        .join('\n');

      // Save game session
      const sessionNumber = gameSessions.length + 1;
      await trpc.createGameSession.mutate({
        campaign_id: campaign.id,
        session_number: sessionNumber,
        narrative: narrative || 'Game session in progress...'
      });

      // Update campaign with current scene
      const lastGMMessage = messages.filter((msg: GameMessage) => msg.type === 'gm').slice(-1)[0];
      if (lastGMMessage) {
        const updatedCampaign = await trpc.updateCampaign.mutate({
          id: campaign.id,
          current_scene: lastGMMessage.content
        });
        onCampaignUpdated(updatedCampaign);
      }

      // Add system message
      const saveMessage: GameMessage = {
        id: Date.now().toString(),
        type: 'system',
        content: 'Game saved successfully!',
        timestamp: new Date()
      };
      setMessages((prev: GameMessage[]) => [...prev, saveMessage]);

      // Reload sessions
      await loadGameSessions();
    } catch (error) {
      console.error('Failed to save game:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateModifier = (stat: number) => {
    return Math.floor((stat - 10) / 2);
  };

  const getModifierString = (modifier: number) => {
    return modifier >= 0 ? `+${modifier}` : `${modifier}`;
  };

  const hpPercentage = (currentHP / character.max_hit_points) * 100;
  const hpColor = hpPercentage > 50 ? 'bg-green-600' : hpPercentage > 25 ? 'bg-yellow-600' : 'bg-red-600';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Main Game Area */}
      <div className="lg:col-span-3 space-y-4">
        {/* Campaign Header */}
        <Card className="bg-black/20 backdrop-blur-sm border-purple-800/50">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-white">{campaign.title}</CardTitle>
                <p className="text-purple-300 capitalize">
                  {campaign.genre.replace('_', ' ')} Campaign
                </p>
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={saveCampaign}
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                  className="bg-black/30 border-purple-800/50 hover:bg-purple-600/20"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'Saving...' : 'Save'}
                </Button>
                <DiceRoller />
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Game Messages */}
        <Card className="bg-black/20 backdrop-blur-sm border-purple-800/50">
          <CardHeader>
            <CardTitle className="text-white">Game Session</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96 w-full rounded-md border border-purple-800/30 p-4">
              <div className="space-y-4">
                {messages.map((message: GameMessage) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'player' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.type === 'player'
                          ? 'bg-purple-600 text-white'
                          : message.type === 'gm'
                          ? 'bg-slate-700 text-purple-100'
                          : 'bg-slate-800 text-purple-300 text-center'
                      }`}
                    >
                      {message.type !== 'player' && message.type !== 'system' && (
                        <div className="text-xs text-purple-400 mb-1 font-medium">Game Master</div>
                      )}
                      <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                      <div className="text-xs text-purple-300 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
                {isSending && (
                  <div className="flex justify-start">
                    <div className="bg-slate-700 text-purple-100 rounded-lg p-3 max-w-[80%]">
                      <div className="text-xs text-purple-400 mb-1 font-medium">Game Master</div>
                      <div className="flex items-center space-x-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="flex space-x-2 mt-4">
              <Input
                value={inputMessage}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="What do you do?"
                className="bg-black/30 border-purple-800/50 text-white"
                disabled={isSending}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isSending}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Character Panel */}
      <div className="space-y-4">
        {/* Character Info */}
        <Card className="bg-black/20 backdrop-blur-sm border-purple-800/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <UserIcon className="h-5 w-5" />
              <span>{character.name}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-purple-300 text-sm">
                Level {character.level} {character.race} {character.character_class}
              </div>
              <div className="text-purple-400 text-xs mt-1">
                {character.experience_points} XP
              </div>
            </div>

            <Separator className="bg-purple-800/30" />

            {/* Health */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Heart className="h-4 w-4 text-red-400" />
                  <span className="text-purple-200 text-sm">Health</span>
                </div>
                <div className="text-white text-sm">
                  {currentHP}/{character.max_hit_points}
                </div>
              </div>
              <Progress value={hpPercentage} className="h-2">
                <div className={`h-full rounded-full transition-all ${hpColor}`} style={{ width: `${hpPercentage}%` }} />
              </Progress>
              <div className="flex space-x-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateCharacterHP(currentHP - 1)}
                  disabled={currentHP <= 0}
                  className="flex-1 bg-red-600/20 border-red-600/50 hover:bg-red-600/30"
                >
                  -1
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateCharacterHP(currentHP + 1)}
                  disabled={currentHP >= character.max_hit_points}
                  className="flex-1 bg-green-600/20 border-green-600/50 hover:bg-green-600/30"
                >
                  +1
                </Button>
              </div>
            </div>

            {/* Armor Class */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-blue-400" />
                <span className="text-purple-200 text-sm">Armor Class</span>
              </div>
              <Badge className="bg-blue-600">{character.armor_class}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Ability Scores */}
        <Card className="bg-black/20 backdrop-blur-sm border-purple-800/50">
          <CardHeader>
            <CardTitle className="text-white text-lg">Ability Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'strength', label: 'STR', icon: '💪' },
                { key: 'dexterity', label: 'DEX', icon: '🏃' },
                { key: 'constitution', label: 'CON', icon: '❤️' },
                { key: 'intelligence', label: 'INT', icon: '🧠' },
                { key: 'wisdom', label: 'WIS', icon: '👁️' },
                { key: 'charisma', label: 'CHA', icon: '✨' }
              ].map(({ key, label, icon }) => {
                const baseValue = character[key as keyof Character] as number;
                const modifier = calculateModifier(baseValue);
                return (
                  <div key={key} className="text-center p-2 bg-black/20 rounded border border-purple-800/30">
                    <div className="text-xs text-purple-400">{icon} {label}</div>
                    <div className="text-white font-medium">{baseValue}</div>
                    <div className="text-purple-300 text-xs">
                      {getModifierString(modifier)}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Game Sessions History */}
        <Card className="bg-black/20 backdrop-blur-sm border-purple-800/50">
          <CardHeader>
            <CardTitle className="text-white text-lg flex items-center space-x-2">
              <Scroll className="h-4 w-4" />
              <span>Sessions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {gameSessions.length === 0 ? (
              <p className="text-purple-400 text-sm text-center">No saved sessions yet</p>
            ) : (
              <ScrollArea className="h-32">
                <div className="space-y-2">
                  {gameSessions.map((session: GameSession) => (
                    <div key={session.id} className="text-xs p-2 bg-black/20 rounded border border-purple-800/30">
                      <div className="text-purple-300 mb-1">
                        Session #{session.session_number}
                      </div>
                      <div className="text-purple-400">
                        {session.created_at.toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}