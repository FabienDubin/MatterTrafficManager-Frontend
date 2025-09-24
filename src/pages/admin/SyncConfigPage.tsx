import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Loader2, 
  Save, 
  AlertCircle, 
  CheckCircle2,
  Zap,
  Database,
  Trash2,
  Activity,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { useSyncStatus } from '@/hooks/useSyncStatus';
import { configService } from '@/services/api/config.service';
import { useConfigStore } from '@/store/config.store';

interface AsyncModeConfig {
  create: boolean;
  update: boolean;
  delete: boolean;
  batchSize: number;
  retryCount: number;
}

export default function SyncConfigPage() {
  const [config, setConfig] = useState<AsyncModeConfig>({
    create: false,
    update: false,
    delete: false,
    batchSize: 10,
    retryCount: 3
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Get real-time sync status
  const { syncStatus, isLoading: statusLoading, clearQueue, retryFailed } = useSyncStatus({
    refetchInterval: 2000 // Poll every 2 seconds for real-time updates
  });

  // Load config from API
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        const asyncConfig = await configService.getAsyncModeConfig();
        setConfig({
          create: asyncConfig.create,
          update: asyncConfig.update,
          delete: asyncConfig.delete,
          batchSize: 10,
          retryCount: 3
        });
      } catch (error) {
        console.error('Failed to load config:', error);
        toast.error('Erreur lors du chargement de la configuration');
      } finally {
        setLoading(false);
      }
    };
    
    loadConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save to backend API
      await configService.updateAsyncModeConfig({
        create: config.create,
        update: config.update,
        delete: config.delete
      });
      
      // Broadcast config change to all components
      window.dispatchEvent(new CustomEvent('async-config-changed', { 
        detail: config 
      }));
      
      toast.success('Configuration sauvegardée avec succès');
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const getRiskLevel = (operation: string) => {
    switch(operation) {
      case 'create':
        return { level: 'low', color: 'bg-green-500', text: 'Faible' };
      case 'delete':
        return { level: 'low', color: 'bg-green-500', text: 'Faible' };
      case 'update':
        return { level: 'high', color: 'bg-orange-500', text: 'Élevé' };
      default:
        return { level: 'unknown', color: 'bg-gray-500', text: 'Inconnu' };
    }
  };

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Configuration de Synchronisation</h1>
        <p className="text-muted-foreground mt-2">
          Gérez les paramètres du mode asynchrone pour optimiser les performances
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Mode Asynchrone
              </CardTitle>
              <CardDescription>
                Active les opérations en arrière-plan pour une meilleure réactivité
              </CardDescription>
            </div>
            <Badge variant={Object.values(config).some(v => v === true) ? "default" : "secondary"}>
              {Object.values(config).filter(v => v === true).length} / 3 actifs
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Create Operations */}
          <div className="flex items-center justify-between py-4 border-b">
            <div className="space-y-0.5">
              <Label htmlFor="async-create" className="text-base font-medium">
                Création de tâches
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={getRiskLevel('create').color}>
                  Risque {getRiskLevel('create').text}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  IDs temporaires, rollback automatique
                </span>
              </div>
            </div>
            <Switch
              id="async-create"
              checked={config.create}
              onCheckedChange={(checked: boolean) => 
                setConfig(prev => ({ ...prev, create: checked }))
              }
            />
          </div>

          {/* Update Operations */}
          <div className="flex items-center justify-between py-4 border-b">
            <div className="space-y-0.5">
              <Label htmlFor="async-update" className="text-base font-medium">
                Modification de tâches
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={getRiskLevel('update').color}>
                  Risque {getRiskLevel('update').text}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Conflits possibles, résolution requise
                </span>
              </div>
            </div>
            <Switch
              id="async-update"
              checked={config.update}
              onCheckedChange={(checked: boolean) => 
                setConfig(prev => ({ ...prev, update: checked }))
              }
            />
          </div>

          {/* Delete Operations */}
          <div className="flex items-center justify-between py-4">
            <div className="space-y-0.5">
              <Label htmlFor="async-delete" className="text-base font-medium">
                Suppression de tâches
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={getRiskLevel('delete').color}>
                  Risque {getRiskLevel('delete').text}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Soft delete, réversible
                </span>
              </div>
            </div>
            <Switch
              id="async-delete"
              checked={config.delete}
              onCheckedChange={(checked: boolean) => 
                setConfig(prev => ({ ...prev, delete: checked }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Performance Alert */}
      {Object.values(config).some(v => v === true) && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Mode asynchrone activé</strong> - Les opérations seront traitées en arrière-plan.
            Les utilisateurs verront les changements immédiatement (optimistic updates) mais la synchronisation
            avec Notion peut prendre quelques secondes. Surveillez le SyncIndicator pour l'état de sync.
          </AlertDescription>
        </Alert>
      )}

      {/* Real-time Queue Status */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              État de la Queue en Temps Réel
            </CardTitle>
            {syncStatus && (
              <Badge 
                variant={
                  syncStatus.status === 'idle' ? 'secondary' :
                  syncStatus.status === 'syncing' ? 'default' :
                  syncStatus.status === 'conflict' ? 'destructive' :
                  'destructive'
                }
              >
                {syncStatus.status === 'idle' ? 'Inactif' :
                 syncStatus.status === 'syncing' ? 'Synchronisation' :
                 syncStatus.status === 'conflict' ? 'Conflits' :
                 'Erreur'}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {statusLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : syncStatus ? (
            <div className="space-y-6">
              {/* Queue Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    En attente
                  </p>
                  <p className="text-2xl font-bold">{syncStatus.pending}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Traités
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {syncStatus.queueDetails?.processed || 0}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Échecs
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {syncStatus.failed}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Conflits
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    {syncStatus.conflicts}
                  </p>
                </div>
              </div>

              {/* Processing Info */}
              {syncStatus.queueDetails?.processing && (
                <Alert>
                  <Activity className="h-4 w-4" />
                  <AlertDescription>
                    Traitement en cours... 
                    Temps moyen: {syncStatus.queueDetails.avgProcessingTime}ms
                  </AlertDescription>
                </Alert>
              )}

              {/* Queue Items Preview */}
              {syncStatus.queueDetails?.itemsInQueue && 
               syncStatus.queueDetails.itemsInQueue.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">
                    Prochains éléments ({syncStatus.queueDetails.itemsInQueue.length})
                  </h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {syncStatus.queueDetails.itemsInQueue.slice(0, 5).map((item, idx) => (
                      <div key={idx} className="text-xs p-2 bg-muted rounded flex justify-between">
                        <span>{item.type} - {item.entityType}</span>
                        <span className="text-muted-foreground">
                          Tentatives: {item.attempts}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              {(syncStatus.failed > 0 || syncStatus.conflicts > 0) && (
                <div className="flex gap-2">
                  {syncStatus.failed > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        const result = await retryFailed();
                        if (result.success) {
                          toast.success('Éléments en attente de retry');
                        }
                      }}
                    >
                      Réessayer les échecs
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const result = await clearQueue();
                      if (result.success) {
                        toast.success('Queue vidée');
                      }
                    }}
                  >
                    Vider la queue
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Aucune donnée disponible
            </p>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => {
            setConfig({
              create: false,
              update: false,
              delete: false,
              batchSize: 10,
              retryCount: 3
            });
          }}
        >
          Réinitialiser
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sauvegarde...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Sauvegarder
            </>
          )}
        </Button>
      </div>
    </div>
  );
}