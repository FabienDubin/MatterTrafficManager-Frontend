import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface TTIndicatorProps {
  memberName?: string;
  className?: string;
  position?: 'absolute' | 'relative';
}

export function TTIndicator({ 
  memberName, 
  className,
  position = 'absolute'
}: TTIndicatorProps) {
  const tooltipMessage = memberName 
    ? `${memberName} est en télétravail` 
    : 'Télétravail';

  if (position === 'absolute') {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <div 
              className={cn(
                "absolute -top-1 -left-1 z-40",
                className
              )}
            >
              <Badge 
                variant="outline" 
                className="px-1 py-0 text-[9px] bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
              >
                TT
              </Badge>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-xs">{tooltipMessage}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Version inline pour les colonnes
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "ml-1 px-1 py-0 text-[9px] bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300",
        className
      )}
      title={tooltipMessage}
    >
      TT
    </Badge>
  );
}