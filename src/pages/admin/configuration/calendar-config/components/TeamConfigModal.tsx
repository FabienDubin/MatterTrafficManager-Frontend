import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { TeamConfig } from '@/store/config.store';
import { generateRandomPastelColor, isValidHexColor } from '@/utils/colorUtils';
import * as LucideIcons from 'lucide-react';
import { teamsService, type Team } from '@/services/api/teams.service';

// 10 icônes Lucide disponibles
const AVAILABLE_ICONS = [
  { value: 'Palette', label: 'Palette' },
  { value: 'Clapperboard', label: 'Clapperboard' },
  { value: 'SquarePen', label: 'Square Pen' },
  { value: 'Paintbrush', label: 'Paintbrush' },
  { value: 'Ruler', label: 'Ruler' },
  { value: 'Briefcase', label: 'Briefcase' },
  { value: 'Target', label: 'Target' },
  { value: 'Wrench', label: 'Wrench' },
  { value: 'BarChart', label: 'Bar Chart' },
  { value: 'Tent', label: 'Tent' },
];

interface TeamConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (team: Omit<TeamConfig, 'name'>) => void;
  editingTeam?: TeamConfig | null;
  existingTeamIds: string[];
}

export function TeamConfigModal({
  open,
  onOpenChange,
  onSave,
  editingTeam,
  existingTeamIds
}: TeamConfigModalProps) {
  const [notionTeams, setNotionTeams] = useState<Team[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Palette');
  const [selectedColor, setSelectedColor] = useState(generateRandomPastelColor());

  // Load Notion teams
  useEffect(() => {
    if (open && !editingTeam) {
      loadNotionTeams();
      // Generate random color on open
      setSelectedColor(generateRandomPastelColor());
    }
  }, [open, editingTeam]);

  // Pre-fill form when editing
  useEffect(() => {
    if (editingTeam) {
      setSelectedTeamId(editingTeam.id);
      setSelectedIcon(editingTeam.icon);
      setSelectedColor(editingTeam.color);
    } else {
      setSelectedTeamId('');
      setSelectedIcon('Palette');
      setSelectedColor(generateRandomPastelColor());
    }
  }, [editingTeam]);

  const loadNotionTeams = async () => {
    setIsLoadingTeams(true);
    try {
      // Fetch all teams from Notion
      const response = await teamsService.getAllTeams();
      setNotionTeams(response.data);
    } catch (error) {
      console.error('Failed to load teams:', error);
      toast.error('Erreur lors du chargement des équipes Notion');
    } finally {
      setIsLoadingTeams(false);
    }
  };

  const handleSave = () => {
    // Validation
    if (!selectedTeamId) {
      toast.error('Veuillez sélectionner une équipe');
      return;
    }

    if (!isValidHexColor(selectedColor)) {
      toast.error('Couleur invalide. Utilisez le format hexadécimal (#RRGGBB)');
      return;
    }

    // Check if team already exists (only when adding, not editing)
    if (!editingTeam && existingTeamIds.includes(selectedTeamId)) {
      toast.error('Cette équipe est déjà configurée');
      return;
    }

    onSave({
      id: selectedTeamId,
      icon: selectedIcon,
      color: selectedColor,
      order: editingTeam?.order ?? 0 // Will be set properly by parent
    });

    onOpenChange(false);
  };

  // Filter out already configured teams (except when editing the current team)
  const availableTeams = notionTeams.filter(
    team => !existingTeamIds.includes(team.id) || team.id === editingTeam?.id
  );

  // Get icon component for preview
  const IconComponent = (LucideIcons as any)[selectedIcon] || LucideIcons.Palette;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editingTeam ? 'Modifier l\'équipe' : 'Ajouter une équipe'}
          </DialogTitle>
          <DialogDescription>
            {editingTeam
              ? 'Modifiez l\'icône et la couleur de l\'équipe.'
              : 'Sélectionnez une équipe Notion et configurez son apparence.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Team selection */}
          <div className="space-y-2">
            <Label htmlFor="team">Équipe Notion</Label>
            {isLoadingTeams ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <Select
                value={selectedTeamId}
                onValueChange={setSelectedTeamId}
                disabled={!!editingTeam} // Disable when editing
              >
                <SelectTrigger id="team">
                  <SelectValue placeholder="Sélectionner une équipe" />
                </SelectTrigger>
                <SelectContent>
                  {availableTeams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {availableTeams.length === 0 && !isLoadingTeams && (
              <p className="text-xs text-muted-foreground">
                Aucune équipe disponible
              </p>
            )}
          </div>

          {/* Icon selection */}
          <div className="space-y-2">
            <Label htmlFor="icon">Icône</Label>
            <Select value={selectedIcon} onValueChange={setSelectedIcon}>
              <SelectTrigger id="icon">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_ICONS.map((icon) => {
                  const Icon = (LucideIcons as any)[icon.value];
                  return (
                    <SelectItem key={icon.value} value={icon.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{icon.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Color picker */}
          <div className="space-y-2">
            <Label htmlFor="color">Couleur (Hex)</Label>
            <div className="flex gap-2">
              <Input
                id="color"
                type="text"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                placeholder="#RRGGBB"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedColor(generateRandomPastelColor())}
              >
                Aléatoire
              </Button>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Aperçu</Label>
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <div
                className="w-12 h-12 rounded-md flex items-center justify-center"
                style={{ backgroundColor: selectedColor }}
              >
                <IconComponent className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {notionTeams.find(t => t.id === selectedTeamId)?.name || 'Équipe'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedIcon} • {selectedColor}
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave}>
            {editingTeam ? 'Mettre à jour' : 'Ajouter'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
