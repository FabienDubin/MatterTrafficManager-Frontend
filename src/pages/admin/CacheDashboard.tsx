import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  RefreshCw, 
  Trash2, 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Database,
  Clock,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { useCacheMetrics } from '@/hooks/useCacheMetrics';
import { CacheHitRateChart } from '@/components/admin/CacheHitRateChart';
import { MemoryUsageGauge } from '@/components/admin/MemoryUsageGauge';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function CacheDashboard() {
  const { 
    metrics, 
    isLoading, 
    error, 
    refetch,
    clearCache,
    forceWarmup,
    isClearing,
    isWarmingUp 
  } = useCacheMetrics();

  const [selectedEntity, setSelectedEntity] = useState<string>('all');

  // Calculate hit rate percentage
  const hitRate = metrics?.cache ? 
    ((metrics.cache.hits / metrics.cache.totalRequests) * 100).toFixed(1) : 
    '0';

  // Get entity specific metrics
  const entityMetrics = selectedEntity === 'all' 
    ? metrics?.cache?.entityMetrics 
    : metrics?.cache?.entityMetrics?.[selectedEntity];

  // Adapter for memory data to match MemoryUsageGauge interface
  const adaptedMemoryData = metrics?.memory ? {
    usedMemory: metrics.memory.usedMemoryBytes || 0,
    usedMemoryHuman: `${metrics.memory.usedMemoryMB || 0} MB`,
    usedMemoryPeak: metrics.memory.usedMemoryBytes || 0,
    usedMemoryPeakHuman: `${metrics.memory.usedMemoryMB || 0} MB`,
    maxMemory: metrics.memory.maxMemoryBytes || 268435456,
    maxMemoryHuman: `${metrics.memory.maxMemoryMB || 256} MB`,
    usedMemoryPercent: metrics.memory.usagePercentage || 0,
    totalKeys: metrics.memory.keyCount || 0,
    expiredKeys: 0
  } : undefined;

  const handleClearCache = async () => {
    try {
      await clearCache();
      toast.success('Cache vidé', {
        description: 'Le cache a été vidé avec succès',
      });
      refetch();
    } catch (error) {
      toast.error('Erreur', {
        description: 'Impossible de vider le cache',
      });
    }
  };

  const handleForceWarmup = async () => {
    try {
      await forceWarmup();
      toast.success('Préchargement lancé', {
        description: 'Le cache est en cours de préchargement',
      });
      refetch();
    } catch (error) {
      toast.error('Erreur', {
        description: 'Impossible de lancer le préchargement',
      });
    }
  };

  if (isLoading && !metrics) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement des métriques...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Erreur lors du chargement des métriques. Vérifiez que le serveur est accessible.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cache & Performance</h1>
          <p className="text-muted-foreground mt-1">
            Surveillance en temps réel du système de cache
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearCache}
            disabled={isClearing}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {isClearing ? 'Vidage...' : 'Vider le cache'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleForceWarmup}
            disabled={isWarmingUp}
          >
            <Zap className="h-4 w-4 mr-2" />
            {isWarmingUp ? 'Préchargement...' : 'Forcer le préchargement'}
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Taux de succès
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hitRate}%</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {Number(hitRate) >= 80 ? (
                <>
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span>Performance optimale</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-3 w-3 text-orange-500" />
                  <span>Amélioration possible</span>
                </>
              )}
            </div>
            <Progress value={Number(hitRate)} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Total des hits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.cache?.hits || 0}</div>
            <p className="text-xs text-muted-foreground">
              sur {metrics?.cache?.totalRequests || 0} requêtes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Temps de réponse moyen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.cache?.avgResponseTime?.toFixed(0) || 0}ms
            </div>
            <p className="text-xs text-muted-foreground">
              p95: {metrics?.cache?.responseTimePercentiles?.p95?.toFixed(0) || 0}ms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="h-4 w-4" />
              Utilisation mémoire
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.memory?.usagePercentage?.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics?.memory?.usedMemoryMB || 0} MB / {metrics?.memory?.maxMemoryMB || 256} MB
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="entities">Par entité</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="memory">Mémoire</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <CacheHitRateChart data={metrics?.cache} />
            <MemoryUsageGauge data={adaptedMemoryData} />
          </div>
        </TabsContent>

        <TabsContent value="entities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Métriques par entité</CardTitle>
              <CardDescription>
                Performance du cache pour chaque type d'entité
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics?.cache?.entityMetrics && Object.entries(metrics.cache.entityMetrics).map(([entity, data]) => (
                  <div key={entity} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{entity}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {data.hits}/{data.requests} hits
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-sm">
                        <span className="font-medium">{((data.hits / data.requests) * 100).toFixed(1)}%</span>
                        <span className="text-muted-foreground ml-1">hit rate</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">{data.avgResponseTime.toFixed(0)}ms</span>
                        <span className="text-muted-foreground ml-1">avg</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribution des temps de réponse</CardTitle>
              <CardDescription>
                Percentiles des temps de réponse du cache
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">P50 (Médiane)</div>
                  <div className="text-2xl font-bold">
                    {metrics?.cache?.responseTimePercentiles?.p50?.toFixed(0) || 0}ms
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">P95</div>
                  <div className="text-2xl font-bold">
                    {metrics?.cache?.responseTimePercentiles?.p95?.toFixed(0) || 0}ms
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">P99</div>
                  <div className="text-2xl font-bold">
                    {metrics?.cache?.responseTimePercentiles?.p99?.toFixed(0) || 0}ms
                  </div>
                </div>
              </div>
              
              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Temps minimum</span>
                  <span className="font-medium">{metrics?.cache?.minResponseTime?.toFixed(0) || 0}ms</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Temps maximum</span>
                  <span className="font-medium">{metrics?.cache?.maxResponseTime?.toFixed(0) || 0}ms</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Temps moyen</span>
                  <span className="font-medium">{metrics?.cache?.avgResponseTime?.toFixed(0) || 0}ms</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="memory" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Utilisation de la mémoire Redis</CardTitle>
                <CardDescription>
                  État actuel de la mémoire Upstash
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MemoryUsageGauge data={adaptedMemoryData} showDetails />
              </CardContent>
            </Card>
            
            {metrics?.memory && (
              <Card>
                <CardHeader>
                  <CardTitle>Détails de la mémoire</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Mémoire utilisée</span>
                    <span className="font-medium">{metrics.memory.usedMemoryMB || 0} MB</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Mémoire maximale</span>
                    <span className="font-medium">{metrics.memory.maxMemoryMB || 256} MB</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Utilisation</span>
                    <span className="font-medium">{metrics.memory.usagePercentage?.toFixed(2) || 0}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Clés en cache</span>
                    <span className="font-medium">{metrics.memory.keyCount || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Taille moyenne par clé</span>
                    <span className="font-medium">
                      {metrics.memory.avgKeySize ? `${(metrics.memory.avgKeySize / 1024).toFixed(1)} KB` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Dernière vérification</span>
                    <span className="font-medium">
                      {metrics.memory.timestamp ? 
                        formatDistanceToNow(new Date(metrics.memory.timestamp), { 
                          addSuffix: true, 
                          locale: fr 
                        }) : 'N/A'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}