import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Webhook,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Database,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { webhookService, type WebhookLog, type WebhookStats } from '@/services/api/webhook.service';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const WebhookLogsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [filterEntityType, setFilterEntityType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>({});

  // Fetch webhook logs
  const { data: logsData, isLoading } = useQuery({
    queryKey: ['webhook-logs', page, filterEntityType, filterStatus, dateRange],
    queryFn: () => {
      const params: any = { page, limit: 20 };
      if (filterEntityType !== 'all') {params.entityType = filterEntityType;}
      if (filterStatus !== 'all') {params.status = filterStatus;}
      if (dateRange.start) {params.startDate = dateRange.start;}
      if (dateRange.end) {params.endDate = dateRange.end;}
      
      return webhookService.getLogs(params);
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Test webhook status
  const { data: webhookStatus } = useQuery({
    queryKey: ['webhook-status'],
    queryFn: webhookService.testWebhook,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'partial':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500">Succès</Badge>;
      case 'failed':
        return <Badge variant="destructive">Échec</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-500">Partiel</Badge>;
      default:
        return <Badge variant="secondary">Inconnu</Badge>;
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) {return `${ms}ms`;}
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const logs = logsData?.data?.logs || [];
  const stats = logsData?.data?.stats as WebhookStats;
  const pagination = logsData?.data?.pagination;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Journaux des Webhooks</h1>
        <p className="text-muted-foreground">
          Historique des événements webhook reçus de Notion
        </p>
      </div>

      {/* Webhook Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Webhook className="h-5 w-5" />
              <div>
                <CardTitle>État du Webhook</CardTitle>
                <CardDescription>Configuration et activité récente</CardDescription>
              </div>
            </div>
            {webhookStatus?.configured ? (
              <Badge className="bg-green-500">Configuré</Badge>
            ) : (
              <Badge variant="destructive">Non configuré</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Token</p>
              <p className="font-medium">
                {webhookStatus?.tokenValid ? 'Valide' : 'Invalide'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Activité récente</p>
              <p className="font-medium">
                {webhookStatus?.recentActivity ? 'Oui' : 'Non'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Dernier webhook</p>
              <p className="font-medium">
                {webhookStatus?.lastWebhookAt
                  ? format(new Date(webhookStatus.lastWebhookAt), 'PPp', { locale: fr })
                  : 'N/A'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Statut global</p>
              <p className="font-medium capitalize">{webhookStatus?.status || 'unknown'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total des webhooks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Succès</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.byStatus?.success?.count || 0}
              </div>
              {stats.byStatus?.success?.avgDuration && (
                <p className="text-xs text-muted-foreground">
                  Moy: {formatDuration(stats.byStatus.success.avgDuration)}
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Échecs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.byStatus?.failed?.count || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Partiels</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.byStatus?.partial?.count || 0}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Select value={filterEntityType} onValueChange={setFilterEntityType}>
              <SelectTrigger>
                <SelectValue placeholder="Type d'entité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="Task">Tâches</SelectItem>
                <SelectItem value="Project">Projets</SelectItem>
                <SelectItem value="Member">Membres</SelectItem>
                <SelectItem value="Team">Équipes</SelectItem>
                <SelectItem value="Client">Clients</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="success">Succès</SelectItem>
                <SelectItem value="failed">Échec</SelectItem>
                <SelectItem value="partial">Partiel</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative">
              <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                placeholder="Date début"
                className="pl-8"
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              />
            </div>

            <div className="relative">
              <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                placeholder="Date fin"
                className="pl-8"
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              />
            </div>

            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des Webhooks</CardTitle>
          <CardDescription>
            Liste détaillée des webhooks reçus et traités
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Chargement...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun log de webhook trouvé
            </div>
          ) : (
            <div className="space-y-2">
              {logs
                .filter((log: WebhookLog) =>
                  searchTerm
                    ? log.webhookEventId?.includes(searchTerm) ||
                      log.entityType.toLowerCase().includes(searchTerm.toLowerCase())
                    : true
                )
                .map((log: WebhookLog) => (
                  <div
                    key={log._id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {getStatusIcon(log.syncStatus)}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{log.entityType}</p>
                          <Badge variant="outline">
                            <Database className="mr-1 h-3 w-3" />
                            {log.databaseId.slice(0, 8)}...
                          </Badge>
                          {log.webhookEventId && (
                            <Badge variant="outline">
                              ID: {log.webhookEventId.slice(0, 8)}...
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(log.createdAt), 'PPp', { locale: fr })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm">
                          {log.itemsProcessed} traité(s), {log.itemsFailed} échec(s)
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Durée: {formatDuration(log.duration)}
                        </p>
                      </div>
                      {getStatusBadge(log.syncStatus)}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} sur {pagination.totalPages} ({pagination.total} résultats)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === pagination.totalPages}
                >
                  Suivant
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WebhookLogsPage;