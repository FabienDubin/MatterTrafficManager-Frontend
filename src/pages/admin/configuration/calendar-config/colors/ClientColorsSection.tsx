import { useState, useEffect } from 'react';
import { useConfigStore } from '@/store/config.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, Palette, RefreshCw, Shuffle, Search } from 'lucide-react';
import { generateRandomPastelColor, isValidHexColor } from '@/utils/colorUtils';
import { ColorEditor } from '@/components/admin/ColorEditor';
import type { Client } from '@/types/client.types';

/**
 * ClientColorsSection - Section de configuration des couleurs clients
 * Adapté du ClientsTab existant
 */
export function ClientColorsSection() {
  const { clients, clientColors, loadClients, loadClientColors, updateClientColors } =
    useConfigStore();

  const [localColors, setLocalColors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([loadClients(), loadClientColors()]);
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
      [clientId]: color,
    }));
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
      toast.error(
        'Certaines couleurs ne sont pas valides. Utilisez le format hexadécimal (#RRGGBB)'
      );
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

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await Promise.all([loadClients(), loadClientColors()]);
      toast.success('Données rechargées');
    } catch (error) {
      console.error('Failed to refresh data:', error);
      toast.error('Erreur lors du rechargement');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter clients based on search query
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const hasChanges = JSON.stringify(localColors) !== JSON.stringify(clientColors);

  if (isLoading && clients.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-2">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">Chargement des données...</p>
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
              <Palette className="h-5 w-5" />
              Couleurs des Clients
            </CardTitle>
            <CardDescription>
              Configurez les couleurs d'affichage des tâches par client
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRandomizeAll}
              disabled={isLoading || clients.length === 0}
            >
              <Shuffle className="h-4 w-4" />
              Aléatoire
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un client..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Client Colors Grid */}
        {filteredClients.length > 0 ? (
          <div className="grid gap-3">
            {filteredClients.map(client => (
              <ColorEditor
                key={client.id}
                id={client.id}
                name={client.name}
                subtitle={undefined} // Pas de subtitle pour les clients
                color={localColors[client.id] || generateRandomPastelColor()}
                onColorChange={handleColorChange}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery ? 'Aucun client trouvé pour cette recherche' : 'Aucun client disponible'}
          </div>
        )}

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