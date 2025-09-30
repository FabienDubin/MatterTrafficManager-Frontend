import React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface BadgeInfo {
  emoji: string;
  name: string;
  type: string;
}

interface CalendarHeaderBadgesProps {
  badges: BadgeInfo[];
  maxVisible?: number;
}

export const CalendarHeaderBadges: React.FC<CalendarHeaderBadgesProps> = ({
  badges,
  maxVisible = 3,
}) => {
  if (badges.length === 0) {
    return null;
  }

  const visibleBadges = badges.slice(0, maxVisible);
  const hiddenCount = badges.length - maxVisible;
  const hiddenBadges = badges.slice(maxVisible);

  return (
    <TooltipProvider>
      <div className="inline-flex flex-row items-center justify-center gap-0.5 text-[0.65rem]">
        {visibleBadges.map((badge, index) => (
          <Badge
            key={`${badge.type}-${index}`}
            variant="secondary"
            className="h-4 py-0 px-1 text-[0.6rem] bg-muted/50 hover:bg-muted/50 inline-flex items-center"
          >
            <span className="text-[0.7rem] mr-0.5">{badge.emoji}</span>
            <span className="truncate max-w-[60px]">{badge.name}</span>
          </Badge>
        ))}
        
        {hiddenCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className="h-4 py-0 px-1 text-[0.6rem] bg-muted/30 hover:bg-muted/50 cursor-default inline-flex items-center"
              >
                +{hiddenCount}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="flex flex-col gap-1">
                {hiddenBadges.map((badge, index) => (
                  <div key={`hidden-${badge.type}-${index}`} className="flex items-center gap-1">
                    <span>{badge.emoji}</span>
                    <span>{badge.name}</span>
                  </div>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
};