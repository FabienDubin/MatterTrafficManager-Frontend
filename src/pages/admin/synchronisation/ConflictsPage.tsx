import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  AlertTriangle,
  CheckCircle,
  XCircle,
  GitBranch,
  Database,
  FileText,
  Clock,
  ChevronRight,
  Shield
} from 'lucide-react';
import { conflictsService, type Conflict } from '@/services/api/conflicts.service';
import { useToast } from '@/hooks/use-toast';

const ConflictsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedConflict, setSelectedConflict] = useState<Conflict | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [page, setPage] = useState(1);

  // Fetch conflicts
  const { data: conflictsData, isLoading } = useQuery({
    queryKey: ['conflicts', filterStatus, filterSeverity, page],
    queryFn: () => {
      const params: any = { page, limit: 20 };
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterSeverity !== 'all') params.severity = filterSeverity;
      
      return conflictsService.getConflicts(params);
    },
  });

  // Fetch conflict stats
  const { data: statsData } = useQuery({
    queryKey: ['conflict-stats'],
    queryFn: conflictsService.getConflictStats,
  });

  // Resolve conflict mutation
  const resolveConflictMutation = useMutation({
    mutationFn: ({ id, strategy, mergedData }: any) => 
      conflictsService.resolveConflict(id, strategy, mergedData),
    onSuccess: () => {
      toast({
        title: 'Succès',
        description: 'Le conflit a été résolu',
      });
      queryClient.invalidateQueries({ queryKey: ['conflicts'] });
      queryClient.invalidateQueries({ queryKey: ['conflict-stats'] });
      setSelectedConflict(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Erreur lors de la résolution',
        variant: 'destructive',
      });
    },
  });

  // Batch resolve mutation
  const batchResolveMutation = useMutation({
    mutationFn: ({ strategy }: { strategy: 'notion_wins' | 'local_wins' }) => {
      const conflictIds = conflicts?.filter((c: Conflict) => c.status === 'pending').map((c: Conflict) => c.id) || [];
      return conflictsService.batchResolveConflicts(conflictIds, strategy);
    },
    onSuccess: (data) => {
      toast({
        title: 'Succès',
        description: `${data.resolved} conflit(s) résolu(s)`,
      });
      queryClient.invalidateQueries({ queryKey: ['conflicts'] });
      queryClient.invalidateQueries({ queryKey: ['conflict-stats'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Erreur lors de la résolution en masse',
        variant: 'destructive',
      });
    },
  });

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'high':
        return <XCircle className="h-4 w-4 text-orange-500" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">Critique</Badge>;
      case 'high':
        return <Badge className="bg-orange-500">Élevé</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500">Moyen</Badge>;
      case 'low':
        return <Badge className="bg-blue-500">Faible</Badge>;
      default:
        return <Badge variant="secondary">Inconnu</Badge>;
    }
  };

  const conflicts = conflictsData?.data?.conflicts || [];
  const stats = statsData?.data;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestion des Conflits</h1>
        <p className="text-muted-foreground">
          Résolvez les conflits entre les données locales et Notion
        </p>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">En attente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.byStatus?.pending || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Résolus</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.byStatus?.resolved || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Critiques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.bySeverity?.critical || 0}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Batch Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres et Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="resolved">Résolus</SelectItem>
                <SelectItem value="failed">Échecs</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Sévérité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="critical">Critique</SelectItem>
                <SelectItem value="high">Élevée</SelectItem>
                <SelectItem value="medium">Moyenne</SelectItem>
                <SelectItem value="low">Faible</SelectItem>
              </SelectContent>
            </Select>

            <div className="ml-auto flex gap-2">
              <Button
                variant="outline"
                onClick={() => batchResolveMutation.mutate({ strategy: 'notion_wins' })}
                disabled={batchResolveMutation.isPending || conflicts.filter((c: Conflict) => c.status === 'pending').length === 0}
              >
                <Database className="mr-2 h-4 w-4" />
                Notion gagne tout
              </Button>
              <Button
                variant="outline"
                onClick={() => batchResolveMutation.mutate({ strategy: 'local_wins' })}
                disabled={batchResolveMutation.isPending || conflicts.filter((c: Conflict) => c.status === 'pending').length === 0}
              >
                <Shield className="mr-2 h-4 w-4" />
                Local gagne tout
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conflicts List */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Conflits</CardTitle>
          <CardDescription>
            Cliquez sur un conflit pour voir les détails et le résoudre
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Chargement...</div>
          ) : conflicts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun conflit trouvé
            </div>
          ) : (
            <div className="space-y-2">
              {conflicts.map((conflict: Conflict) => (
                <div
                  key={conflict.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => setSelectedConflict(conflict)}
                >
                  <div className="flex items-center gap-4">
                    {getSeverityIcon(conflict.severity)}
                    <div>
                      <p className="font-medium">{conflict.entityType} #{conflict.entityId}</p>
                      <p className="text-sm text-muted-foreground">
                        Détecté le {new Date(conflict.detectedAt).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getSeverityBadge(conflict.severity)}
                    {conflict.status === 'resolved' ? (
                      <Badge className="bg-green-500">Résolu</Badge>
                    ) : conflict.status === 'failed' ? (
                      <Badge variant="destructive">Échec</Badge>
                    ) : (
                      <Badge className="bg-yellow-500">En attente</Badge>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Conflict Details */}
      {selectedConflict && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Détails du Conflit</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedConflict(null)}
              >
                Fermer
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="comparison" className="space-y-4">
              <TabsList>
                <TabsTrigger value="comparison">Comparaison</TabsTrigger>
                <TabsTrigger value="local">Données Locales</TabsTrigger>
                <TabsTrigger value="notion">Données Notion</TabsTrigger>
              </TabsList>

              <TabsContent value="comparison" className="space-y-4">
                <Alert>
                  <GitBranch className="h-4 w-4" />
                  <AlertDescription>
                    Les différences entre les versions sont mises en évidence ci-dessous.
                    Choisissez quelle version conserver.
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Version Locale</h4>
                    <pre className="text-xs p-2 bg-muted rounded">
                      {JSON.stringify(selectedConflict.localData, null, 2)}
                    </pre>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Version Notion</h4>
                    <pre className="text-xs p-2 bg-muted rounded">
                      {JSON.stringify(selectedConflict.notionData, null, 2)}
                    </pre>
                  </div>
                </div>

                {selectedConflict.status === 'pending' && (
                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={() => resolveConflictMutation.mutate({
                        id: selectedConflict.id,
                        strategy: 'local_wins',
                      })}
                      disabled={resolveConflictMutation.isPending}
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      Garder Local
                    </Button>
                    <Button
                      onClick={() => resolveConflictMutation.mutate({
                        id: selectedConflict.id,
                        strategy: 'notion_wins',
                      })}
                      disabled={resolveConflictMutation.isPending}
                    >
                      <Database className="mr-2 h-4 w-4" />
                      Garder Notion
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="local">
                <pre className="text-xs p-4 bg-muted rounded overflow-auto max-h-96">
                  {JSON.stringify(selectedConflict.localData, null, 2)}
                </pre>
              </TabsContent>

              <TabsContent value="notion">
                <pre className="text-xs p-4 bg-muted rounded overflow-auto max-h-96">
                  {JSON.stringify(selectedConflict.notionData, null, 2)}
                </pre>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ConflictsPage;