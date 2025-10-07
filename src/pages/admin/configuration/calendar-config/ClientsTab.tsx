import { useState, useEffect } from 'react';
import { useConfigStore } from '@/store/config.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, Palette, RefreshCw, Shuffle, Search } from 'lucide-react';
import { generateRandomPastelColor, isValidHexColor } from '@/utils/colorUtils';
import { ClientColorEditor } from '@/components/admin/ClientColorEditor';
import type { Client } from '@/types/client.types';

export function ClientsTab() {
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

  const handleReset = () => {
    setLocalColors(clientColors);
    toast.info('Modifications annulées');
  };

  const hasChanges = JSON.stringify(localColors) !== JSON.stringify(clientColors);

  // Filter and sort clients
  const filteredAndSortedClients = clients
    .filter(client => client.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'));

  if (isLoading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle>Couleurs des Clients</CardTitle>
          <CardDescription>
            Définissez une couleur unique pour chaque client. Ces couleurs seront utilisées dans le
            calendrier pour identifier rapidement les tâches.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              {/* Search bar */}
              <div className='relative w-1/3'>
                <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                <Input
                  type='text'
                  placeholder='Rechercher un client...'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className='pl-9'
                />
              </div>

              {/* Actions bar */}
              <div className='flex gap-2 justify-end'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleRandomizeAll}
                  disabled={isSaving}
                >
                  <Shuffle className='h-4 w-4 mr-2' />
                  Couleurs aléatoires
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleReset}
                  disabled={!hasChanges || isSaving}
                >
                  <RefreshCw className='h-4 w-4 mr-2' />
                  Réinitialiser
                </Button>
                <Button size='sm' onClick={handleSave} disabled={!hasChanges || isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                      Sauvegarde...
                    </>
                  ) : (
                    <>
                      <Palette className='h-4 w-4 mr-2' />
                      Sauvegarder
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Client list */}
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
              {filteredAndSortedClients.map((client: Client) => {
                const color = localColors[client.id] || '#E5E7EB';

                return (
                  <ClientColorEditor
                    key={client.id}
                    client={client}
                    color={color}
                    onColorChange={handleColorChange}
                  />
                );
              })}
            </div>

            {filteredAndSortedClients.length === 0 && clients.length > 0 && (
              <div className='text-center py-8 text-muted-foreground'>
                Aucun client trouvé pour "{searchQuery}"
              </div>
            )}

            {clients.length === 0 && (
              <div className='text-center py-8 text-muted-foreground'>
                Aucun client trouvé. Les clients sont récupérés depuis Notion.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
