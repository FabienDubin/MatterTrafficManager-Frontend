/**
 * Sync indicator component to show optimistic update status
 * Integrates with the existing badge in the calendar
 */

import { useGlobalSyncState, useOnlineStatus } from '@/hooks/useOptimisticUpdate';
import { useSyncStatus } from '@/hooks/useSyncStatus';
import { Badge } from '@/components/ui/badge';
import { Loader2, WifiOff, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SyncIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

/**
 * Component that shows the current sync state
 * Can be integrated into existing UI elements or used standalone
 */
export function SyncIndicator({ className, showDetails = false }: SyncIndicatorProps) {
  const { isSyncing: localSyncing, hasErrors: localErrors, pendingCount } = useGlobalSyncState();
  const isOnline = useOnlineStatus();
  const { syncStatus, hasConflicts, hasErrors, isSyncing } = useSyncStatus();

  // Use server sync status if available, fallback to local state
  const actualSyncing = syncStatus ? isSyncing : localSyncing;
  const actualErrors = syncStatus ? hasErrors : localErrors;
  const actualPending = syncStatus?.pending || pendingCount;
  const conflictCount = syncStatus?.conflicts || 0;

  // Don't show anything if everything is synced and online
  if (!actualSyncing && !actualErrors && !hasConflicts && isOnline && actualPending === 0) {
    return null;
  }

  // Offline mode - high priority
  if (!isOnline) {
    return (
      <Badge 
        variant="destructive" 
        className={cn("flex items-center gap-1", className)}
      >
        <WifiOff className="h-3 w-3" />
        Mode hors ligne
        {showDetails && (
          <span className="text-xs ml-1">(Lecture seule)</span>
        )}
      </Badge>
    );
  }

  // Build tooltip content with full details
  const tooltipContent = (
    <div className="space-y-1 text-xs">
      <div className="font-medium">État de synchronisation</div>
      {actualPending > 0 && <div>• {actualPending} en attente</div>}
      {syncStatus?.queueDetails?.processed && <div>• {syncStatus.queueDetails.processed} traités</div>}
      {conflictCount > 0 && <div className="text-orange-400">• {conflictCount} conflits</div>}
      {actualErrors && <div className="text-red-400">• {syncStatus?.failed || 0} erreurs</div>}
      {syncStatus?.lastSync && (
        <div className="text-gray-400">
          Dernière sync: {new Date(syncStatus.lastSync).toLocaleTimeString()}
        </div>
      )}
    </div>
  );

  // Conflicts - highest priority
  if (hasConflicts) {
    const badge = (
      <Badge 
        variant="destructive" 
        className={cn("flex items-center gap-1 bg-orange-500 hover:bg-orange-600 cursor-pointer", className)}
      >
        <AlertTriangle className="h-3 w-3" />
        {conflictCount} conflit{conflictCount > 1 ? 's' : ''}
        {showDetails && (
          <span className="text-xs ml-1">(Résolution requise)</span>
        )}
      </Badge>
    );

    return showDetails ? (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent>{tooltipContent}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ) : badge;
  }

  // Has errors
  if (actualErrors) {
    const badge = (
      <Badge 
        variant="destructive" 
        className={cn("flex items-center gap-1 cursor-pointer", className)}
      >
        <AlertCircle className="h-3 w-3" />
        Erreur de sync
        {showDetails && syncStatus?.failed && (
          <span className="text-xs ml-1">({syncStatus.failed} échecs)</span>
        )}
      </Badge>
    );

    return showDetails ? (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent>{tooltipContent}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ) : badge;
  }

  // Syncing in progress
  if (actualSyncing) {
    const badge = (
      <Badge 
        variant="secondary" 
        className={cn("flex items-center gap-1 cursor-pointer", className)}
      >
        <Loader2 className="h-3 w-3 animate-spin" />
        Synchronisation
        {actualPending > 1 && showDetails && (
          <span className="text-xs ml-1">({actualPending} en attente)</span>
        )}
      </Badge>
    );

    return showDetails ? (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent>{tooltipContent}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ) : badge;
  }

  // All synced (briefly show success)
  return (
    <Badge 
      variant="default" 
      className={cn("flex items-center gap-1 bg-green-500", className)}
    >
      <CheckCircle2 className="h-3 w-3" />
      Synchronisé
    </Badge>
  );
}

/**
 * Minimal sync dot indicator for compact spaces
 */
export function SyncDot({ className }: { className?: string }) {
  const { isSyncing: localSyncing, hasErrors: localErrors } = useGlobalSyncState();
  const isOnline = useOnlineStatus();
  const { syncStatus, hasConflicts, hasErrors, isSyncing } = useSyncStatus();

  // Use server status if available
  const actualSyncing = syncStatus ? isSyncing : localSyncing;
  const actualErrors = syncStatus ? hasErrors : localErrors;

  if (!isOnline) {
    return (
      <div 
        className={cn("h-2 w-2 rounded-full bg-red-500", className)}
        title="Mode hors ligne"
      />
    );
  }

  if (hasConflicts) {
    return (
      <div 
        className={cn("h-2 w-2 rounded-full bg-orange-500", className)}
        title={`${syncStatus?.conflicts || 0} conflit(s) à résoudre`}
      />
    );
  }

  if (actualErrors) {
    return (
      <div 
        className={cn("h-2 w-2 rounded-full bg-red-500", className)}
        title="Erreur de synchronisation"
      />
    );
  }

  if (actualSyncing) {
    return (
      <div 
        className={cn("h-2 w-2 rounded-full bg-blue-500 animate-pulse", className)}
        title={`Synchronisation en cours (${syncStatus?.pending || 0} en attente)`}
      />
    );
  }

  return null;
}

/**
 * Hook to manage read-only mode when offline
 */
export function useReadOnlyMode() {
  const isOnline = useOnlineStatus();
  const { isSyncing } = useGlobalSyncState();
  
  // Enable read-only when offline or during critical sync
  const isReadOnly = !isOnline;
  
  // Message to show to user
  const readOnlyMessage = !isOnline 
    ? "Mode hors ligne - Modifications désactivées"
    : isSyncing 
      ? "Synchronisation en cours..."
      : "";
      
  return {
    isReadOnly,
    readOnlyMessage,
    canEdit: isOnline && !isSyncing
  };
}