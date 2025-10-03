import { DragEvent, ReactNode } from 'react';

export interface TimeGridProps {
  hourGridHeight: number;
  onDrop: (e: DragEvent, hour: number) => void;
  onDragOver: (e: DragEvent) => void;
  onDragLeave: () => void;
  onTimeSlotClick?: (hour: number) => void;
  children?: ReactNode;
}

/**
 * Time grid from 8h to 20h (13 hours) with drop zones
 */
export function TimeGrid({
  onDrop,
  onDragOver,
  onDragLeave,
  onTimeSlotClick,
  children
}: TimeGridProps) {
  return (
    <>
      {/* Hour slots */}
      {Array.from({ length: 13 }, (_, i) => i + 8).map(hour => {
        return (
          <div
            key={hour}
            className='border-b hover:bg-muted/5 cursor-pointer transition-colors relative'
            onDrop={e => onDrop(e, hour)}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => onTimeSlotClick?.(hour)}
          >
            {/* Half-hour line */}
            <div className='absolute top-1/2 left-0 right-0 border-b border-dashed border-muted-foreground/20' />
          </div>
        );
      })}

      {/* Positioned tasks (passed as children) */}
      {children}
    </>
  );
}
