import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Clock,
  Trash2,
  RotateCw,
  Activity
} from 'lucide-react';
import { syncService } from '@/services/api/sync.service';
import { useToast } from '@/hooks/use-toast';

const SyncControlPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch sync status
  const { data: syncStatus } = useQuery({
    queryKey: ['sync-status'],
    queryFn: syncService.getStatus,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Clear queue mutation
  const clearQueueMutation = useMutation({
    mutationFn: syncService.clearQueue,
    onSuccess: () => {
      toast({
        title: 'Succès',
        description: 'La queue de synchronisation a été vidée',
      });
      queryClient.invalidateQueries({ queryKey: ['sync-status'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors du vidage de la queue',
        variant: 'destructive',
      });
    },
  });

  // Retry failed mutation
  const retryFailedMutation = useMutation({
    mutationFn: syncService.retryFailed,
    onSuccess: (data) => {
      toast({
        title: 'Succès',
        description: `${data.data?.retried || 0} éléments ont été relancés`,
      });
      queryClient.invalidateQueries({ queryKey: ['sync-status'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la relance',
        variant: 'destructive',
      });
    },
  });

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'idle':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'syncing':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'conflict':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'idle':
        return <Badge className="bg-green-500">Inactif</Badge>;
      case 'syncing':
        return <Badge className="bg-blue-500">Synchronisation en cours</Badge>;
      case 'error':
        return <Badge variant="destructive">Erreur</Badge>;
      case 'conflict':
        return <Badge className="bg-yellow-500">Conflits détectés</Badge>;
      default:
        return <Badge variant="secondary">Inconnu</Badge>;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) {return 'N/A';}
    return new Date(dateString).toLocaleString('fr-FR');
  };

  const status = syncStatus?.data;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Contrôle de Synchronisation</h1>
        <p className="text-muted-foreground">
          Gérez et surveillez la synchronisation avec Notion
        </p>
      </div>

      {/* Status Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(status?.status)}
              <div>
                <CardTitle>État de la Synchronisation</CardTitle>
                <CardDescription>Vue d'ensemble du système de synchronisation</CardDescription>
              </div>
            </div>
            {getStatusBadge(status?.status)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold">{status?.pending || 0}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Échecs</p>
                <p className="text-2xl font-bold text-red-600">{status?.failed || 0}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Conflits</p>
                <p className="text-2xl font-bold text-yellow-600">{status?.conflicts || 0}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Traités</p>
                <p className="text-2xl font-bold text-green-600">
                  {status?.queueDetails?.processed || 0}
                </p>
              </div>
            </div>

            {status?.queueDetails?.processing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Traitement en cours...</span>
                  <span>{status.queueDetails.itemsInQueue.length} éléments</span>
                </div>
                <Progress value={75} className="h-2" />
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                <p>Dernière sync: {formatDate(status?.lastSync)}</p>
                {status?.nextRetry && (
                  <p>Prochaine tentative: {formatDate(status.nextRetry)}</p>
                )}
              </div>
              <div className="text-sm text-muted-foreground text-right">
                {status?.queueDetails && (
                  <p>Temps moyen: {status.queueDetails.avgProcessingTime}ms</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Queue Management */}
      <Card>
        <CardHeader>
          <CardTitle>Gestion de la Queue</CardTitle>
          <CardDescription>
            Actions de maintenance pour la queue de synchronisation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              variant="outline"
              onClick={() => clearQueueMutation.mutate()}
              disabled={clearQueueMutation.isPending || (status?.pending || 0) === 0}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Vider la Queue ({status?.pending || 0})
            </Button>

            <Button
              variant="outline"
              onClick={() => retryFailedMutation.mutate()}
              disabled={retryFailedMutation.isPending || (status?.failed || 0) === 0}
            >
              <RotateCw className="mr-2 h-4 w-4" />
              Relancer les Échecs ({status?.failed || 0})
            </Button>
          </div>

          {(status?.failed || 0) > 0 && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Éléments en échec</AlertTitle>
              <AlertDescription>
                {status?.failed} élément(s) ont échoué lors de la dernière synchronisation.
                Vous pouvez les relancer manuellement.
              </AlertDescription>
            </Alert>
          )}

          {(status?.conflicts || 0) > 0 && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Conflits détectés</AlertTitle>
              <AlertDescription>
                {status?.conflicts} conflit(s) nécessitent votre attention.
                <Button variant="link" className="px-0 ml-2">
                  Voir les conflits →
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Queue Details */}
      {status?.queueDetails?.itemsInQueue && status.queueDetails.itemsInQueue.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Éléments en Queue</CardTitle>
            <CardDescription>
              {status.queueDetails.itemsInQueue.length} élément(s) en attente de traitement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {status.queueDetails.itemsInQueue.slice(0, 10).map((item: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-2 rounded border">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{item.type || 'Item'}</span>
                  </div>
                  <Badge variant="outline">{item.status || 'pending'}</Badge>
                </div>
              ))}
              {status.queueDetails.itemsInQueue.length > 10 && (
                <p className="text-sm text-muted-foreground text-center pt-2">
                  Et {status.queueDetails.itemsInQueue.length - 10} autres...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SyncControlPage;