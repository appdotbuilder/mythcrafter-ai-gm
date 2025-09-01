import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Swords, Scroll, User as UserIcon, Plus, LogOut } from 'lucide-react';

import { AuthForm } from '@/components/AuthForm';
import { CharacterManagement } from '@/components/CharacterManagement';
import { CampaignManagement } from '@/components/CampaignManagement';
import { GameInterface } from '@/components/GameInterface';
import { DiceRoller } from '@/components/DiceRoller';

import { trpc } from '@/utils/trpc';
import type { User, Character, Campaign } from '../../server/src/schema';

function App() {
  // Authentication state
  const [user, setUser] = useState<User | null>(null);

  // Application state
  const [characters, setCharacters] = useState<Character[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Load user data after login
  const loadUserData = useCallback(async (userId: number) => {
    try {
      const [charactersData, campaignsData] = await Promise.all([
        trpc.getCharacters.query({ userId }),
        trpc.getCampaigns.query({ userId })
      ]);
      setCharacters(charactersData);
      setCampaigns(campaignsData);
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  }, []);

  // Handle successful login
  const handleLogin = async (userData: User) => {
    setUser(userData);
    await loadUserData(userData.id);
  };

  // Handle logout
  const handleLogout = () => {
    setUser(null);
    setCharacters([]);
    setCampaigns([]);
    setSelectedCharacter(null);
    setSelectedCampaign(null);
    setActiveTab('dashboard');
  };

  // Handle character operations
  const handleCharacterCreated = (character: Character) => {
    setCharacters((prev: Character[]) => [...prev, character]);
  };

  const handleCharacterUpdated = (updatedCharacter: Character) => {
    setCharacters((prev: Character[]) => 
      prev.map((char: Character) => 
        char.id === updatedCharacter.id ? updatedCharacter : char
      )
    );
    if (selectedCharacter?.id === updatedCharacter.id) {
      setSelectedCharacter(updatedCharacter);
    }
  };

  // Handle campaign operations
  const handleCampaignCreated = (campaign: Campaign) => {
    setCampaigns((prev: Campaign[]) => [...prev, campaign]);
  };

  const handleCampaignUpdated = (updatedCampaign: Campaign) => {
    setCampaigns((prev: Campaign[]) => 
      prev.map((camp: Campaign) => 
        camp.id === updatedCampaign.id ? updatedCampaign : camp
      )
    );
    if (selectedCampaign?.id === updatedCampaign.id) {
      setSelectedCampaign(updatedCampaign);
    }
  };

  // Start or resume campaign
  const handlePlayCampaign = (campaign: Campaign) => {
    const character = characters.find((char: Character) => char.id === campaign.character_id);
    if (character) {
      setSelectedCampaign(campaign);
      setSelectedCharacter(character);
      setActiveTab('game');
    }
  };

  // If not authenticated, show login form
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Swords className="h-12 w-12 text-purple-400 mr-2" />
              <h1 className="text-4xl font-bold text-white">MythCrafter</h1>
            </div>
            <p className="text-purple-200">Your AI-powered tabletop RPG companion</p>
          </div>
          <AuthForm onLogin={handleLogin} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-purple-800/50 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Swords className="h-8 w-8 text-purple-400" />
              <h1 className="text-2xl font-bold text-white">MythCrafter</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-purple-200">
                <UserIcon className="h-4 w-4" />
                <span>{user.username}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-purple-200 hover:text-white"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-black/20 backdrop-blur-sm">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-purple-600">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="characters" className="data-[state=active]:bg-purple-600">
              Characters
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="data-[state=active]:bg-purple-600">
              Campaigns
            </TabsTrigger>
            <TabsTrigger value="game" className="data-[state=active]:bg-purple-600" disabled={!selectedCampaign}>
              Game Session
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Quick Stats */}
              <Card className="bg-black/20 backdrop-blur-sm border-purple-800/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-200">Characters</CardTitle>
                  <UserIcon className="h-4 w-4 text-purple-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{characters.length}</div>
                  <p className="text-xs text-purple-300">Active heroes</p>
                </CardContent>
              </Card>

              <Card className="bg-black/20 backdrop-blur-sm border-purple-800/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-200">Campaigns</CardTitle>
                  <Scroll className="h-4 w-4 text-purple-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{campaigns.length}</div>
                  <p className="text-xs text-purple-300">Epic adventures</p>
                </CardContent>
              </Card>

              <Card className="bg-black/20 backdrop-blur-sm border-purple-800/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-200">Active</CardTitle>
                  <Swords className="h-4 w-4 text-purple-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {campaigns.filter((c: Campaign) => c.status === 'active').length}
                  </div>
                  <p className="text-xs text-purple-300">Ongoing stories</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="bg-black/20 backdrop-blur-sm border-purple-800/50">
                <CardHeader>
                  <CardTitle className="text-purple-200">Recent Characters</CardTitle>
                  <CardDescription className="text-purple-300">
                    Your newest heroes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {characters.length === 0 ? (
                    <p className="text-purple-400 text-sm">No characters yet. Create your first hero!</p>
                  ) : (
                    characters.slice(0, 3).map((character: Character) => (
                      <div key={character.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">{character.name}</p>
                          <p className="text-purple-300 text-sm">
                            Level {character.level} {character.race} {character.character_class}
                          </p>
                        </div>
                        <Badge variant="secondary" className="bg-purple-600/20 text-purple-200">
                          {character.hit_points}/{character.max_hit_points} HP
                        </Badge>
                      </div>
                    ))
                  )}
                  {characters.length > 3 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab('characters')}
                      className="w-full text-purple-300 hover:text-white"
                    >
                      View all characters
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-black/20 backdrop-blur-sm border-purple-800/50">
                <CardHeader>
                  <CardTitle className="text-purple-200">Active Campaigns</CardTitle>
                  <CardDescription className="text-purple-300">
                    Continue your adventures
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {campaigns.filter((c: Campaign) => c.status === 'active').length === 0 ? (
                    <p className="text-purple-400 text-sm">No active campaigns. Start a new adventure!</p>
                  ) : (
                    campaigns
                      .filter((c: Campaign) => c.status === 'active')
                      .slice(0, 3)
                      .map((campaign: Campaign) => (
                        <div key={campaign.id} className="flex items-center justify-between">
                          <div>
                            <p className="text-white font-medium">{campaign.title}</p>
                            <p className="text-purple-300 text-sm capitalize">
                              {campaign.genre.replace('_', ' ')} adventure
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handlePlayCampaign(campaign)}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            Play
                          </Button>
                        </div>
                      ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="bg-black/20 backdrop-blur-sm border-purple-800/50">
              <CardHeader>
                <CardTitle className="text-purple-200">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <Button
                    onClick={() => setActiveTab('characters')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Character
                  </Button>
                  <Button
                    onClick={() => setActiveTab('campaigns')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Campaign
                  </Button>
                  <DiceRoller />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Characters Tab */}
          <TabsContent value="characters">
            <CharacterManagement
              characters={characters}
              onCharacterCreated={handleCharacterCreated}
              onCharacterUpdated={handleCharacterUpdated}
              userId={user.id}
            />
          </TabsContent>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns">
            <CampaignManagement
              campaigns={campaigns}
              characters={characters}
              onCampaignCreated={handleCampaignCreated}
              onCampaignUpdated={handleCampaignUpdated}
              onPlayCampaign={handlePlayCampaign}
              userId={user.id}
            />
          </TabsContent>

          {/* Game Session Tab */}
          <TabsContent value="game">
            {selectedCampaign && selectedCharacter ? (
              <GameInterface
                campaign={selectedCampaign}
                character={selectedCharacter}
                onCampaignUpdated={handleCampaignUpdated}
                onCharacterUpdated={handleCharacterUpdated}
              />
            ) : (
              <Card className="bg-black/20 backdrop-blur-sm border-purple-800/50">
                <CardContent className="pt-6">
                  <p className="text-center text-purple-300">
                    Select a campaign to start playing!
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;