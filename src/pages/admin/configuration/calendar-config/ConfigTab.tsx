import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, Loader2, Save } from 'lucide-react';
import { useConfigStore, TeamConfig } from '@/store/config.store';
import { useCalendarConfigStore } from '@/store/calendar-config.store';
import { TeamCard } from './components/TeamCard';
import { TeamConfigModal } from './components/TeamConfigModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function ConfigTab() {
  const {
    displayedTeams,
    isTeamsLoaded,
    loadDisplayedTeams,
    updateDisplayedTeams
  } = useConfigStore();

  const {
    config: calendarConfig,
    fetchConfig: fetchCalendarConfig,
    saveConfig: saveCalendarConfig
  } = useCalendarConfigStore();

  const [localTeams, setLocalTeams] = useState<TeamConfig[]>([]);
  const [showWeekends, setShowWeekends] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TeamConfig | null>(null);
  const [deletingTeamId, setDeletingTeamId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load data on mount
  useEffect(() => {
    if (!isTeamsLoaded) {
      loadDisplayedTeams();
    }
    if (!calendarConfig) {
      fetchCalendarConfig();
    }
  }, [isTeamsLoaded, calendarConfig, loadDisplayedTeams, fetchCalendarConfig]);

  // Sync local state with store
  useEffect(() => {
    setLocalTeams(displayedTeams);
  }, [displayedTeams]);

  useEffect(() => {
    if (calendarConfig) {
      setShowWeekends(calendarConfig.showWeekends ?? true);
    }
  }, [calendarConfig]);

  const handleAddTeam = () => {
    if (localTeams.length >= 4) {
      toast.error('Maximum 4 équipes autorisées');
      return;
    }
    setEditingTeam(null);
    setIsModalOpen(true);
  };

  const handleEditTeam = (team: TeamConfig) => {
    setEditingTeam(team);
    setIsModalOpen(true);
  };

  const handleDeleteTeam = (teamId: string) => {
    setDeletingTeamId(teamId);
  };

  const confirmDeleteTeam = () => {
    if (!deletingTeamId) return;

    const newTeams = localTeams
      .filter(t => t.id !== deletingTeamId)
      .map((team, index) => ({ ...team, order: index })); // Re-index

    setLocalTeams(newTeams);
    setDeletingTeamId(null);
    toast.success('Équipe supprimée');
  };

  const handleSaveTeam = (teamData: Omit<TeamConfig, 'name'>) => {
    if (editingTeam) {
      // Update existing team
      const newTeams = localTeams.map(t =>
        t.id === teamData.id
          ? { ...t, icon: teamData.icon, color: teamData.color }
          : t
      );
      setLocalTeams(newTeams);
      toast.success('Équipe mise à jour');
    } else {
      // Add new team
      const newTeam: TeamConfig = {
        ...teamData,
        name: '', // Will be enriched by backend
        order: localTeams.length
      };
      setLocalTeams([...localTeams, newTeam]);
      toast.success('Équipe ajoutée');
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;

    const newTeams = [...localTeams];
    [newTeams[index - 1], newTeams[index]] = [newTeams[index], newTeams[index - 1]];

    // Update order
    newTeams.forEach((team, i) => {
      team.order = i;
    });

    setLocalTeams(newTeams);
  };

  const handleMoveDown = (index: number) => {
    if (index === localTeams.length - 1) return;

    const newTeams = [...localTeams];
    [newTeams[index], newTeams[index + 1]] = [newTeams[index + 1], newTeams[index]];

    // Update order
    newTeams.forEach((team, i) => {
      team.order = i;
    });

    setLocalTeams(newTeams);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save teams config
      const teamsToSave = localTeams.map(({ id, icon, color, order }) => ({
        id,
        icon,
        color,
        order
      }));
      await updateDisplayedTeams(teamsToSave);

      // Save weekends config
      if (calendarConfig) {
        const updatedConfig = { ...calendarConfig, showWeekends };
        useCalendarConfigStore.setState({ config: updatedConfig });
        await saveCalendarConfig();
      }

      toast.success('Configuration sauvegardée');
    } catch (error) {
      console.error('Failed to save config:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setLocalTeams(displayedTeams);
    setShowWeekends(calendarConfig?.showWeekends ?? true);
    toast.info('Modifications annulées');
  };

  const hasChanges =
    JSON.stringify(localTeams.map(t => ({ id: t.id, icon: t.icon, color: t.color, order: t.order }))) !==
    JSON.stringify(displayedTeams.map(t => ({ id: t.id, icon: t.icon, color: t.color, order: t.order }))) ||
    showWeekends !== (calendarConfig?.showWeekends ?? true);

  if (!isTeamsLoaded || !calendarConfig) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Weekends toggle */}
      <Card>
        <CardHeader>
          <CardTitle>Options générales</CardTitle>
          <CardDescription>
            Paramètres globaux d'affichage du calendrier
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-3">
            <Switch
              id="show-weekends"
              checked={showWeekends}
              onCheckedChange={setShowWeekends}
            />
            <Label htmlFor="show-weekends" className="cursor-pointer">
              Afficher les weekends
            </Label>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Affiche ou masque les samedis et dimanches dans les vues semaine et mois
          </p>
        </CardContent>
      </Card>

      {/* Teams configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Équipes affichées</CardTitle>
              <CardDescription>
                Configurez les équipes qui apparaîtront dans les filtres du panneau latéral (max 4)
              </CardDescription>
            </div>
            <Button
              onClick={handleAddTeam}
              disabled={localTeams.length >= 4}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une équipe
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {localTeams.map((team, index) => (
              <div key={team.id} className="flex gap-2">
                <div className="flex-1">
                  <TeamCard
                    team={team}
                    onEdit={handleEditTeam}
                    onDelete={handleDeleteTeam}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                  >
                    ↑
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === localTeams.length - 1}
                  >
                    ↓
                  </Button>
                </div>
              </div>
            ))}

            {localTeams.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Aucune équipe configurée. Cliquez sur "Ajouter une équipe" pour commencer.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={!hasChanges || isSaving}
        >
          Annuler
        </Button>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sauvegarde...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Sauvegarder
            </>
          )}
        </Button>
      </div>

      {/* Modals */}
      <TeamConfigModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSave={handleSaveTeam}
        editingTeam={editingTeam}
        existingTeamIds={localTeams.map(t => t.id)}
      />

      <AlertDialog open={!!deletingTeamId} onOpenChange={() => setDeletingTeamId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'équipe ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera l'équipe des filtres. Les tâches de cette équipe resteront visibles dans le calendrier.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteTeam}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
