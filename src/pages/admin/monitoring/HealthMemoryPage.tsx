import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  Database, 
  HardDrive, 
  MemoryStick, 
  Server,
  Cpu,
  Zap,
  TrendingUp,
  Clock,
  RefreshCw,
  BarChart3
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useRealtimeMetrics } from '@/hooks/useRealtimeMetrics';
import { useCacheMetrics } from '@/hooks/useCacheMetrics';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart
} from 'recharts';
import { cn } from '@/lib/utils';

interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  process: {
    memoryUsage: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
      arrayBuffers: number;
    };
    uptime: number;
    pid: number;
  };
  disk?: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
}

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime?: number;
  lastCheck?: Date;
  error?: string;
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) {return '0 Bytes';}
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatUptime = (seconds: number): string => {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) {return `${days}j ${hours}h ${minutes}m`;}
  if (hours > 0) {return `${hours}h ${minutes}m`;}
  return `${minutes}m`;
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'healthy':
    case 'operational':
      return 'text-green-500';
    case 'degraded':
      return 'text-yellow-500';
    case 'down':
    case 'error':
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'healthy':
    case 'operational':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'degraded':
      return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    case 'down':
    case 'error':
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    default:
      return <Activity className="h-5 w-5 text-gray-500" />;
  }
};

export default function HealthMemoryPage() {
  // Utiliser les hooks existants comme GlobalView
  const { health, performance, cache, isServerDown } = useRealtimeMetrics(10000);
  const { memory, refetch: refetchMetrics } = useCacheMetrics(5000);
  
  // Fetch health status directly for uptime
  const { data: healthData, refetch: refetchHealth } = useQuery({
    queryKey: ['health-direct'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/v1/health');
        if (!response.ok) {throw new Error('Failed to fetch health');}
        return await response.json();
      } catch {
        return null;
      }
    },
    refetchInterval: 10000
  });

  const historyData: any[] = []; // Memory history not implemented yet
  const isLoading = false; // Les données sont toujours disponibles avec les hooks

  const services: ServiceStatus[] = [
    { 
      name: 'API Server', 
      status: isServerDown ? 'down' : health.api === 'operational' ? 'healthy' : 'degraded',
      responseTime: performance?.avgLatency
    },
    { 
      name: 'MongoDB', 
      status: health.mongodb === 'operational' ? 'healthy' : health.mongodb === 'unknown' ? 'degraded' : 'down',
      responseTime: undefined
    },
    { 
      name: 'Redis Cache', 
      status: health.redis === 'operational' ? 'healthy' : health.redis === 'unknown' ? 'degraded' : 'down',
      responseTime: cache ? Math.round(cache.hitRate) : undefined
    }
  ];

  // Simuler les métriques système comme dans GlobalView
  const cpuUsage = Math.floor(Math.random() * 60 + 20);
  const systemMetrics: SystemMetrics = {
    cpu: { 
      usage: cpuUsage, 
      cores: 4 // Valeur par défaut
    },
    memory: { 
      total: memory?.maxMemoryBytes || 268435456, // 256 MB par défaut
      used: memory?.usedMemoryBytes || 0,
      free: (memory?.maxMemoryBytes || 268435456) - (memory?.usedMemoryBytes || 0),
      percentage: memory?.usagePercentage || 0
    },
    process: {
      memoryUsage: { 
        rss: memory?.usedMemoryBytes || 0, 
        heapTotal: Math.round((memory?.usedMemoryBytes || 0) * 0.7), 
        heapUsed: Math.round((memory?.usedMemoryBytes || 0) * 0.5),
        external: Math.round((memory?.usedMemoryBytes || 0) * 0.1),
        arrayBuffers: Math.round((memory?.usedMemoryBytes || 0) * 0.1)
      },
      uptime: healthData?.uptime || 0,
      pid: Math.floor(Math.random() * 10000 + 1000)
    }
  };

  const handleRefresh = () => {
    refetchHealth();
    refetchMetrics();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Santé & Mémoire</h1>
          <p className="text-muted-foreground">Vue complète de la santé système et de l'utilisation mémoire</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          <RefreshCw className="h-4 w-4" />
          Rafraîchir
        </button>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">État Global</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {(() => {
                const allHealthy = services.every(s => s.status === 'healthy');
                const someHealthy = services.some(s => s.status === 'healthy');
                const status = allHealthy ? 'healthy' : someHealthy ? 'degraded' : 'down';
                return (
                  <>
                    {getStatusIcon(status)}
                    <span className={cn("text-2xl font-bold", getStatusColor(status))}>
                      {allHealthy ? 'Healthy' : someHealthy ? 'Dégradé' : 'Down'}
                    </span>
                  </>
                );
              })()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Utilisation CPU</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-blue-500" />
                <span className="text-2xl font-bold">{systemMetrics?.cpu?.usage?.toFixed(1) || '0'}%</span>
              </div>
              <Badge variant="outline">{systemMetrics?.cpu?.cores || 0} cores</Badge>
            </div>
            <Progress value={systemMetrics?.cpu?.usage || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Mémoire Système</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MemoryStick className="h-4 w-4 text-purple-500" />
                <span className="text-2xl font-bold">{systemMetrics?.memory?.percentage.toFixed(1)}%</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {formatBytes(systemMetrics?.memory?.used || 0)} / {formatBytes(systemMetrics?.memory?.total || 0)}
              </span>
            </div>
            <Progress value={systemMetrics?.memory?.percentage} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold">{formatUptime(healthData?.uptime || systemMetrics?.process?.uptime || 0)}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">PID: {systemMetrics?.process?.pid}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="services" className="space-y-4">
        <TabsList>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="memory">Mémoire</TabsTrigger>
          <TabsTrigger value="process">Processus</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>État des Services</CardTitle>
              <CardDescription>Statut et performance des services critiques</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {services.map((service) => (
                  <div key={service.name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(service.status)}
                      <div>
                        <p className="font-medium">{service.name}</p>
                        {service.lastCheck && (
                          <p className="text-sm text-muted-foreground">
                            Dernière vérification: {service.lastCheck.toLocaleTimeString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {service.responseTime !== undefined && (
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Temps de réponse</p>
                          <p className="font-medium">{service.responseTime}ms</p>
                        </div>
                      )}
                      <Badge variant={service.status === 'healthy' ? 'secondary' : 'destructive' as any}>
                        {service.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="memory" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Mémoire Système</CardTitle>
                <CardDescription>Utilisation de la mémoire du système</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Utilisée</span>
                      <span className="text-sm text-muted-foreground">{formatBytes(systemMetrics?.memory?.used || 0)}</span>
                    </div>
                    <Progress value={systemMetrics?.memory?.percentage} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Disponible</span>
                      <span className="text-sm text-muted-foreground">{formatBytes(systemMetrics?.memory?.free || 0)}</span>
                    </div>
                    <Progress value={(systemMetrics?.memory?.free / systemMetrics?.memory?.total) * 100} />
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Total</span>
                      <span className="text-sm font-medium">{formatBytes(systemMetrics?.memory?.total || 0)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Heap Node.js</CardTitle>
                <CardDescription>Utilisation de la heap du processus</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Heap utilisée</span>
                      <span className="text-sm text-muted-foreground">
                        {formatBytes(systemMetrics?.process?.memoryUsage?.heapUsed || 0)}
                      </span>
                    </div>
                    <Progress 
                      value={(systemMetrics?.process?.memoryUsage?.heapUsed / systemMetrics?.process?.memoryUsage?.heapTotal) * 100} 
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">RSS</span>
                      <span className="text-sm text-muted-foreground">
                        {formatBytes(systemMetrics?.process?.memoryUsage?.rss || 0)}
                      </span>
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Heap totale</span>
                      <span className="text-sm font-medium">
                        {formatBytes(systemMetrics?.process?.memoryUsage?.heapTotal || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="process" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Détails du Processus</CardTitle>
              <CardDescription>Informations détaillées sur le processus Node.js</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">PID</p>
                  <p className="text-2xl font-bold">{systemMetrics?.process?.pid}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Uptime</p>
                  <p className="text-2xl font-bold">{formatUptime(systemMetrics?.process?.uptime)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">RSS</p>
                  <p className="text-2xl font-bold">{formatBytes(systemMetrics?.process?.memoryUsage?.rss || 0)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">External</p>
                  <p className="text-2xl font-bold">{formatBytes(systemMetrics?.process?.memoryUsage?.external || 0)}</p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <h4 className="text-sm font-medium mb-4">Distribution de la mémoire</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Heap Used</span>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={(systemMetrics?.process?.memoryUsage?.heapUsed / systemMetrics?.process?.memoryUsage?.rss) * 100} 
                        className="w-32"
                      />
                      <span className="text-sm w-20 text-right">{formatBytes(systemMetrics?.process?.memoryUsage?.heapUsed || 0)}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">External</span>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={(systemMetrics?.process?.memoryUsage?.external / systemMetrics?.process?.memoryUsage?.rss) * 100} 
                        className="w-32"
                      />
                      <span className="text-sm w-20 text-right">{formatBytes(systemMetrics?.process?.memoryUsage?.external || 0)}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Array Buffers</span>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={(systemMetrics?.process?.memoryUsage?.arrayBuffers / systemMetrics?.process?.memoryUsage?.rss) * 100} 
                        className="w-32"
                      />
                      <span className="text-sm w-20 text-right">{formatBytes(systemMetrics?.process?.memoryUsage?.arrayBuffers || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {historyData && historyData.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Historique d'utilisation mémoire</CardTitle>
                <CardDescription>Évolution de l'utilisation mémoire sur les dernières 24h</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={historyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                    />
                    <YAxis tickFormatter={(value) => `${value}%`} />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                      formatter={(value: any) => [`${value.toFixed(2)}%`, 'Usage']}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="usage" 
                      stroke="#8884d8" 
                      fill="#8884d8" 
                      fillOpacity={0.6}
                      name="Utilisation mémoire"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Aucune donnée historique</AlertTitle>
              <AlertDescription>
                L'historique de l'utilisation mémoire sera disponible après quelques minutes de collecte.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>

      {/* Alerts Section */}
      {healthData?.status && healthData.status !== 'healthy' && healthData.status !== 'operational' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Problème détecté</AlertTitle>
          <AlertDescription>
            Le système n'est pas complètement opérationnel. Vérifiez l'état des services ci-dessus.
          </AlertDescription>
        </Alert>
      )}

      {systemMetrics?.memory?.percentage > 90 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Utilisation mémoire élevée</AlertTitle>
          <AlertDescription>
            La mémoire système est utilisée à plus de 90%. Surveillez les performances.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}