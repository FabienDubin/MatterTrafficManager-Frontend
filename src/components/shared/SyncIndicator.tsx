/**
 * Sync indicator component to show optimistic update status
 * Integrates with the existing badge in the calendar
 */

import { useGlobalSyncState, useOnlineStatus } from '@/hooks/useOptimisticUpdate';
import { Badge } from '@/components/ui/badge';
import { Loader2, WifiOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SyncIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

/**
 * Component that shows the current sync state
 * Can be integrated into existing UI elements or used standalone
 */
export function SyncIndicator({ className, showDetails = false }: SyncIndicatorProps) {
  const { isSyncing, hasErrors, pendingCount } = useGlobalSyncState();
  const isOnline = useOnlineStatus();

  // Don't show anything if everything is synced and online
  if (!isSyncing && !hasErrors && isOnline && pendingCount === 0) {
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

  // Syncing in progress
  if (isSyncing) {
    return (
      <Badge 
        variant="secondary" 
        className={cn("flex items-center gap-1", className)}
      >
        <Loader2 className="h-3 w-3 animate-spin" />
        Synchronisation
        {pendingCount > 1 && showDetails && (
          <span className="text-xs ml-1">({pendingCount} modifications)</span>
        )}
      </Badge>
    );
  }

  // Has errors
  if (hasErrors) {
    return (
      <Badge 
        variant="destructive" 
        className={cn("flex items-center gap-1", className)}
      >
        <AlertCircle className="h-3 w-3" />
        Erreur de sync
        {showDetails && (
          <span className="text-xs ml-1">(Voir notifications)</span>
        )}
      </Badge>
    );
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
  const { isSyncing, hasErrors } = useGlobalSyncState();
  const isOnline = useOnlineStatus();

  if (!isOnline) {
    return (
      <div 
        className={cn("h-2 w-2 rounded-full bg-red-500", className)}
        title="Mode hors ligne"
      />
    );
  }

  if (hasErrors) {
    return (
      <div 
        className={cn("h-2 w-2 rounded-full bg-red-500", className)}
        title="Erreur de synchronisation"
      />
    );
  }

  if (isSyncing) {
    return (
      <div 
        className={cn("h-2 w-2 rounded-full bg-blue-500 animate-pulse", className)}
        title="Synchronisation en cours"
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