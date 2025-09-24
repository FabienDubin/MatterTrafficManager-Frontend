import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Activity,
  Users,
  Database,
  Calendar,
  RefreshCw,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Clock,
  Zap,
} from 'lucide-react';
import { useRealtimeMetrics } from '@/hooks/useRealtimeMetrics';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function AdminDashboard() {
  const {
    health,
    activity,
    errors,
    performance,
    cache,
    sync,
    actions,
    isServerDown
  } = useRealtimeMetrics(5000); // Poll every 5 seconds

  // Service status helpers
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'down': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'operational': return 'Opérationnel';
      case 'degraded': return 'Dégradé';
      case 'down': return 'Hors ligne';
      case 'active': return 'Actif';
      case 'inactive': return 'Inactif';
      default: return 'Inconnu';
    }
  };
  return (
    <div className="space-y-6">
      {/* Header with Quick Actions */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Administration</h1>
          <p className="text-muted-foreground mt-1">
            Vue d'ensemble du système Matter Traffic
          </p>
        </div>
        
        {/* Quick Actions */}
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Cache
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Type de cache</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => actions.clearCacheByType('tasks')}
                disabled={actions.isClearing}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Tâches
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => actions.clearCacheByType('users')}
                disabled={actions.isClearing}
              >
                <Users className="h-4 w-4 mr-2" />
                Utilisateurs
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => actions.clearCacheByType('teams')}
                disabled={actions.isClearing}
              >
                <Users className="h-4 w-4 mr-2" />
                Équipes
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={actions.clearAllCache}
                disabled={actions.isClearing}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Tout vider
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </div>

      {/* Alert if server is down */}
      {isServerDown && (
        <Card className="border-red-500 bg-red-50 dark:bg-red-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              Connexion au serveur perdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Impossible de récupérer les métriques. Vérifiez que le serveur backend est démarré.
            </p>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards with real-time data */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Active Requests */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Activité
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activity ? (
              <>
                <div className="text-2xl font-bold">
                  {activity.requestsPerMinute}
                  <span className="text-sm font-normal text-muted-foreground ml-1">req/min</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {activity.activeUsers} utilisateurs actifs
                </p>
              </>
            ) : (
              <Skeleton className="h-8 w-20" />
            )}
          </CardContent>
        </Card>

        {/* Tasks Today */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Tâches aujourd'hui
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activity?.todayTasks ? (
              <>
                <div className="text-2xl font-bold">{activity.todayTasks.total}</div>
                <p className="text-xs text-muted-foreground">
                  {activity.todayTasks.completed} terminées, {activity.todayTasks.inProgress} en cours
                </p>
              </>
            ) : (
              <Skeleton className="h-8 w-20" />
            )}
          </CardContent>
        </Card>

        {/* Cache Performance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="h-4 w-4" />
              Cache Hit Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {cache.hitRate}%
              {cache.hitRate > 85 ? (
                <TrendingUp className="h-4 w-4 text-green-500 inline ml-2" />
              ) : cache.hitRate < 70 ? (
                <TrendingDown className="h-4 w-4 text-red-500 inline ml-2" />
              ) : null}
            </div>
            <div className="mt-1">
              <Progress value={cache.hitRate} className="h-1" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {cache.totalRequests.toLocaleString()} requêtes totales
            </p>
          </CardContent>
        </Card>

        {/* API Latency */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4" />
              API Latence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performance.avgLatency}ms
              {performance.avgLatency < 100 ? (
                <Badge variant="secondary" className="ml-2 text-xs">
                  Rapide
                </Badge>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">
              p95: {performance.p95Latency}ms | p99: {performance.p99Latency}ms
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Errors / Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Activité récente</span>
              {errors?.total24h > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {errors.total24h} erreurs/24h
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Derniers événements et erreurs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Show recent errors first if any */}
              {errors?.recent?.slice(0, 3).map((error: any) => (
                <div key={error.id} className="flex items-start gap-3">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{error.message}</p>
                    <div className="flex items-center gap-2">
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
              ))}
              
              {/* Sync status */}
              {sync.lastSync && (
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <div className="flex-1">
                    <p className="text-sm">Dernière synchronisation</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(sync.lastSync), { 
                        addSuffix: true, 
                        locale: fr 
                      })}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Queue status if not empty */}
              {sync.queueLength > 0 && (
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <div className="flex-1">
                    <p className="text-sm">{sync.queueLength} éléments en attente</p>
                    <p className="text-xs text-muted-foreground">
                      Synchronisation en cours...
                    </p>
                  </div>
                </div>
              )}

              {/* No recent activity */}
              {!errors?.recent?.length && sync.queueLength === 0 && (
                <div className="text-sm text-muted-foreground text-center py-4">
                  Aucune activité récente
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Services Status with real-time updates */}
        <Card>
          <CardHeader>
            <CardTitle>Statut des services</CardTitle>
            <CardDescription>
              État en temps réel des services critiques
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* API Backend */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">API Backend</span>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "h-2 w-2 rounded-full",
                    getStatusColor(health.api),
                    health.api === 'operational' && 'animate-pulse'
                  )} />
                  <span className={cn(
                    "text-xs",
                    health.api === 'operational' ? 'text-green-600' :
                    health.api === 'down' ? 'text-red-600' : 'text-yellow-600'
                  )}>
                    {getStatusText(health.api)}
                  </span>
                </div>
              </div>

              {/* Redis Cache */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Redis Cache</span>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "h-2 w-2 rounded-full",
                    getStatusColor(health.redis),
                    health.redis === 'operational' && 'animate-pulse'
                  )} />
                  <span className={cn(
                    "text-xs",
                    health.redis === 'operational' ? 'text-green-600' :
                    health.redis === 'down' ? 'text-red-600' : 'text-yellow-600'
                  )}>
                    {getStatusText(health.redis)}
                  </span>
                  {cache.memory > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {cache.memory}% RAM
                    </Badge>
                  )}
                </div>
              </div>

              {/* Notion API */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Notion API</span>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "h-2 w-2 rounded-full",
                    getStatusColor(health.notion),
                    health.notion === 'operational' && 'animate-pulse'
                  )} />
                  <span className={cn(
                    "text-xs",
                    health.notion === 'operational' ? 'text-green-600' :
                    health.notion === 'down' ? 'text-red-600' : 'text-yellow-600'
                  )}>
                    {getStatusText(health.notion)}
                  </span>
                </div>
              </div>

              {/* MongoDB */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">MongoDB</span>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "h-2 w-2 rounded-full",
                    getStatusColor(health.mongodb),
                    health.mongodb === 'operational' && 'animate-pulse'
                  )} />
                  <span className={cn(
                    "text-xs",
                    health.mongodb === 'operational' ? 'text-green-600' :
                    health.mongodb === 'down' ? 'text-red-600' : 'text-yellow-600'
                  )}>
                    {getStatusText(health.mongodb)}
                  </span>
                </div>
              </div>

            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}