import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Play, Edit, Pause, CheckCircle, Scroll, Sparkles, Zap, Skull, Cog, TreePine, Flame, Atom } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Campaign, Character, CreateCampaignInput, UpdateCampaignInput, CampaignGenre, CampaignStatus } from '../../../server/src/schema';

interface CampaignManagementProps {
  campaigns: Campaign[];
  characters: Character[];
  onCampaignCreated: (campaign: Campaign) => void;
  onCampaignUpdated: (campaign: Campaign) => void;
  onPlayCampaign: (campaign: Campaign) => void;
  userId: number;
}

const genreIcons: Record<CampaignGenre, React.ReactNode> = {
  fantasy: <Sparkles className="h-4 w-4" />,
  cyberpunk: <Zap className="h-4 w-4" />,
  sci_fi: <Atom className="h-4 w-4" />,
  horror: <Skull className="h-4 w-4" />,
  western: <TreePine className="h-4 w-4" />,
  modern: <Cog className="h-4 w-4" />,
  steampunk: <Cog className="h-4 w-4" />,
  post_apocalyptic: <Flame className="h-4 w-4" />
};

const genreColors: Record<CampaignGenre, string> = {
  fantasy: 'bg-purple-600',
  cyberpunk: 'bg-cyan-600',
  sci_fi: 'bg-blue-600',
  horror: 'bg-red-600',
  western: 'bg-amber-600',
  modern: 'bg-gray-600',
  steampunk: 'bg-orange-600',
  post_apocalyptic: 'bg-red-800'
};

const statusColors: Record<CampaignStatus, string> = {
  active: 'bg-green-600',
  paused: 'bg-yellow-600',
  completed: 'bg-blue-600'
};

export function CampaignManagement({
  campaigns,
  characters,
  onCampaignCreated,
  onCampaignUpdated,
  onPlayCampaign,
  userId
}: CampaignManagementProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form state for creating campaign
  const [createFormData, setCreateFormData] = useState<CreateCampaignInput>({
    user_id: userId,
    character_id: 0,
    title: '',
    genre: 'fantasy',
    description: null,
    current_scene: null,
    campaign_data: null
  });

  // Form state for editing campaign
  const [editFormData, setEditFormData] = useState<UpdateCampaignInput>({
    id: 0,
    title: '',
    status: 'active',
    description: null,
    current_scene: null,
    campaign_data: null
  });

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (createFormData.character_id === 0) return;

    setIsLoading(true);

    try {
      const campaign = await trpc.createCampaign.mutate(createFormData);
      onCampaignCreated(campaign);
      setIsCreateDialogOpen(false);
      setCreateFormData({
        user_id: userId,
        character_id: 0,
        title: '',
        genre: 'fantasy',
        description: null,
        current_scene: null,
        campaign_data: null
      });
    } catch (error) {
      console.error('Failed to create campaign:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCampaign) return;

    setIsLoading(true);

    try {
      const updatedCampaign = await trpc.updateCampaign.mutate(editFormData);
      onCampaignUpdated(updatedCampaign);
      setIsEditDialogOpen(false);
      setEditingCampaign(null);
    } catch (error) {
      console.error('Failed to update campaign:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setEditFormData({
      id: campaign.id,
      title: campaign.title,
      status: campaign.status,
      description: campaign.description,
      current_scene: campaign.current_scene,
      campaign_data: campaign.campaign_data
    });
    setIsEditDialogOpen(true);
  };

  const getCharacterName = (characterId: number) => {
    const character = characters.find((char: Character) => char.id === characterId);
    return character?.name || 'Unknown Character';
  };

  const formatGenreName = (genre: CampaignGenre) => {
    return genre.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Campaign Management</h2>
          <p className="text-purple-300">Create and manage your epic adventures</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700" disabled={characters.length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-slate-900 border-purple-800/50 text-white">
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
              <DialogDescription className="text-purple-300">
                Start a new adventure with your character
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="create-title" className="text-purple-200">Campaign Title</Label>
                <Input
                  id="create-title"
                  value={createFormData.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateFormData((prev: CreateCampaignInput) => ({ ...prev, title: e.target.value }))
                  }
                  className="bg-black/30 border-purple-800/50"
                  placeholder="The Epic Quest of..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-character" className="text-purple-200">Character</Label>
                <Select
                  value={createFormData.character_id > 0 ? createFormData.character_id.toString() : ''}
                  onValueChange={(value: string) =>
                    setCreateFormData((prev: CreateCampaignInput) => ({ ...prev, character_id: parseInt(value) }))
                  }
                >
                  <SelectTrigger className="bg-black/30 border-purple-800/50">
                    <SelectValue placeholder="Select a character" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-purple-800/50">
                    {characters.map((character: Character) => (
                      <SelectItem key={character.id} value={character.id.toString()}>
                        {character.name} (Level {character.level} {character.race} {character.character_class})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-genre" className="text-purple-200">Genre</Label>
                <Select
                  value={createFormData.genre}
                  onValueChange={(value: CampaignGenre) =>
                    setCreateFormData((prev: CreateCampaignInput) => ({ ...prev, genre: value }))
                  }
                >
                  <SelectTrigger className="bg-black/30 border-purple-800/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-purple-800/50">
                    {Object.entries(genreIcons).map(([genre, icon]) => (
                      <SelectItem key={genre} value={genre}>
                        <div className="flex items-center space-x-2">
                          {icon}
                          <span>{formatGenreName(genre as CampaignGenre)}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-description" className="text-purple-200">Description</Label>
                <Textarea
                  id="create-description"
                  value={createFormData.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setCreateFormData((prev: CreateCampaignInput) => ({ ...prev, description: e.target.value || null }))
                  }
                  className="bg-black/30 border-purple-800/50"
                  placeholder="Describe your adventure..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="bg-green-600 hover:bg-green-700">
                  {isLoading ? 'Creating...' : 'Create Campaign'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* No Characters Warning */}
      {characters.length === 0 && (
        <Card className="bg-black/20 backdrop-blur-sm border-purple-800/50">
          <CardContent className="pt-6 text-center">
            <Scroll className="h-12 w-12 text-purple-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Create a Character First</h3>
            <p className="text-purple-300">
              You need at least one character to start a campaign
            </p>
          </CardContent>
        </Card>
      )}

      {/* Campaigns Grid */}
      {campaigns.length === 0 && characters.length > 0 ? (
        <Card className="bg-black/20 backdrop-blur-sm border-purple-800/50">
          <CardContent className="pt-6 text-center">
            <Scroll className="h-12 w-12 text-purple-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No Campaigns Yet</h3>
            <p className="text-purple-300 mb-4">
              Create your first campaign to begin your adventure
            </p>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Campaign
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign: Campaign) => (
            <Card key={campaign.id} className="bg-black/20 backdrop-blur-sm border-purple-800/50 hover:border-purple-600/70 transition-colors">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <CardTitle className="text-white">{campaign.title}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge className={`${genreColors[campaign.genre]} text-white`}>
                        <div className="flex items-center space-x-1">
                          {genreIcons[campaign.genre]}
                          <span>{formatGenreName(campaign.genre)}</span>
                        </div>
                      </Badge>
                      <Badge className={`${statusColors[campaign.status]} text-white capitalize`}>
                        {campaign.status}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(campaign)}
                    className="text-purple-400 hover:text-white"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-purple-300 text-sm mb-1">Hero:</p>
                  <p className="text-white">{getCharacterName(campaign.character_id)}</p>
                </div>

                {campaign.description && (
                  <div>
                    <p className="text-purple-300 text-sm mb-1">Story:</p>
                    <p className="text-purple-200 text-sm line-clamp-3">
                      {campaign.description}
                    </p>
                  </div>
                )}

                {campaign.current_scene && (
                  <div>
                    <p className="text-purple-300 text-sm mb-1">Current Scene:</p>
                    <p className="text-purple-200 text-sm line-clamp-2">
                      {campaign.current_scene}
                    </p>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2">
                  <div className="text-xs text-purple-400">
                    Created: {campaign.created_at.toLocaleDateString()}
                  </div>
                  {campaign.status === 'active' && (
                    <Button
                      onClick={() => onPlayCampaign(campaign)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Play
                    </Button>
                  )}
                  {campaign.status === 'paused' && (
                    <Button
                      onClick={() => onPlayCampaign(campaign)}
                      size="sm"
                      className="bg-yellow-600 hover:bg-yellow-700"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Resume
                    </Button>
                  )}
                  {campaign.status === 'completed' && (
                    <Badge className="bg-blue-600 text-white">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Complete
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Campaign Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-slate-900 border-purple-800/50 text-white">
          <DialogHeader>
            <DialogTitle>Edit Campaign</DialogTitle>
            <DialogDescription className="text-purple-300">
              Update your campaign details and status
            </DialogDescription>
          </DialogHeader>
          {editingCampaign && (
            <form onSubmit={handleEditCampaign} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title" className="text-purple-200">Campaign Title</Label>
                <Input
                  id="edit-title"
                  value={editFormData.title || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData((prev: UpdateCampaignInput) => ({ ...prev, title: e.target.value }))
                  }
                  className="bg-black/30 border-purple-800/50"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-status" className="text-purple-200">Status</Label>
                <Select
                  value={editFormData.status || 'active'}
                  onValueChange={(value: CampaignStatus) =>
                    setEditFormData((prev: UpdateCampaignInput) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger className="bg-black/30 border-purple-800/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-purple-800/50">
                    <SelectItem value="active">
                      <div className="flex items-center space-x-2">
                        <Play className="h-4 w-4" />
                        <span>Active</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="paused">
                      <div className="flex items-center space-x-2">
                        <Pause className="h-4 w-4" />
                        <span>Paused</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="completed">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4" />
                        <span>Completed</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description" className="text-purple-200">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editFormData.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setEditFormData((prev: UpdateCampaignInput) => ({ ...prev, description: e.target.value || null }))
                  }
                  className="bg-black/30 border-purple-800/50"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-scene" className="text-purple-200">Current Scene</Label>
                <Textarea
                  id="edit-scene"
                  value={editFormData.current_scene || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setEditFormData((prev: UpdateCampaignInput) => ({ ...prev, current_scene: e.target.value || null }))
                  }
                  className="bg-black/30 border-purple-800/50"
                  placeholder="Describe the current scene..."
                  rows={2}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="bg-purple-600 hover:bg-purple-700">
                  {isLoading ? 'Updating...' : 'Update Campaign'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}