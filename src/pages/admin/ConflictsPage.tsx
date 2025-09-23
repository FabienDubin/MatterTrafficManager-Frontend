import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  GitBranch,
  AlertTriangle,
  Shield,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { conflictsService } from '@/services/api/conflicts.service';

interface Conflict {
  id: string;
  entityType: string;
  entityId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  localData: any;
  remoteData: any;
  detectedAt: string;
  metadata?: {
    fieldsDifferent?: string[];
    localVersion?: number;
    remoteVersion?: number;
  };
}

type ResolutionStrategy = 'local_wins' | 'notion_wins' | 'merged';

export default function ConflictsPage() {
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<Record<string, ResolutionStrategy>>({});
  const [refreshInterval, setRefreshInterval] = useState<number | null>(5000);

  // Load conflicts
  const loadConflicts = async () => {
    try {
      const data = await conflictsService.getConflicts();
      const conflictsList = Array.isArray(data) ? data : [];
      setConflicts(conflictsList);
      
      // Stop auto-refresh if no conflicts
      if (conflictsList.length === 0) {
        setRefreshInterval(null);
      }
    } catch (error) {
      console.error('Failed to load conflicts:', error);
      toast.error('Erreur lors du chargement des conflits');
      setConflicts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConflicts();
  }, []);

  // Auto-refresh when conflicts exist
  useEffect(() => {
    if (!refreshInterval || conflicts.length === 0) return;
    
    const interval = setInterval(loadConflicts, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, conflicts.length]);

  const handleResolve = async (conflictId: string) => {
    const strategy = selectedStrategy[conflictId];
    if (!strategy) {
      toast.error('Veuillez sélectionner une stratégie de résolution');
      return;
    }

    setResolving(conflictId);
    try {
      await conflictsService.resolveConflict(conflictId, strategy);
      toast.success('Conflit résolu avec succès');
      
      // Reload conflicts
      await loadConflicts();
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
      toast.error('Erreur lors de la résolution du conflit');
    } finally {
      setResolving(null);
    }
  };

  const handleResolveAll = async (strategy: ResolutionStrategy) => {
    if (conflicts.length === 0) return;
    
    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir résoudre tous les conflits avec la stratégie "${
        strategy === 'local_wins' ? 'Local gagne' :
        strategy === 'notion_wins' ? 'Notion gagne' :
        'Fusion'
      }" ?`
    );
    
    if (!confirmed) return;
    
    setResolving('all');
    try {
      await conflictsService.resolveAllConflicts(strategy);
      toast.success('Tous les conflits ont été résolus');
      await loadConflicts();
    } catch (error) {
      console.error('Failed to resolve all conflicts:', error);
      toast.error('Erreur lors de la résolution des conflits');
    } finally {
      setResolving(null);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'low':
        return 'bg-green-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'high':
        return 'bg-orange-500';
      case 'critical':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch(severity) {
      case 'low':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'medium':
        return <AlertCircle className="h-4 w-4" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4" />;
      case 'critical':
        return <Shield className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Gestion des Conflits</h1>
        <p className="text-muted-foreground mt-2">
          Résolvez les conflits de synchronisation entre l'application et Notion
        </p>
      </div>

      {/* Summary */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              État des Conflits
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={conflicts.length > 0 ? "destructive" : "secondary"}>
                {conflicts.length} conflit{conflicts.length !== 1 ? 's' : ''}
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={loadConflicts}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {conflicts.length === 0 ? (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Aucun conflit détecté. La synchronisation est à jour.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex gap-4">
                <div className="text-sm">
                  <span className="text-muted-foreground">Critique:</span>{' '}
                  <span className="font-medium">
                    {conflicts.filter(c => c.severity === 'critical').length}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Élevé:</span>{' '}
                  <span className="font-medium">
                    {conflicts.filter(c => c.severity === 'high').length}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Moyen:</span>{' '}
                  <span className="font-medium">
                    {conflicts.filter(c => c.severity === 'medium').length}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Faible:</span>{' '}
                  <span className="font-medium">
                    {conflicts.filter(c => c.severity === 'low').length}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleResolveAll('notion_wins')}
                  disabled={resolving === 'all'}
                >
                  Tout résoudre (Notion gagne)
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conflicts List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : conflicts.length > 0 ? (
        <div className="space-y-4">
          {conflicts.map((conflict) => (
            <Card key={conflict.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge className={getSeverityColor(conflict.severity)}>
                      <span className="flex items-center gap-1">
                        {getSeverityIcon(conflict.severity)}
                        {conflict.severity}
                      </span>
                    </Badge>
                    <div>
                      <h3 className="font-medium">
                        {conflict.entityType} - {conflict.entityId}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {conflict.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Détecté {new Date(conflict.detectedAt).toLocaleString('fr-FR')}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Fields different */}
                {conflict.metadata?.fieldsDifferent && (
                  <div>
                    <p className="text-sm font-medium mb-1">Champs en conflit:</p>
                    <div className="flex flex-wrap gap-1">
                      {conflict.metadata.fieldsDifferent.map((field) => (
                        <Badge key={field} variant="outline">
                          {field}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resolution Strategy */}
                <div>
                  <p className="text-sm font-medium mb-2">Stratégie de résolution:</p>
                  <RadioGroup
                    value={selectedStrategy[conflict.id] || ''}
                    onValueChange={(value: ResolutionStrategy) =>
                      setSelectedStrategy((prev) => ({
                        ...prev,
                        [conflict.id]: value,
                      }))
                    }
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="local_wins" id={`${conflict.id}-local`} />
                      <Label htmlFor={`${conflict.id}-local`}>
                        Local gagne - Garder les modifications locales
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="notion_wins" id={`${conflict.id}-notion`} />
                      <Label htmlFor={`${conflict.id}-notion`}>
                        Notion gagne - Utiliser les données de Notion
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="merged" id={`${conflict.id}-merged`} />
                      <Label htmlFor={`${conflict.id}-merged`}>
                        Fusion - Combiner les modifications (si possible)
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Action Button */}
                <div className="flex justify-end">
                  <Button
                    onClick={() => handleResolve(conflict.id)}
                    disabled={
                      resolving === conflict.id ||
                      resolving === 'all' ||
                      !selectedStrategy[conflict.id]
                    }
                  >
                    {resolving === conflict.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Résolution...
                      </>
                    ) : (
                      'Résoudre le conflit'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            Aucun conflit à résoudre. Le système est synchronisé.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}