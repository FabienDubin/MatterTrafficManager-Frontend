import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { apiService as api } from '@/services/api';
import { Area, AreaChart, Bar, BarChart, Line, LineChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { 
  RefreshCcw, 
  Activity, 
  Database, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Trash2,
  PlayCircle,
  PauseCircle
} from 'lucide-react';

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  components: {
    mongodb: any;
    synchronization: any;
    jobs: any;
    cache: any;
  };
}

interface SyncStats {
  success: boolean;
  period: string;
  totalSyncs: number;
  successRate: number;
  entityStats: Record<string, number>;
  errorStats: any;
  performanceStats: any[];
  recentSyncs: any[];
}

interface SyncProgress {
  entityType: string;
  phase: 'import' | 'denormalization';
  progress: {
    current: number;
    total: number;
  };
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

const SyncMonitoring: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [syncStats, setSyncStats] = useState<SyncStats | null>(null);
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [jobStatus, setJobStatus] = useState<any>(null);
  const [circuitBreakers, setCircuitBreakers] = useState<any[]>([]);
  const [syncProgress, setSyncProgress] = useState<SyncProgress[]>([]);
  const [queueStatus, setQueueStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [resetInProgress, setResetInProgress] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 30000); // Refresh every 30s
    
    // Faster refresh if sync in progress
    const progressInterval = setInterval(() => {
      if (syncProgress.some(p => p.status === 'processing')) {
        fetchSyncProgress();
      }
    }, 2000);
    
    return () => {
      clearInterval(interval);
      clearInterval(progressInterval);
    };
  }, [syncProgress]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchHealth(),
        fetchSyncStats(),
        fetchCacheStats(),
        fetchJobStatus(),
        fetchCircuitBreakers(),
        fetchSyncProgress(),
        fetchQueueStatus()
      ]);
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données de monitoring',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchHealth = async () => {
    const response = await api.get('/monitoring/health');
    setHealth(response.data);
  };

  const fetchSyncStats = async () => {
    const response = await api.get('/monitoring/sync/stats');
    setSyncStats(response.data);
  };

  const fetchCacheStats = async () => {
    const response = await api.get('/monitoring/cache/stats');
    setCacheStats(response.data);
  };

  const fetchJobStatus = async () => {
    const response = await api.get('/monitoring/jobs/status');
    setJobStatus(response.data);
  };

  const fetchCircuitBreakers = async () => {
    const response = await api.get('/monitoring/circuit-breakers');
    setCircuitBreakers(response.data.circuitBreakers || []);
  };

  const fetchSyncProgress = async () => {
    try {
      const response = await api.get('/sync/progress');
      if (response.data.progress) {
        setSyncProgress(response.data.progress);
      }
    } catch (error) {
      console.error('Failed to fetch sync progress:', error);
    }
  };

  const fetchQueueStatus = async () => {
    try {
      const response = await api.get('/monitoring/queue/status');
      setQueueStatus(response.data);
    } catch (error) {
      console.error('Failed to fetch queue status:', error);
    }
  };

  const resetCache = async (collection: string) => {
    try {
      setResetInProgress(collection);
      await api.delete(`/sync/cache/${collection}`);
      toast({
        title: 'Cache réinitialisé',
        description: `Le cache ${collection} a été purgé et la resynchronisation est en cours`
      });
      fetchAllData();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: `Impossible de réinitialiser le cache ${collection}`,
        variant: 'destructive'
      });
    } finally {
      setResetInProgress(null);
    }
  };

  const pauseQueue = async () => {
    try {
      await api.post('/monitoring/queue/pause');
      toast({
        title: 'Queue mise en pause',
        description: 'Le traitement des jobs a été suspendu'
      });
      fetchQueueStatus();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre en pause la queue',
        variant: 'destructive'
      });
    }
  };

  const resumeQueue = async () => {
    try {
      await api.post('/monitoring/queue/resume');
      toast({
        title: 'Queue reprise',
        description: 'Le traitement des jobs a repris'
      });
      fetchQueueStatus();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de reprendre la queue',
        variant: 'destructive'
      });
    }
  };

  const triggerReconciliation = async () => {
    try {
      setRefreshing(true);
      await api.post('/monitoring/reconciliation/trigger');
      toast({
        title: 'Réconciliation lancée',
        description: 'La réconciliation a été démarrée en arrière-plan'
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de lancer la réconciliation',
        variant: 'destructive'
      });
    } finally {
      setRefreshing(false);
    }
  };

  const triggerSync = async (entityType: string) => {
    try {
      await api.post('/sync/trigger', { entityType });
      toast({
        title: 'Synchronisation lancée',
        description: `Synchronisation de ${entityType} démarrée`
      });
      fetchAllData();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: `Impossible de synchroniser ${entityType}`,
        variant: 'destructive'
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'unhealthy':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      healthy: 'default',
      degraded: 'secondary',
      unhealthy: 'destructive',
      success: 'default',
      failed: 'destructive',
      partial: 'secondary',
      open: 'destructive',
      closed: 'default'
    };

    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  if (loading && !health) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCcw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Monitoring de Synchronisation</h1>
        <Button onClick={fetchAllData} disabled={refreshing}>
          <RefreshCcw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Sync Progress Bars */}
      {syncProgress.length > 0 && syncProgress.some(p => p.status === 'processing') && (
        <Card>
          <CardHeader>
            <CardTitle>Synchronisation en cours</CardTitle>
            <CardDescription>Progression de la synchronisation des données</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {syncProgress.map((progress) => (
              <div key={progress.entityType} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{progress.entityType}</span>
                  <span className="text-muted-foreground">
                    Phase: {progress.phase === 'import' ? 'Import (1/2)' : 'Dénormalisation (2/2)'}
                  </span>
                </div>
                <Progress 
                  value={(progress.progress.current / progress.progress.total) * 100} 
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{progress.progress.current} / {progress.progress.total} items</span>
                  <span>{Math.round((progress.progress.current / progress.progress.total) * 100)}%</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {health && Object.entries(health.components).map(([key, component]: [string, any]) => (
          <Card key={key}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium capitalize">
                  {key}
                </CardTitle>
                {getStatusIcon(component.status)}
              </div>
            </CardHeader>
            <CardContent>
              {getStatusBadge(component.status)}
              {component.latency && (
                <p className="text-sm text-gray-500 mt-2">
                  Latence: {component.latency}ms
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="sync" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sync">Synchronisation</TabsTrigger>
          <TabsTrigger value="cache">Cache</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="circuit">Circuit Breakers</TabsTrigger>
        </TabsList>

        {/* Sync Tab */}
        <TabsContent value="sync" className="space-y-4">
          {syncStats && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Taux de Réussite</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{syncStats.successRate}%</div>
                    <p className="text-sm text-gray-500">
                      {syncStats.totalSyncs} synchronisations
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Entités Synchronisées</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {Object.entries(syncStats.entityStats).map(([entity, count]) => (
                      <div key={entity} className="flex justify-between">
                        <span className="text-sm">{entity}:</span>
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button 
                      onClick={triggerReconciliation}
                      className="w-full"
                      variant="outline"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Réconciliation Manuelle
                    </Button>
                    {queueStatus && (
                      <Button
                        onClick={queueStatus.paused ? resumeQueue : pauseQueue}
                        className="w-full"
                        variant="outline"
                      >
                        {queueStatus.paused ? (
                          <><PlayCircle className="w-4 h-4 mr-2" /> Reprendre la Queue</>
                        ) : (
                          <><PauseCircle className="w-4 h-4 mr-2" /> Mettre en Pause</>
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sync Performance Chart */}
              {syncStats.performanceStats && syncStats.performanceStats.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Performance de Synchronisation</CardTitle>
                    <CardDescription>Temps de traitement par entité (derniers 7 jours)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        Task: { label: 'Tasks', color: 'hsl(var(--chart-1))' },
                        Project: { label: 'Projects', color: 'hsl(var(--chart-2))' },
                        Member: { label: 'Members', color: 'hsl(var(--chart-3))' },
                        Team: { label: 'Teams', color: 'hsl(var(--chart-4))' },
                        Client: { label: 'Clients', color: 'hsl(var(--chart-5))' },
                      }}
                      className="h-[300px]"
                    >
                      <AreaChart data={syncStats.performanceStats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Area type="monotone" dataKey="duration" stroke="var(--color-Task)" fill="var(--color-Task)" />
                      </AreaChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              )}

              {/* Recent Syncs Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Synchronisations Récentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Méthode</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Traités</TableHead>
                        <TableHead>Échoués</TableHead>
                        <TableHead>Durée</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {syncStats.recentSyncs.map((sync, index) => (
                        <TableRow key={index}>
                          <TableCell>{sync.entityType}</TableCell>
                          <TableCell>{sync.syncMethod}</TableCell>
                          <TableCell>{getStatusBadge(sync.syncStatus)}</TableCell>
                          <TableCell>{sync.itemsProcessed || 0}</TableCell>
                          <TableCell>{sync.itemsFailed || 0}</TableCell>
                          <TableCell>{sync.duration ? `${sync.duration}ms` : '-'}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => triggerSync(sync.entityType)}
                            >
                              <RefreshCcw className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Cache Tab */}
        <TabsContent value="cache" className="space-y-4">
          {cacheStats?.cache && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(cacheStats.cache).map(([key, stats]: [string, any]) => (
                  key !== 'hitRate' && (
                    <Card key={key}>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <CardTitle className="capitalize">{key}</CardTitle>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                disabled={resetInProgress === key}
                              >
                                {resetInProgress === key ? (
                                  <RefreshCcw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Réinitialiser le cache {key} ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Cette action va supprimer {stats.total} entrées du cache et relancer une synchronisation complète depuis Notion.
                                  L'opération peut prendre plusieurs minutes.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction onClick={() => resetCache(key)}>
                                  Réinitialiser
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Total:</span>
                            <span className="font-medium">{stats.total}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">En cache:</span>
                            <span className="font-medium">{stats.cached}</span>
                          </div>
                          {stats.expired !== undefined && (
                            <div className="flex justify-between">
                              <span className="text-sm">Expirés:</span>
                              <span className="font-medium">{stats.expired}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                ))}
              </div>
              
              {/* Cache Hit Rate Chart */}
              {cacheStats.hitRate && (
                <Card>
                  <CardHeader>
                    <CardTitle>Taux de Cache Hit</CardTitle>
                    <CardDescription>Performance du cache sur les dernières 24h</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        hitRate: { label: 'Hit Rate', color: 'hsl(var(--chart-1))' },
                      }}
                      className="h-[200px]"
                    >
                      <LineChart data={cacheStats.hitRate}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line type="monotone" dataKey="rate" stroke="var(--color-hitRate)" />
                      </LineChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Jobs Tab */}
        <TabsContent value="jobs" className="space-y-4">
          {jobStatus?.jobs && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Jobs de Polling</CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.entries(jobStatus.jobs.polling || {}).map(([entity, job]: [string, any]) => (
                    <div key={entity} className="flex justify-between py-2">
                      <span className="text-sm">{entity}</span>
                      <div className="flex items-center gap-2">
                        {job.running ? (
                          <Badge variant="default">Actif</Badge>
                        ) : (
                          <Badge variant="secondary">Inactif</Badge>
                        )}
                        {job.nextDate && (
                          <span className="text-xs text-gray-500">
                            {new Date(job.nextDate).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Job de Réconciliation</CardTitle>
                </CardHeader>
                <CardContent>
                  {jobStatus.jobs.reconciliation && (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Statut:</span>
                        {jobStatus.jobs.reconciliation.running ? (
                          <Badge variant="default">Actif</Badge>
                        ) : (
                          <Badge variant="secondary">Inactif</Badge>
                        )}
                      </div>
                      {jobStatus.jobs.reconciliation.nextDate && (
                        <div className="flex justify-between">
                          <span>Prochaine exécution:</span>
                          <span className="text-sm">
                            {new Date(jobStatus.jobs.reconciliation.nextDate).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Circuit Breakers Tab */}
        <TabsContent value="circuit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>État des Circuit Breakers</CardTitle>
              <CardDescription>
                Protection contre les échecs en cascade
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entité</TableHead>
                    <TableHead>État</TableHead>
                    <TableHead>Échecs</TableHead>
                    <TableHead>Seuil</TableHead>
                    <TableHead>Réouverture</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {circuitBreakers.map((cb) => (
                    <TableRow key={cb.entityType}>
                      <TableCell>{cb.entityType}</TableCell>
                      <TableCell>{getStatusBadge(cb.status)}</TableCell>
                      <TableCell>{cb.failureCount}</TableCell>
                      <TableCell>{cb.threshold}</TableCell>
                      <TableCell>
                        {cb.reopenAt ? new Date(cb.reopenAt).toLocaleTimeString() : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SyncMonitoring;