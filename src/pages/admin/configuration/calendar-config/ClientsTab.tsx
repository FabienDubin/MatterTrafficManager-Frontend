import { useState, useEffect } from 'react';
import { useConfigStore } from '@/store/config.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Palette, RefreshCw, Shuffle } from 'lucide-react';
import { generateRandomPastelColor, isValidHexColor, getContrastColor } from '@/utils/colorUtils';
import type { Client } from '@/types/client.types';

export function ClientsTab() {
  const { 
    clients, 
    clientColors, 
    loadClients, 
    loadClientColors, 
    updateClientColors 
  } = useConfigStore();
  
  const [localColors, setLocalColors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          loadClients(),
          loadClientColors()
        ]);
      } catch (error) {
        console.error('Failed to load data:', error);
        toast.error('Erreur lors du chargement des données');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (clients.length === 0) {
      loadData();
    }
  }, [loadClients, loadClientColors, clients.length]);

  // Sync local colors with store
  useEffect(() => {
    setLocalColors(clientColors);
  }, [clientColors]);

  const handleColorChange = (clientId: string, color: string) => {
    setLocalColors(prev => ({
      ...prev,
      [clientId]: color
    }));
  };

  const handleRandomColor = (clientId: string) => {
    const randomColor = generateRandomPastelColor();
    handleColorChange(clientId, randomColor);
  };

  const handleRandomizeAll = () => {
    const newColors: Record<string, string> = {};
    clients.forEach(client => {
      newColors[client.id] = generateRandomPastelColor();
    });
    setLocalColors(newColors);
  };

  const handleSave = async () => {
    // Validate colors
    const invalidColors = Object.entries(localColors).filter(
      ([_, color]) => color && !isValidHexColor(color)
    );
    
    if (invalidColors.length > 0) {
      toast.error('Certaines couleurs ne sont pas valides. Utilisez le format hexadécimal (#RRGGBB)');
      return;
    }
    
    setIsSaving(true);
    try {
      await updateClientColors(localColors);
      toast.success('Couleurs des clients mises à jour avec succès');
    } catch (error) {
      console.error('Failed to save colors:', error);
      toast.error('Erreur lors de la sauvegarde des couleurs');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setLocalColors(clientColors);
    toast.info('Modifications annulées');
  };

  const hasChanges = JSON.stringify(localColors) !== JSON.stringify(clientColors);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Couleurs des Clients</CardTitle>
          <CardDescription>
            Définissez une couleur unique pour chaque client. Ces couleurs seront utilisées dans le calendrier pour identifier rapidement les tâches.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Actions bar */}
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRandomizeAll}
                disabled={isSaving}
              >
                <Shuffle className="h-4 w-4 mr-2" />
                Couleurs aléatoires
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={!hasChanges || isSaving}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>
              <Button
                size="sm"
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
                    <Palette className="h-4 w-4 mr-2" />
                    Sauvegarder
                  </>
                )}
              </Button>
            </div>

            {/* Client list */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {clients.map((client: Client) => {
                const color = localColors[client.id] || '#E5E7EB';
                const isEditing = editingClientId === client.id;
                const textColor = getContrastColor(color);
                
                return (
                  <div
                    key={client.id}
                    className="flex items-center gap-3 p-3 rounded-lg border"
                  >
                    <div
                      className="w-12 h-12 rounded-md border cursor-pointer transition-transform hover:scale-110"
                      style={{ 
                        backgroundColor: color,
                        color: textColor
                      }}
                      onClick={() => setEditingClientId(isEditing ? null : client.id)}
                      title="Cliquer pour modifier"
                    >
                      <div className="w-full h-full flex items-center justify-center text-xs font-medium">
                        {client.name.substring(0, 2).toUpperCase()}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{client.name}</p>
                      {isEditing ? (
                        <div className="flex gap-1 mt-1">
                          <Input
                            type="text"
                            value={color}
                            onChange={(e) => handleColorChange(client.id, e.target.value)}
                            placeholder="#RRGGBB"
                            className="h-7 text-xs"
                            onBlur={() => setEditingClientId(null)}
                            autoFocus
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2"
                            onClick={() => handleRandomColor(client.id)}
                          >
                            <Shuffle className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">{color}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {clients.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Aucun client trouvé. Les clients sont récupérés depuis Notion.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}