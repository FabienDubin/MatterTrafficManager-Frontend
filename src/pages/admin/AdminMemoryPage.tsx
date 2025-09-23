import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { monitoringService } from '@/services/api/monitoring.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Database, HardDrive, Key, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function AdminMemoryPage() {
  const navigate = useNavigate();
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['memoryUsage'],
    queryFn: () => monitoringService.getMemoryUsage(),
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            Erreur lors du chargement des données mémoire
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const memory = data?.data?.memory;
  const distribution = data?.data?.distribution;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Utilisation mémoire Redis</h1>
          <p className="text-gray-500 mt-1">Surveillance de la consommation mémoire du cache</p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          Rafraîchir
        </Button>
      </div>

      {/* Memory Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              Mémoire utilisée
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{memory?.usedMemoryMB} MB</div>
            <p className="text-xs text-muted-foreground mt-1">
              {memory?.usedMemoryBytes?.toLocaleString()} octets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="h-4 w-4" />
              Limite mémoire
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{memory?.maxMemoryMB} MB</div>
            <p className="text-xs text-muted-foreground mt-1">
              {memory?.maxMemoryBytes?.toLocaleString()} octets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Key className="h-4 w-4" />
              Clés totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{memory?.keyCount?.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Clés actives dans le cache
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Taille moyenne
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {memory?.avgKeySize ? `${(memory.avgKeySize / 1024).toFixed(1)} KB` : '-'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Par clé en cache
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Memory Usage Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Utilisation de la mémoire</CardTitle>
          <CardDescription>
            Pourcentage de la mémoire Redis utilisée
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Utilisation actuelle</span>
              <span className="font-medium">{memory?.usagePercentage?.toFixed(2)}%</span>
            </div>
            <Progress value={memory?.usagePercentage || 0} className="h-3" />
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="text-lg font-semibold">
                <span className={`inline-flex items-center px-2 py-1 rounded-md text-sm ${
                  memory?.warningLevel === 'critical' ? 'bg-red-100 text-red-800' :
                  memory?.warningLevel === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {memory?.warningLevel === 'critical' ? 'Critique' :
                   memory?.warningLevel === 'warning' ? 'Attention' : 'OK'}
                </span>
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Disponible</p>
              <p className="text-lg font-semibold">
                {memory ? 
                  `${(memory.maxMemoryMB - memory.usedMemoryMB).toFixed(2)} MB` 
                  : '-'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>
            Gérer le cache et la mémoire
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button 
            variant="outline"
            onClick={() => navigate('/admin/dashboard')}
          >
            Retour au dashboard
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate('/admin/metrics')}
          >
            Voir les métriques de cache
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}