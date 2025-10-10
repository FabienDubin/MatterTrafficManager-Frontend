import { useState, useEffect } from 'react';
import { useConfigStore, useTaskStatusColors, type TaskStatusColors, DEFAULT_TASK_STATUS_COLORS } from '@/store/config.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, CheckCircle, RefreshCw, RotateCcw } from 'lucide-react';
import { generateRandomPastelColor } from '@/utils/colorUtils';
import { ColorEditor } from '@/components/admin/ColorEditor';

/**
 * TaskStatusColorsSection - Section de configuration des couleurs par statut
 */
export function TaskStatusColorsSection() {
  const { updateTaskStatusColors } = useConfigStore();
  const { taskStatusColors, isStatusColorsLoaded } = useTaskStatusColors();

  const [localColors, setLocalColors] = useState<TaskStatusColors>(DEFAULT_TASK_STATUS_COLORS);
  const [isSaving, setIsSaving] = useState(false);

  // Sync local colors with store
  useEffect(() => {
    if (isStatusColorsLoaded) {
      setLocalColors(taskStatusColors);
    }
  }, [taskStatusColors, isStatusColorsLoaded]);

  const handleColorChange = (statusKey: string, color: string) => {
    setLocalColors(prev => ({
      ...prev,
      [statusKey]: color,
    }));
  };

  const handleResetToDefaults = () => {
    setLocalColors(DEFAULT_TASK_STATUS_COLORS);
  };

  const handleRandomizeAll = () => {
    const newColors: TaskStatusColors = {
      not_started: generateRandomPastelColor(),
      in_progress: generateRandomPastelColor(),
      completed: generateRandomPastelColor(),
    };
    setLocalColors(newColors);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateTaskStatusColors(localColors);
      toast.success('Couleurs des statuts mises à jour avec succès');
    } catch (error) {
      console.error('Failed to save colors:', error);
      toast.error('Erreur lors de la sauvegarde des couleurs');
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = JSON.stringify(localColors) !== JSON.stringify(taskStatusColors);

  // Données des statuts avec leurs infos d'affichage
  const statusItems = [
    {
      key: 'not_started' as keyof TaskStatusColors,
      name: 'Pas Commencé',
      subtitle: 'Tâches non démarrées',
      description: 'Couleur pour les tâches qui n\'ont pas encore été commencées'
    },
    {
      key: 'in_progress' as keyof TaskStatusColors,
      name: 'En Cours',
      subtitle: 'Tâches en progression',
      description: 'Couleur pour les tâches actuellement en cours de réalisation'
    },
    {
      key: 'completed' as keyof TaskStatusColors,
      name: 'Terminé',
      subtitle: 'Tâches complétées',
      description: 'Couleur pour les tâches qui ont été terminées avec succès'
    }
  ];

  if (!isStatusColorsLoaded) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-2">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">Chargement des couleurs...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Couleurs des Statuts
            </CardTitle>
            <CardDescription>
              Configurez les couleurs d'affichage des tâches par statut de progression
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetToDefaults}
              title="Remettre les couleurs par défaut"
            >
              <RotateCcw className="h-4 w-4" />
              Défaut
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRandomizeAll}
              title="Générer des couleurs aléatoires"
            >
              <RefreshCw className="h-4 w-4" />
              Aléatoire
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            💡 <strong>Astuce :</strong> Les couleurs des statuts s'appliquent automatiquement à toutes les tâches 
            selon leur état de progression. Utilisez des couleurs distinctes pour une meilleure lisibilité.
          </p>
        </div>

        {/* Status Colors */}
        <div className="space-y-3">
          {statusItems.map(item => (
            <div key={item.key} className="space-y-2">
              <ColorEditor
                id={item.key}
                name={item.name}
                subtitle={item.subtitle}
                color={localColors[item.key]}
                onColorChange={handleColorChange}
              />
              <p className="text-xs text-muted-foreground ml-13 -mt-2">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        {/* Preview Section */}
        <div className="border rounded-lg p-4 bg-muted/30">
          <h4 className="text-sm font-medium mb-3">Aperçu des couleurs</h4>
          <div className="flex gap-2">
            {statusItems.map(item => (
              <div
                key={item.key}
                className="flex-1 p-3 rounded-md border text-center text-sm"
                style={{ 
                  backgroundColor: localColors[item.key],
                  color: getContrastTextColor(localColors[item.key])
                }}
              >
                {item.name}
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        {hasChanges && (
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Sauvegarde...
                </>
              ) : (
                'Sauvegarder les couleurs'
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper function to get contrasting text color
function getContrastTextColor(backgroundColor: string): string {
  // Simple contrast calculation
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? '#000000' : '#ffffff';
}