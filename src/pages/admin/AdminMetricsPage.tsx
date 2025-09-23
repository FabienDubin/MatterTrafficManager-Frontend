import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { monitoringService } from '@/services/api/monitoring.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Zap,
  Target,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function AdminMetricsPage() {
  const navigate = useNavigate();
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['systemMetrics'],
    queryFn: () => monitoringService.getSystemMetrics(),
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const metrics = data?.cache;

  const calculateHitRate = () => {
    if (!metrics || metrics.totalRequests === 0) return 0;
    return (metrics.hits / metrics.totalRequests * 100);
  };

  const formatResponseTime = (ms: number) => {
    if (ms < 1) return `${(ms * 1000).toFixed(0)}µs`;
    if (ms < 1000) return `${ms.toFixed(1)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

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
            Erreur lors du chargement des métriques de cache
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const hitRate = calculateHitRate();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Métriques du cache</h1>
          <p className="text-gray-500 mt-1">Performances et statistiques détaillées</p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          Rafraîchir
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Taux de succès
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hitRate.toFixed(1)}%</div>
            <Progress value={hitRate} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {metrics?.hits?.toLocaleString()} hits / {metrics?.totalRequests?.toLocaleString()} requêtes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Temps moyen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatResponseTime(metrics?.avgResponseTime || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Min: {formatResponseTime(metrics?.minResponseTime || 0)} | 
              Max: {formatResponseTime(metrics?.maxResponseTime || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Cache Hits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {metrics?.hits?.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Requêtes servies depuis le cache
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              Cache Misses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {metrics?.misses?.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Requêtes vers la base de données
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Response Time Percentiles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Percentiles de temps de réponse
          </CardTitle>
          <CardDescription>
            Distribution des temps de réponse
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">P50 (Médiane)</p>
              <p className="text-2xl font-bold mt-2">
                {formatResponseTime(metrics?.responseTimePercentiles?.p50 || 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                50% des requêtes
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">P95</p>
              <p className="text-2xl font-bold mt-2">
                {formatResponseTime(metrics?.responseTimePercentiles?.p95 || 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                95% des requêtes
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">P99</p>
              <p className="text-2xl font-bold mt-2">
                {formatResponseTime(metrics?.responseTimePercentiles?.p99 || 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                99% des requêtes
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Entity Metrics */}
      {metrics?.entityMetrics && Object.keys(metrics.entityMetrics).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Métriques par entité
            </CardTitle>
            <CardDescription>
              Performance du cache par type de données
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entité</TableHead>
                  <TableHead className="text-right">Hits</TableHead>
                  <TableHead className="text-right">Misses</TableHead>
                  <TableHead className="text-right">Taux de succès</TableHead>
                  <TableHead className="text-right">Temps moyen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(metrics.entityMetrics).map(([entity, data]) => {
                  const entityHitRate = data.requests > 0 
                    ? (data.hits / data.requests * 100) 
                    : 0;
                  
                  return (
                    <TableRow 
                      key={entity}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => setSelectedEntity(entity)}
                    >
                      <TableCell className="font-medium capitalize">{entity}</TableCell>
                      <TableCell className="text-right">{data.hits.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{data.misses.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={entityHitRate > 80 ? 'default' : entityHitRate > 50 ? 'secondary' : 'destructive'}>
                          {entityHitRate.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatResponseTime(data.avgResponseTime)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>
            Navigation et gestion du cache
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
            onClick={() => navigate('/admin/health')}
          >
            État de santé
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate('/admin/memory')}
          >
            Utilisation mémoire
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}