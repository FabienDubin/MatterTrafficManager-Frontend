/**
 * Sync indicator component to show optimistic update status
 * Integrates with the existing badge in the calendar
 */

import { useGlobalSyncState, useOnlineStatus } from '@/hooks/useOptimisticUpdate';
import { useSyncStatus } from '@/hooks/useSyncStatus';
import { Badge } from '@/components/ui/badge';
import { Loader2, WifiOff, AlertCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { useMemo } from 'react';

interface SyncIndicatorProps {
  className?: string;
  showDetails?: boolean;
  // Additional props for unified indicator
  tasksCount?: number;
  isLoadingBackground?: boolean;
  hasPendingLocalUpdates?: boolean;
  lastRefresh?: Date | null;
  nextRefresh?: Date | null;
  loadedRangesCount?: number;
  onRefresh?: () => void;
}

/**
 * Component that shows the current sync state with carousel animation
 */
export function SyncIndicator({ 
  className,
  tasksCount,
  isLoadingBackground,
  hasPendingLocalUpdates,
  lastRefresh,
  nextRefresh,
  loadedRangesCount,
  onRefresh
}: SyncIndicatorProps) {
  const { isSyncing: localSyncing, hasErrors: localErrors, pendingCount } = useGlobalSyncState();
  const isOnline = useOnlineStatus();
  const { syncStatus, hasConflicts, hasErrors, isSyncing, isServerDown } = useSyncStatus();

  // Determine actual states considering server availability
  const actualSyncing = !isServerDown && (syncStatus ? isSyncing : localSyncing);
  const actualErrors = !isServerDown && (syncStatus ? hasErrors : localErrors);
  const actualPending = syncStatus?.pending || pendingCount;
  const conflictCount = syncStatus?.conflicts || 0;

  // Unified display mode - always show something if we have data
  const hasAnyData = tasksCount !== undefined || lastRefresh || loadedRangesCount;
  
  // Don't show anything if everything is synced and online (legacy mode)
  if (!hasAnyData && !actualSyncing && !actualErrors && !hasConflicts && isOnline && actualPending === 0 && !isServerDown) {
    return null;
  }
  
  // Determine if we should show a badge (priority status) or carousel (normal mode)
  const hasActiveBadge = isServerDown || !isOnline || hasConflicts || actualErrors || actualSyncing || hasPendingLocalUpdates;
  
  // Build carousel messages
  const carouselMessages = useMemo(() => {
    const messages: string[] = [];
    
    // Show loading first if it's happening
    if (isLoadingBackground) {
      messages.push('Chargement en cours...');
    }
    
    if (tasksCount !== undefined) {
      messages.push(`${tasksCount} tâche${tasksCount !== 1 ? 's' : ''} trouvée${tasksCount !== 1 ? 's' : ''}`);
    }
    if (lastRefresh) {
      messages.push(`Dernière MAJ: ${lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`);
    }
    
    return messages.length > 0 ? messages : ['Aucune donnée'];
  }, [tasksCount, lastRefresh, isLoadingBackground]);

  // Build tooltip content for badges
  const badgeTooltipContent = useMemo(() => {
    const lines: string[] = [];
    if (tasksCount !== undefined) {
      lines.push(`${tasksCount} tâche${tasksCount !== 1 ? 's' : ''} trouvée${tasksCount !== 1 ? 's' : ''}`);
    }
    if (lastRefresh) {
      lines.push(`Dernière MAJ: ${lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`);
    }
    if (nextRefresh) {
      lines.push(`Prochaine sync: ${nextRefresh.toLocaleTimeString('fr-FR')}`);
    }
    if (actualPending > 0) {
      lines.push(`${actualPending} opération${actualPending > 1 ? 's' : ''} en attente`);
    }
    if (conflictCount > 0) {
      lines.push(`${conflictCount} conflit${conflictCount > 1 ? 's' : ''} à résoudre`);
    }
    return lines;
  }, [tasksCount, lastRefresh, nextRefresh, actualPending, conflictCount]);

  // Render badge for active states
  const renderBadge = () => {
    let badge = null;
    
    // Server down - highest priority
    if (isServerDown) {
      badge = (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Serveur inaccessible
        </Badge>
      );
    }
    // Network offline
    else if (!isOnline) {
      badge = (
        <Badge variant="destructive" className="flex items-center gap-1">
          <WifiOff className="h-3 w-3" />
          Mode hors ligne
        </Badge>
      );
    }
    // Conflicts
    else if (hasConflicts) {
      badge = (
        <Badge variant="destructive" className="flex items-center gap-1 bg-orange-500 hover:bg-orange-600">
          <AlertTriangle className="h-3 w-3" />
          {conflictCount} conflit{conflictCount > 1 ? 's' : ''}
        </Badge>
      );
    }
    // Errors
    else if (actualErrors) {
      badge = (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Erreur de sync
        </Badge>
      );
    }
    // Syncing
    else if (actualSyncing || hasPendingLocalUpdates) {
      badge = (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Synchronisation
          {actualPending > 1 && (
            <span className="text-xs ml-1">({actualPending})</span>
          )}
        </Badge>
      );
    }
    
    if (badge && badgeTooltipContent.length > 0) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>{badge}</div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <div className="space-y-1">
                {badgeTooltipContent.map((line, i) => (
                  <div key={i} className="text-xs">{line}</div>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    
    return badge;
  };

  // Render carousel for normal state
  const renderCarousel = () => {
    const messageCount = carouselMessages.length;
    const carouselClass = messageCount === 2 ? 'sync-carousel-2' : 'sync-carousel-3';

    // Duplicate first message at the end for smooth loop (if we have 2 messages)
    const displayMessages = messageCount === 2
      ? [...carouselMessages, carouselMessages[0]] // For 2 messages, add the first one at the end
      : [...carouselMessages]; // For 3 messages, use as is

    const carouselContent = (
      <div className="h-[28px] overflow-hidden relative cursor-default select-none">
        <div className={carouselClass}>
          {displayMessages.map((message, i) => (
            <div key={i} className="h-[28px] flex items-center text-xs text-muted-foreground whitespace-nowrap">
              {message || '\u00A0'} {/* Non-breaking space for empty messages */}
            </div>
          ))}
        </div>
      </div>
    );
    
    if (nextRefresh) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>{carouselContent}</div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Prochaine actualisation: {nextRefresh.toLocaleTimeString('fr-FR')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    
    return carouselContent;
  };

  // Main render
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Show badge or carousel based on state */}
      {hasActiveBadge ? renderBadge() : renderCarousel()}
      
      {/* Refresh button - always visible */}
      {onRefresh && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onRefresh}
          disabled={isLoadingBackground}
          className="h-[28px] w-[28px]"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isLoadingBackground && "animate-spin")} />
          <span className="sr-only">Actualiser</span>
        </Button>
      )}
    </div>
  );
}

/**
 * Minimal sync dot indicator for compact spaces
 */
export function SyncDot({ className }: { className?: string }) {
  const { isSyncing: localSyncing, hasErrors: localErrors } = useGlobalSyncState();
  const isOnline = useOnlineStatus();
  const { syncStatus, hasConflicts, hasErrors, isSyncing, isServerDown } = useSyncStatus();

  // Determine actual states considering server availability
  const actualSyncing = !isServerDown && (syncStatus ? isSyncing : localSyncing);
  const actualErrors = !isServerDown && (syncStatus ? hasErrors : localErrors);

  if (isServerDown) {
    return (
      <div 
        className={cn("h-2 w-2 rounded-full bg-red-500", className)}
        title="Serveur inaccessible"
      />
    );
  }

  if (!isOnline) {
    return (
      <div 
        className={cn("h-2 w-2 rounded-full bg-orange-500", className)}
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