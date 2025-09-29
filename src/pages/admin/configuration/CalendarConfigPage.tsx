import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Save, RefreshCw, Calendar, CalendarDays, CalendarRange, Palette } from 'lucide-react';
import { 
  useCalendarConfigStore, 
  AVAILABLE_FIELDS, 
  type FieldType 
} from '@/store/calendar-config.store';
import { ClientColorsTab } from '@/components/admin/ClientColorsTab';

export function CalendarConfigPage() {
  const { 
    config, 
    isLoading, 
    error, 
    fetchConfig, 
    updateConfig, 
    saveConfig 
  } = useCalendarConfigStore();

  const [localConfig, setLocalConfig] = useState(config || {
    dayView: { fields: [], maxTitleLength: 30 },
    weekView: { fields: [], maxTitleLength: 20 },
    monthView: { fields: [], maxTitleLength: 15 },
    showWeekends: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  // Sync local state with store config
  useEffect(() => {
    if (config) {
      setLocalConfig(config);
    }
  }, [config]);

  // Load config on mount
  useEffect(() => {
    if (!config) {
      fetchConfig();
    }
  }, []);

  const handleFieldToggle = (
    viewType: 'dayView' | 'weekView' | 'monthView', 
    field: FieldType
  ) => {
    if (!localConfig) {return;}

    const currentFields = localConfig[viewType]?.fields || [];
    const newFields = currentFields.includes(field)
      ? currentFields.filter(f => f !== field)
      : [...currentFields, field];

    setLocalConfig({
      ...localConfig,
      [viewType]: {
        ...localConfig[viewType],
        fields: newFields,
      },
    });
  };

  const handleMaxLengthChange = (
    viewType: 'dayView' | 'weekView' | 'monthView',
    value: string
  ) => {
    if (!localConfig) {return;}

    const maxLength = parseInt(value, 10);
    if (isNaN(maxLength) || maxLength < 1) {return;}

    setLocalConfig({
      ...localConfig,
      [viewType]: {
        ...localConfig[viewType],
        maxTitleLength: maxLength,
      },
    });
  };

  const handleSave = async () => {
    if (!localConfig) {return;}

    setIsSaving(true);
    try {
      // Update store with local changes
      await updateConfig('dayView', localConfig.dayView);
      await updateConfig('weekView', localConfig.weekView);
      await updateConfig('monthView', localConfig.monthView);
      
      // Update store config directly for showWeekends
      const store = useCalendarConfigStore.getState();
      store.config = { ...store.config, ...localConfig };
      
      // Save to backend
      await saveConfig();
      
      toast.success('Configuration sauvegardée', {
        description: 'Les changements ont été appliqués avec succès',
      });
    } catch (error) {
      toast.error('Erreur de sauvegarde', {
        description: 'Impossible de sauvegarder la configuration',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRefresh = async () => {
    await fetchConfig();
    toast.success('Configuration rechargée');
  };

  if (isLoading && !localConfig) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error && !localConfig) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Réessayer
        </Button>
      </div>
    );
  }

  if (!localConfig) {return null;}

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Configuration du Calendrier</h2>
          <p className="text-muted-foreground mt-1">
            Configurez l'affichage des informations dans chaque vue du calendrier
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Rafraîchir
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving || isLoading}
            size="sm"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </div>

      {/* Options générales */}
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
              checked={localConfig?.showWeekends ?? true}
              onCheckedChange={(checked) => {
                setLocalConfig({
                  ...localConfig,
                  showWeekends: checked,
                });
              }}
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

      <Tabs defaultValue="dayView" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dayView" className="gap-2">
            <Calendar className="h-4 w-4" />
            Vue Jour
          </TabsTrigger>
          <TabsTrigger value="weekView" className="gap-2">
            <CalendarRange className="h-4 w-4" />
            Vue Semaine
          </TabsTrigger>
          <TabsTrigger value="monthView" className="gap-2">
            <CalendarDays className="h-4 w-4" />
            Vue Mois
          </TabsTrigger>
          <TabsTrigger value="clientColors" className="gap-2">
            <Palette className="h-4 w-4" />
            Couleurs Clients
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dayView" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuration Vue Jour</CardTitle>
              <CardDescription>
                Sélectionnez les champs à afficher dans la vue jour
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Champs à afficher</Label>
                <div className="grid grid-cols-2 gap-4">
                  {AVAILABLE_FIELDS.map(field => (
                    <div key={field.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`day-${field.value}`}
                        checked={localConfig?.dayView?.fields?.includes(field.value) || false}
                        onCheckedChange={() => handleFieldToggle('dayView', field.value)}
                      />
                      <Label
                        htmlFor={`day-${field.value}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {field.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="day-max-length">
                  Longueur maximale du titre
                </Label>
                <Input
                  id="day-max-length"
                  type="number"
                  min="10"
                  max="100"
                  value={localConfig?.dayView?.maxTitleLength || 30}
                  onChange={(e) => handleMaxLengthChange('dayView', e.target.value)}
                  className="w-32"
                />
                <p className="text-xs text-muted-foreground">
                  Nombre de caractères avant troncature
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weekView" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuration Vue Semaine</CardTitle>
              <CardDescription>
                Sélectionnez les champs à afficher dans la vue semaine
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Champs à afficher</Label>
                <div className="grid grid-cols-2 gap-4">
                  {AVAILABLE_FIELDS.map(field => (
                    <div key={field.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`week-${field.value}`}
                        checked={localConfig?.weekView?.fields?.includes(field.value) || false}
                        onCheckedChange={() => handleFieldToggle('weekView', field.value)}
                      />
                      <Label
                        htmlFor={`week-${field.value}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {field.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="week-max-length">
                  Longueur maximale du titre
                </Label>
                <Input
                  id="week-max-length"
                  type="number"
                  min="10"
                  max="100"
                  value={localConfig?.weekView?.maxTitleLength || 20}
                  onChange={(e) => handleMaxLengthChange('weekView', e.target.value)}
                  className="w-32"
                />
                <p className="text-xs text-muted-foreground">
                  Nombre de caractères avant troncature
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthView" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuration Vue Mois</CardTitle>
              <CardDescription>
                Sélectionnez les champs à afficher dans la vue mois
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Champs à afficher</Label>
                <div className="grid grid-cols-2 gap-4">
                  {AVAILABLE_FIELDS.map(field => (
                    <div key={field.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`month-${field.value}`}
                        checked={localConfig?.monthView?.fields?.includes(field.value) || false}
                        onCheckedChange={() => handleFieldToggle('monthView', field.value)}
                      />
                      <Label
                        htmlFor={`month-${field.value}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {field.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="month-max-length">
                  Longueur maximale du titre
                </Label>
                <Input
                  id="month-max-length"
                  type="number"
                  min="10"
                  max="100"
                  value={localConfig?.monthView?.maxTitleLength || 15}
                  onChange={(e) => handleMaxLengthChange('monthView', e.target.value)}
                  className="w-32"
                />
                <p className="text-xs text-muted-foreground">
                  Nombre de caractères avant troncature
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clientColors" className="space-y-4">
          <ClientColorsTab />
        </TabsContent>
      </Tabs>

      {/* Preview Section */}
      <Card>
        <CardHeader>
          <CardTitle>Aperçu</CardTitle>
          <CardDescription>
            Exemple de l'affichage avec la configuration actuelle
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-medium mb-2">Vue Jour</p>
              <div className="p-3 border rounded-md bg-muted/50">
                {localConfig?.dayView?.fields?.map(field => (
                  <div key={field} className="text-xs">
                    • {AVAILABLE_FIELDS.find(f => f.value === field)?.label}
                  </div>
                )) || <div className="text-xs text-muted-foreground">Aucun champ</div>}
              </div>
            </div>
            <div>
              <p className="font-medium mb-2">Vue Semaine</p>
              <div className="p-3 border rounded-md bg-muted/50">
                {localConfig?.weekView?.fields?.map(field => (
                  <div key={field} className="text-xs">
                    • {AVAILABLE_FIELDS.find(f => f.value === field)?.label}
                  </div>
                )) || <div className="text-xs text-muted-foreground">Aucun champ</div>}
              </div>
            </div>
            <div>
              <p className="font-medium mb-2">Vue Mois</p>
              <div className="p-3 border rounded-md bg-muted/50">
                {localConfig?.monthView?.fields?.map(field => (
                  <div key={field} className="text-xs">
                    • {AVAILABLE_FIELDS.find(f => f.value === field)?.label}
                  </div>
                )) || <div className="text-xs text-muted-foreground">Aucun champ</div>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}