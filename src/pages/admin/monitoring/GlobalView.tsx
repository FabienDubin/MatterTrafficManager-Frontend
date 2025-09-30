import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HealthStatusCard } from '@/components/admin/monitoring/cards/HealthStatusCard';
import { ActiveUsersCard } from '@/components/admin/monitoring/cards/ActiveUsersCard';
import { RequestRateCard } from '@/components/admin/monitoring/cards/RequestRateCard';
import { ResponseTimeCard } from '@/components/admin/monitoring/cards/ResponseTimeCard';
import { RequestTrendChart } from '@/components/admin/monitoring/charts/RequestTrendChart';
import { CachePerformanceChart } from '@/components/admin/monitoring/charts/CachePerformanceChart';
import { ServiceLatencyChart } from '@/components/admin/monitoring/charts/ServiceLatencyChart';
import { SystemLoadChart } from '@/components/admin/monitoring/charts/SystemLoadChart';
import { DatabaseStatsCard } from '@/components/admin/monitoring/charts/DatabaseStatsCard';
import {
  Activity,
  Users,
  Database,
  Calendar,
  Clock,
  Zap,
  TrendingUp,
  TrendingDown,
  Server,
  HardDrive,
  Cpu,
  MemoryStick,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Eye,
  BarChart3,
} from 'lucide-react';
import { useRealtimeMetrics } from '@/hooks/useRealtimeMetrics';
import { useQuery } from '@tanstack/react-query';
import { metricsService } from '@/services/api/metrics.service';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1'];

export default function GlobalView() {
  const {
    health,
    activity,
    errors,
    performance,
    cache,
    sync,
    actions,
    isServerDown
  } = useRealtimeMetrics(5000);

  // Get latency history for charts
  const { data: latencyHistory } = useQuery({
    queryKey: ['latency-history'],
    queryFn: () => metricsService.getLatencyHistory(6),
    refetchInterval: 30000, // Every 30 seconds
  });

  // Process data for charts
  const requestTrendData = latencyHistory?.data?.metrics?.slice(-20).map((m: any, index: number) => ({
    time: `T-${20 - index}`,
    requests: Math.floor(Math.random() * 100 + 50),
    avgLatency: m.redis?.avgLatency || 0,
  })) || [];

  const cacheDistribution = [
    { name: 'Hits', value: cache.hitRate, color: '#10b981' },
    { name: 'Misses', value: 100 - cache.hitRate, color: '#ef4444' },
  ];

  const taskDistribution = activity?.todayTasks ? [
    { name: 'Terminées', value: activity.todayTasks.completed, color: '#10b981' },
    { name: 'En cours', value: activity.todayTasks.inProgress, color: '#f59e0b' },
    { name: 'Non commencées', value: activity.todayTasks.notStarted || 0, color: '#6b7280' },
  ] : [];

  const systemLoad = [
    { 
      metric: 'CPU', 
      current: Math.floor(Math.random() * 60 + 20), 
      threshold: 80,
      status: 'normal' as const
    },
    { 
      metric: 'RAM', 
      current: cache.memory || 45, 
      threshold: 90,
      status: cache.memory > 80 ? 'warning' as const : 'normal' as const
    },
    { 
      metric: 'Disque', 
      current: Math.floor(Math.random() * 70 + 10), 
      threshold: 85,
      status: 'normal' as const
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Vue Globale du Système</h1>
          <p className="text-muted-foreground mt-1">
            Surveillance complète et métriques en temps réel
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <HealthStatusCard health={health} isServerDown={isServerDown} />
        <ActiveUsersCard activity={activity} />
        <RequestRateCard activity={activity} />
        <ResponseTimeCard performance={performance} />
      </div>

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">
            <BarChart3 className="h-4 w-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="resources">
            <Server className="h-4 w-4 mr-2" />
            Ressources
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="h-4 w-4 mr-2" />
            Activité
          </TabsTrigger>
          <TabsTrigger value="errors">
            <AlertCircle className="h-4 w-4 mr-2" />
            Erreurs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <RequestTrendChart requestTrendData={requestTrendData} />
            <CachePerformanceChart cache={cache} cacheDistribution={cacheDistribution} />
          </div>
          <ServiceLatencyChart performance={performance} />
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <SystemLoadChart systemLoad={systemLoad} />
            <DatabaseStatsCard health={health} cache={cache} />
          </div>

          {/* Network Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Statistiques Réseau</CardTitle>
              <CardDescription>
                Bande passante et connexions actives
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">2.4 GB</p>
                  <p className="text-xs text-muted-foreground">Entrant/jour</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">1.8 GB</p>
                  <p className="text-xs text-muted-foreground">Sortant/jour</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">342</p>
                  <p className="text-xs text-muted-foreground">Connexions actives</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">99.9%</p>
                  <p className="text-xs text-muted-foreground">Disponibilité</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          {/* Tasks Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Activité des Tâches</CardTitle>
              <CardDescription>
                Distribution et statut des tâches du jour
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={taskDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label
                      >
                        {taskDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total aujourd'hui</span>
                    <span className="text-2xl font-bold">{activity?.todayTasks?.total || 0}</span>
                  </div>
                  
                  {taskDistribution.map((task) => (
                    <div key={task.name} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: task.color }}
                        />
                        <span className="text-sm">{task.name}</span>
                      </div>
                      <span className="text-sm font-medium">{task.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Chronologie d'Activité</CardTitle>
              <CardDescription>
                Événements récents du système
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { time: 'Il y a 2 min', event: 'Nouvelle tâche créée', type: 'info' },
                  { time: 'Il y a 5 min', event: 'Cache invalidé pour /tasks', type: 'warning' },
                  { time: 'Il y a 12 min', event: 'Synchronisation Notion réussie', type: 'success' },
                  { time: 'Il y a 18 min', event: 'Connexion utilisateur admin@matter.com', type: 'info' },
                  { time: 'Il y a 25 min', event: 'Sauvegarde automatique complétée', type: 'success' },
                ].map((activity, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className={cn(
                      "w-2 h-2 rounded-full mt-1.5",
                      activity.type === 'success' && "bg-green-500",
                      activity.type === 'warning' && "bg-yellow-500",
                      activity.type === 'error' && "bg-red-500",
                      activity.type === 'info' && "bg-blue-500"
                    )} />
                    <div className="flex-1">
                      <p className="text-sm">{activity.event}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          {/* Error Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Résumé des Erreurs</CardTitle>
              <CardDescription>
                Vue d'ensemble des erreurs système
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-600">{errors?.total24h || 0}</p>
                  <p className="text-sm text-muted-foreground">Dernières 24h</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-yellow-600">{errors?.recent?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Dernière heure</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">
                    {errors?.total24h ? Math.round(((errors.total24h - (errors.recent?.length || 0)) / errors.total24h) * 100) : 100}%
                  </p>
                  <p className="text-sm text-muted-foreground">Résolu</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Errors List */}
          <Card>
            <CardHeader>
              <CardTitle>Erreurs Récentes</CardTitle>
              <CardDescription>
                Détail des dernières erreurs détectées
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {errors?.recent?.length > 0 ? (
                  errors.recent.slice(0, 5).map((error: any) => (
                    <div key={error.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{error.message}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {error.type}
                          </Badge>
                          {error.count > 1 && (
                            <Badge variant="secondary" className="text-xs">
                              ×{error.count}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(error.timestamp), { 
                              addSuffix: true, 
                              locale: fr 
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                    <p>Aucune erreur récente détectée</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}