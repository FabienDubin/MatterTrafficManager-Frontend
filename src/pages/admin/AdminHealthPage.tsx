import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { monitoringService } from '@/services/api/monitoring.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Activity, CheckCircle2, XCircle, Clock, Server, Database as DatabaseIcon, Webhook, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function AdminHealthPage() {
  const navigate = useNavigate();
  
  const { data: health, isLoading, error, refetch } = useQuery({
    queryKey: ['healthStatus'],
    queryFn: () => monitoringService.getHealthStatus(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const formatUptime = (seconds?: number) => {
    if (!seconds) return '-';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}j ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getStatusColor = (status?: string) => {
    switch(status?.toLowerCase()) {
      case 'healthy':
      case 'connected':
      case 'ok':
        return 'bg-green-500';
      case 'degraded':
      case 'warning':
      case 'stale':
      case 'waiting':
        return 'bg-yellow-500';
      case 'unhealthy':
      case 'disconnected':
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch(status?.toLowerCase()) {
      case 'healthy':
      case 'connected':
      case 'ok':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'stale':
      case 'waiting':
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'unhealthy':
      case 'disconnected':
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const getServiceStatus = (service: any) => {
    if (!service) return { label: 'Inconnu', variant: 'secondary' as const };
    
    const status = service.status?.toLowerCase();
    switch(status) {
      case 'healthy':
        return { label: 'Opérationnel', variant: 'default' as const };
      case 'stale':
        return { label: 'Périmé', variant: 'outline' as const };
      case 'waiting':
        return { label: 'En attente', variant: 'secondary' as const };
      case 'unhealthy':
      case 'error':
        return { label: 'Erreur', variant: 'destructive' as const };
      default:
        return { label: status || 'Inconnu', variant: 'secondary' as const };
    }
  };

  const formatLastWebhook = (webhook: any) => {
    if (!webhook?.lastReceived) return 'Jamais reçu';
    if (webhook.lastReceived === 'never') return 'Jamais reçu';
    
    const date = new Date(webhook.lastReceived);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    if (diffHours > 0) return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
    return 'Il y a moins d\'une heure';
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
            Erreur lors du chargement du statut de santé
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">État de santé du système</h1>
          <p className="text-gray-500 mt-1">Surveillance de l'état des services</p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          Rafraîchir
        </Button>
      </div>

      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(health?.status)}
            État général
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-lg">Statut du système</span>
            <Badge className={getStatusColor(health?.status)}>
              {health?.status || 'Unknown'}
            </Badge>
          </div>
          {health?.message && (
            <p className="text-sm text-muted-foreground">{health.message}</p>
          )}
        </CardContent>
      </Card>

      {/* System Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Server className="h-4 w-4" />
              Version
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{health?.version || 'N/A'}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Uptime
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatUptime(health?.uptime)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Dernière vérification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {health?.timestamp ? new Date(health.timestamp).toLocaleTimeString() : 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Webhook Alert */}
      {(health as any)?.services?.webhooks?.status === 'stale' && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Webhook périmé</AlertTitle>
          <AlertDescription>
            Aucun webhook reçu depuis plus de 24 heures. Dernier webhook: {formatLastWebhook((health as any)?.services?.webhooks)}
          </AlertDescription>
        </Alert>
      )}

      {/* Services Status */}
      <Card>
        <CardHeader>
          <CardTitle>État des services</CardTitle>
          <CardDescription>
            Statut de connexion des services critiques
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* MongoDB Status */}
          {(health as any)?.services?.mongodb && (
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <DatabaseIcon className="h-5 w-5" />
                <div>
                  <p className="font-medium">Base de données</p>
                  <p className="text-sm text-muted-foreground">MongoDB</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon((health as any).services.mongodb.status)}
                <Badge variant={getServiceStatus((health as any).services.mongodb).variant}>
                  {getServiceStatus((health as any).services.mongodb).label}
                </Badge>
              </div>
            </div>
          )}

          {/* Redis Status */}
          {(health as any)?.services?.redis && (
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Server className="h-5 w-5" />
                <div>
                  <p className="font-medium">Cache Redis</p>
                  <p className="text-sm text-muted-foreground">Upstash Redis</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon((health as any).services.redis.status)}
                <Badge variant={getServiceStatus((health as any).services.redis).variant}>
                  {getServiceStatus((health as any).services.redis).label}
                </Badge>
              </div>
            </div>
          )}

          {/* Webhooks Status */}
          {(health as any)?.services?.webhooks && (
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Webhook className="h-5 w-5" />
                <div>
                  <p className="font-medium">Webhooks Notion</p>
                  <p className="text-sm text-muted-foreground">
                    {formatLastWebhook((health as any).services.webhooks)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon((health as any).services.webhooks.status)}
                <Badge variant={getServiceStatus((health as any).services.webhooks).variant}>
                  {getServiceStatus((health as any).services.webhooks).label}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>
            Navigation et diagnostics
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
            Métriques système
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