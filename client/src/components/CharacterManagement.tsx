import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Plus, Edit, Shield, Heart, Zap, User as UserIcon, BookOpen } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Character, CreateCharacterInput, UpdateCharacterInput } from '../../../server/src/schema';

interface CharacterManagementProps {
  characters: Character[];
  onCharacterCreated: (character: Character) => void;
  onCharacterUpdated: (character: Character) => void;
  userId: number;
}

export function CharacterManagement({
  characters,
  onCharacterCreated,
  onCharacterUpdated,
  userId
}: CharacterManagementProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form state for creating character
  const [createFormData, setCreateFormData] = useState<CreateCharacterInput>({
    user_id: userId,
    name: '',
    race: null,
    character_class: null,
    level: 1,
    experience_points: 0,
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
    hit_points: 10,
    max_hit_points: 10,
    armor_class: 10,
    inventory: null,
    equipment: null,
    backstory: null,
    notes: null
  });

  // Form state for editing character
  const [editFormData, setEditFormData] = useState<UpdateCharacterInput>({
    id: 0,
    name: '',
    race: null,
    character_class: null,
    level: 1,
    experience_points: 0,
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
    hit_points: 10,
    max_hit_points: 10,
    armor_class: 10,
    inventory: null,
    equipment: null,
    backstory: null,
    notes: null
  });

  const handleCreateCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const character = await trpc.createCharacter.mutate(createFormData);
      onCharacterCreated(character);
      setIsCreateDialogOpen(false);
      setCreateFormData({
        user_id: userId,
        name: '',
        race: null,
        character_class: null,
        level: 1,
        experience_points: 0,
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
        hit_points: 10,
        max_hit_points: 10,
        armor_class: 10,
        inventory: null,
        equipment: null,
        backstory: null,
        notes: null
      });
    } catch (error) {
      console.error('Failed to create character:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCharacter) return;

    setIsLoading(true);

    try {
      const updatedCharacter = await trpc.updateCharacter.mutate(editFormData);
      onCharacterUpdated(updatedCharacter);
      setIsEditDialogOpen(false);
      setEditingCharacter(null);
    } catch (error) {
      console.error('Failed to update character:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (character: Character) => {
    setEditingCharacter(character);
    setEditFormData({
      id: character.id,
      name: character.name,
      race: character.race,
      character_class: character.character_class,
      level: character.level,
      experience_points: character.experience_points,
      strength: character.strength,
      dexterity: character.dexterity,
      constitution: character.constitution,
      intelligence: character.intelligence,
      wisdom: character.wisdom,
      charisma: character.charisma,
      hit_points: character.hit_points,
      max_hit_points: character.max_hit_points,
      armor_class: character.armor_class,
      inventory: character.inventory,
      equipment: character.equipment,
      backstory: character.backstory,
      notes: character.notes
    });
    setIsEditDialogOpen(true);
  };

  const calculateModifier = (stat: number) => {
    return Math.floor((stat - 10) / 2);
  };

  const getModifierString = (modifier: number) => {
    return modifier >= 0 ? `+${modifier}` : `${modifier}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Character Management</h2>
          <p className="text-purple-300">Create and manage your heroic characters</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Character
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] bg-slate-900 border-purple-800/50 text-white max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Character</DialogTitle>
              <DialogDescription className="text-purple-300">
                Design your hero for epic adventures ahead
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateCharacter} className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="create-name" className="text-purple-200">Name</Label>
                  <Input
                    id="create-name"
                    value={createFormData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateFormData((prev: CreateCharacterInput) => ({ ...prev, name: e.target.value }))
                    }
                    className="bg-black/30 border-purple-800/50"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-level" className="text-purple-200">Level</Label>
                  <Input
                    id="create-level"
                    type="number"
                    min="1"
                    max="20"
                    value={createFormData.level}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateFormData((prev: CreateCharacterInput) => ({ ...prev, level: parseInt(e.target.value) || 1 }))
                    }
                    className="bg-black/30 border-purple-800/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="create-race" className="text-purple-200">Race</Label>
                  <Input
                    id="create-race"
                    value={createFormData.race || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateFormData((prev: CreateCharacterInput) => ({ ...prev, race: e.target.value || null }))
                    }
                    className="bg-black/30 border-purple-800/50"
                    placeholder="e.g., Human, Elf, Dwarf"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-class" className="text-purple-200">Class</Label>
                  <Input
                    id="create-class"
                    value={createFormData.character_class || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateFormData((prev: CreateCharacterInput) => ({ ...prev, character_class: e.target.value || null }))
                    }
                    className="bg-black/30 border-purple-800/50"
                    placeholder="e.g., Fighter, Wizard, Rogue"
                  />
                </div>
              </div>

              {/* Stats */}
              <div>
                <Label className="text-purple-200 text-lg">Ability Scores</Label>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  {[
                    { key: 'strength', label: 'STR', icon: '💪' },
                    { key: 'dexterity', label: 'DEX', icon: '🏃' },
                    { key: 'constitution', label: 'CON', icon: '❤️' },
                    { key: 'intelligence', label: 'INT', icon: '🧠' },
                    { key: 'wisdom', label: 'WIS', icon: '👁️' },
                    { key: 'charisma', label: 'CHA', icon: '✨' }
                  ].map(({ key, label, icon }) => (
                    <div key={key} className="space-y-1">
                      <Label className="text-purple-200 text-sm">
                        {icon} {label}
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        max="20"
                        value={createFormData[key as keyof CreateCharacterInput] as number}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCreateFormData((prev: CreateCharacterInput) => ({
                            ...prev,
                            [key]: parseInt(e.target.value) || 10
                          }))
                        }
                        className="bg-black/30 border-purple-800/50"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Health & Defense */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="create-hp" className="text-purple-200">Hit Points</Label>
                  <Input
                    id="create-hp"
                    type="number"
                    min="1"
                    value={createFormData.hit_points}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateFormData((prev: CreateCharacterInput) => ({ ...prev, hit_points: parseInt(e.target.value) || 10 }))
                    }
                    className="bg-black/30 border-purple-800/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-max-hp" className="text-purple-200">Max HP</Label>
                  <Input
                    id="create-max-hp"
                    type="number"
                    min="1"
                    value={createFormData.max_hit_points}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateFormData((prev: CreateCharacterInput) => ({ ...prev, max_hit_points: parseInt(e.target.value) || 10 }))
                    }
                    className="bg-black/30 border-purple-800/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-ac" className="text-purple-200">Armor Class</Label>
                  <Input
                    id="create-ac"
                    type="number"
                    min="1"
                    value={createFormData.armor_class}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateFormData((prev: CreateCharacterInput) => ({ ...prev, armor_class: parseInt(e.target.value) || 10 }))
                    }
                    className="bg-black/30 border-purple-800/50"
                  />
                </div>
              </div>

              {/* Backstory */}
              <div className="space-y-2">
                <Label htmlFor="create-backstory" className="text-purple-200">Backstory</Label>
                <Textarea
                  id="create-backstory"
                  value={createFormData.backstory || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setCreateFormData((prev: CreateCharacterInput) => ({ ...prev, backstory: e.target.value || null }))
                  }
                  className="bg-black/30 border-purple-800/50"
                  placeholder="Tell us about your character's past..."
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
                <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                  {isLoading ? 'Creating...' : 'Create Character'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Characters Grid */}
      {characters.length === 0 ? (
        <Card className="bg-black/20 backdrop-blur-sm border-purple-800/50">
          <CardContent className="pt-6 text-center">
            <UserIcon className="h-12 w-12 text-purple-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No Characters Yet</h3>
            <p className="text-purple-300 mb-4">
              Create your first character to begin your adventure
            </p>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Character
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {characters.map((character: Character) => (
            <Card key={character.id} className="bg-black/20 backdrop-blur-sm border-purple-800/50 hover:border-purple-600/70 transition-colors">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-white">{character.name}</CardTitle>
                    <CardDescription className="text-purple-300">
                      Level {character.level} {character.race} {character.character_class}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(character)}
                    className="text-purple-400 hover:text-white"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Health & AC */}
                <div className="flex justify-between">
                  <div className="flex items-center space-x-2">
                    <Heart className="h-4 w-4 text-red-400" />
                    <span className="text-white">{character.hit_points}/{character.max_hit_points}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-blue-400" />
                    <span className="text-white">AC {character.armor_class}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Zap className="h-4 w-4 text-yellow-400" />
                    <span className="text-white">{character.experience_points} XP</span>
                  </div>
                </div>

                <Separator className="bg-purple-800/30" />

                {/* Ability Scores */}
                <div className="grid grid-cols-3 gap-2 text-sm">
                  {[
                    { label: 'STR', value: character.strength },
                    { label: 'DEX', value: character.dexterity },
                    { label: 'CON', value: character.constitution },
                    { label: 'INT', value: character.intelligence },
                    { label: 'WIS', value: character.wisdom },
                    { label: 'CHA', value: character.charisma }
                  ].map(({ label, value }) => (
                    <div key={label} className="text-center">
                      <div className="text-purple-300 text-xs">{label}</div>
                      <div className="text-white font-medium">
                        {value} ({getModifierString(calculateModifier(value))})
                      </div>
                    </div>
                  ))}
                </div>

                {character.backstory && (
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <BookOpen className="h-4 w-4 text-purple-400" />
                      <span className="text-purple-200 text-sm">Backstory</span>
                    </div>
                    <p className="text-purple-300 text-sm line-clamp-2">
                      {character.backstory}
                    </p>
                  </div>
                )}

                <div className="text-xs text-purple-400">
                  Created: {character.created_at.toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Character Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-slate-900 border-purple-800/50 text-white max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Character</DialogTitle>
            <DialogDescription className="text-purple-300">
              Update your character's information and stats
            </DialogDescription>
          </DialogHeader>
          {editingCharacter && (
            <form onSubmit={handleEditCharacter} className="space-y-4">
              {/* Similar form structure as create, but with editFormData */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name" className="text-purple-200">Name</Label>
                  <Input
                    id="edit-name"
                    value={editFormData.name || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditFormData((prev: UpdateCharacterInput) => ({ ...prev, name: e.target.value }))
                    }
                    className="bg-black/30 border-purple-800/50"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-level" className="text-purple-200">Level</Label>
                  <Input
                    id="edit-level"
                    type="number"
                    min="1"
                    max="20"
                    value={editFormData.level || 1}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditFormData((prev: UpdateCharacterInput) => ({ ...prev, level: parseInt(e.target.value) || 1 }))
                    }
                    className="bg-black/30 border-purple-800/50"
                  />
                </div>
              </div>

              {/* Health & Defense */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-hp" className="text-purple-200">Hit Points</Label>
                  <Input
                    id="edit-hp"
                    type="number"
                    min="0"
                    value={editFormData.hit_points || 0}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditFormData((prev: UpdateCharacterInput) => ({ ...prev, hit_points: parseInt(e.target.value) || 0 }))
                    }
                    className="bg-black/30 border-purple-800/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-max-hp" className="text-purple-200">Max HP</Label>
                  <Input
                    id="edit-max-hp"
                    type="number"
                    min="1"
                    value={editFormData.max_hit_points || 1}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditFormData((prev: UpdateCharacterInput) => ({ ...prev, max_hit_points: parseInt(e.target.value) || 1 }))
                    }
                    className="bg-black/30 border-purple-800/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-experience" className="text-purple-200">Experience</Label>
                  <Input
                    id="edit-experience"
                    type="number"
                    min="0"
                    value={editFormData.experience_points || 0}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditFormData((prev: UpdateCharacterInput) => ({ ...prev, experience_points: parseInt(e.target.value) || 0 }))
                    }
                    className="bg-black/30 border-purple-800/50"
                  />
                </div>
              </div>

              {/* Stats */}
              <div>
                <Label className="text-purple-200 text-lg">Ability Scores</Label>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  {[
                    { key: 'strength', label: 'STR', icon: '💪' },
                    { key: 'dexterity', label: 'DEX', icon: '🏃' },
                    { key: 'constitution', label: 'CON', icon: '❤️' },
                    { key: 'intelligence', label: 'INT', icon: '🧠' },
                    { key: 'wisdom', label: 'WIS', icon: '👁️' },
                    { key: 'charisma', label: 'CHA', icon: '✨' }
                  ].map(({ key, label, icon }) => (
                    <div key={key} className="space-y-1">
                      <Label className="text-purple-200 text-sm">
                        {icon} {label}
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        max="20"
                        value={editFormData[key as keyof UpdateCharacterInput] as number || 10}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setEditFormData((prev: UpdateCharacterInput) => ({
                            ...prev,
                            [key]: parseInt(e.target.value) || 10
                          }))
                        }
                        className="bg-black/30 border-purple-800/50"
                      />
                    </div>
                  ))}
                </div>
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
                  {isLoading ? 'Updating...' : 'Update Character'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}