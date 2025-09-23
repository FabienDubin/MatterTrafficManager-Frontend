import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { metricsService } from '@/services/api/metrics.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Zap,
  Clock,
  Activity,
  AlertCircle,
  TrendingUp,
  Database,
  Server,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function AdminPerformancePage() {
  const navigate = useNavigate();
  
  const { data: dashboardData, isLoading, error, refetch } = useQuery({
    queryKey: ['performanceMetrics'],
    queryFn: () => metricsService.getDashboard(),
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const metrics = dashboardData?.data;

  const formatLatency = (ms: number) => {
    if (ms < 1) return `${(ms * 1000).toFixed(0)}µs`;
    if (ms < 1000) return `${ms.toFixed(1)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getLatencyStatus = (latency: number, threshold: number) => {
    if (latency < threshold * 0.5) return { color: 'text-green-600', bg: 'bg-green-50', label: '🟢 Excellent' };
    if (latency < threshold) return { color: 'text-yellow-600', bg: 'bg-yellow-50', label: '🟡 Acceptable' };
    return { color: 'text-red-600', bg: 'bg-red-50', label: '🔴 Lent' };
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
            Erreur lors du chargement des métriques de performance
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const redisStatus = getLatencyStatus(
    metrics?.latency?.redis?.avgLatency || 0,
    metrics?.latency?.redis?.threshold || 10
  );
  
  const notionStatus = getLatencyStatus(
    metrics?.latency?.notion?.avgLatency || 0,
    metrics?.latency?.notion?.threshold || 100
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Performance & Latence</h1>
          <p className="text-gray-500 mt-1">Métriques de performance Redis vs Notion</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-1" />
            Rafraîchir
          </Button>
          <Button 
            onClick={() => metricsService.resetMetrics('all')} 
            variant="destructive" 
            size="sm"
          >
            Reset Métriques
          </Button>
        </div>
      </div>

      {/* Latency Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className={redisStatus.bg}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Redis Performance
            </CardTitle>
            <Badge className="w-fit">{redisStatus.label}</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Latence moyenne</p>
                <p className={`text-2xl font-bold ${redisStatus.color}`}>
                  {formatLatency(metrics?.latency?.redis?.avgLatency || 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Opérations</p>
                <p className="text-2xl font-bold">
                  {metrics?.latency?.redis?.count || 0}
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Min: {formatLatency(metrics?.latency?.redis?.minLatency || 0)}</span>
                <span>Max: {formatLatency(metrics?.latency?.redis?.maxLatency || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>P95: {formatLatency(metrics?.latency?.redis?.p95Latency || 0)}</span>
                <span>P99: {formatLatency(metrics?.latency?.redis?.p99Latency || 0)}</span>
              </div>
            </div>
            
            {(metrics?.latency?.redis?.slowOperations ?? 0) > 0 && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {metrics.latency.redis.slowOperations} opérations lentes (&gt;{metrics.latency.redis.threshold}ms)
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card className={notionStatus.bg}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Notion API Performance
            </CardTitle>
            <Badge className="w-fit">{notionStatus.label}</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Latence moyenne</p>
                <p className={`text-2xl font-bold ${notionStatus.color}`}>
                  {formatLatency(metrics?.latency?.notion?.avgLatency || 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Opérations</p>
                <p className="text-2xl font-bold">
                  {metrics?.latency?.notion?.count || 0}
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Min: {formatLatency(metrics?.latency?.notion?.minLatency || 0)}</span>
                <span>Max: {formatLatency(metrics?.latency?.notion?.maxLatency || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>P95: {formatLatency(metrics?.latency?.notion?.p95Latency || 0)}</span>
                <span>P99: {formatLatency(metrics?.latency?.notion?.p99Latency || 0)}</span>
              </div>
            </div>
            
            {(metrics?.latency?.notion?.slowOperations ?? 0) > 0 && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {metrics.latency.notion.slowOperations} opérations lentes (&gt;{metrics.latency.notion.threshold}ms)
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Comparison Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Comparaison Redis vs Notion
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center p-4 border rounded-lg bg-blue-50">
            <p className="text-3xl font-bold text-blue-600">
              {metrics?.latency?.comparison?.avgSpeedup || '0x'}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {metrics?.latency?.comparison?.redisVsNotion || 'En attente de données'}
            </p>
          </div>
          
          <Alert>
            <TrendingUp className="h-4 w-4" />
            <AlertDescription>
              <strong>Recommandation:</strong> {metrics?.latency?.comparison?.recommendation || 'Aucune donnée disponible'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Sync Queue Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            File de synchronisation
          </CardTitle>
          <CardDescription>
            État de la queue de synchronisation Notion
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">En attente</p>
              <p className="text-2xl font-bold">{metrics?.queue?.length || 0}</p>
              {(metrics?.queue?.length ?? 0) > 10 && (
                <Badge variant="destructive" className="mt-2">Surchargé</Badge>
              )}
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Traitées</p>
              <p className="text-2xl font-bold text-green-600">
                {metrics?.queue?.processed || 0}
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Échecs</p>
              <p className="text-2xl font-bold text-red-600">
                {metrics?.queue?.failed || 0}
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Temps moyen</p>
              <p className="text-2xl font-bold">
                {formatLatency(metrics?.queue?.avgProcessingTime || 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cache Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Résumé du cache
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Taux de succès</p>
              <div className="flex items-center gap-2 mt-1">
                <Progress value={metrics?.cache?.hitRate || 0} className="flex-1 h-2" />
                <span className="text-sm font-bold">{metrics?.cache?.hitRate?.toFixed(1)}%</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Temps de réponse moyen</p>
              <p className="text-lg font-bold">{formatLatency(metrics?.cache?.avgResponseTime || 0)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total requêtes</p>
              <p className="text-lg font-bold">{metrics?.cache?.totalRequests?.toLocaleString() || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex gap-2">
        <Button onClick={() => navigate('/admin/dashboard')} variant="outline">
          Retour au dashboard
        </Button>
        <Button onClick={() => navigate('/admin/metrics')} variant="outline">
          Métriques du cache
        </Button>
        <Button onClick={() => navigate('/admin/health')} variant="outline">
          État de santé
        </Button>
      </div>
    </div>
  );
}