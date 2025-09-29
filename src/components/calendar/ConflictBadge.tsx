import { TaskConflict } from '@/types/task.types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface ConflictBadgeProps {
  conflicts: TaskConflict[];
  className?: string;
}

export function ConflictBadge({ conflicts, className }: ConflictBadgeProps) {
  if (!conflicts || conflicts.length === 0) {
    return null;
  }

  // Prendre le conflit le plus sévère
  const mostSevereConflict = conflicts.reduce((prev, current) => {
    const severityOrder = { high: 3, medium: 2, low: 1 };
    return (severityOrder[current.severity] || 0) > (severityOrder[prev.severity] || 0) 
      ? current 
      : prev;
  }, conflicts[0]);

  // Emoji selon le type de conflit
  const getConflictEmoji = (type: TaskConflict['type']): string => {
    switch (type) {
      case 'overlap':
        return '⚠️';
      case 'holiday':
        return '🚨';
      case 'school':
        return '📚';
      case 'overload':
        return '⏰';
      default:
        return '⚠️';
    }
  };

  const emoji = getConflictEmoji(mostSevereConflict.type);
  
  // Créer le message de tooltip avec tous les conflits
  const tooltipContent = (
    <div className="space-y-1 text-xs">
      <div className="font-semibold">Conflits détectés :</div>
      {conflicts.map((conflict, index) => (
        <div key={index} className="flex items-start gap-1">
          <span>{getConflictEmoji(conflict.type)}</span>
          <span>{conflict.message}</span>
        </div>
      ))}
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <div 
            className={cn(
              "absolute -top-1 -right-1 z-50",
              "bg-white dark:bg-gray-900 rounded-full",
              "w-5 h-5 flex items-center justify-center",
              "shadow-sm border border-border",
              "cursor-help",
              className
            )}
          >
            <span className="text-xs leading-none">{emoji}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}