import { useState, useEffect, useCallback } from 'react';

export interface UseTimeSlotSelectionOptions {
  date: Date;
  hourGridHeight: number;
  onTimeSlotSelect?: (startDate: Date, endDate: Date) => void;
  enabled: boolean;
}

export interface SelectionState {
  startY: number;
  currentY: number;
  startHour: number;
  startMinute: number;
}

export interface UseTimeSlotSelectionReturn {
  selecting: SelectionState | null;
  handleSelectionStart: (e: React.MouseEvent, containerRef: HTMLElement) => void;
  getSelectionOverlay: () => { top: number; height: number } | null;
}

/**
 * Hook to handle time slot selection by click & drag
 */
export function useTimeSlotSelection({
  date,
  hourGridHeight,
  onTimeSlotSelect,
  enabled
}: UseTimeSlotSelectionOptions): UseTimeSlotSelectionReturn {
  const [selecting, setSelecting] = useState<SelectionState | null>(null);

  const handleSelectionStart = useCallback(
    (e: React.MouseEvent, containerRef: HTMLElement) => {
      if (!enabled) return;

      // Don't start selection if clicking on a task
      const target = e.target as HTMLElement;
      if (target.closest('[data-task-card]')) return;

      e.preventDefault();

      const rect = containerRef.getBoundingClientRect();
      const hourHeight = hourGridHeight > 0 ? hourGridHeight / 13 : 0;

      const y = e.clientY - rect.top;
      const totalMinutes = (y / hourHeight) * 60;
      const startHour = Math.floor(totalMinutes / 60) + 8;
      const startMinute = Math.round((totalMinutes % 60) / 15) * 15;

      setSelecting({
        startY: e.clientY,
        currentY: e.clientY,
        startHour,
        startMinute,
      });
    },
    [enabled, hourGridHeight]
  );

  const handleSelectionMove = useCallback(
    (e: MouseEvent) => {
      if (!selecting) return;
      setSelecting(prev => (prev ? { ...prev, currentY: e.clientY } : null));
    },
    [selecting]
  );

  const handleSelectionEnd = useCallback(() => {
    if (!selecting || !onTimeSlotSelect) {
      setSelecting(null);
      return;
    }

    const hourHeight = hourGridHeight > 0 ? hourGridHeight / 13 : 0;
    const deltaY = selecting.currentY - selecting.startY;
    const deltaMinutes = (deltaY / hourHeight) * 60;
    const roundedDeltaMinutes = Math.round(deltaMinutes / 15) * 15;

    const startDate = new Date(date);
    startDate.setHours(selecting.startHour, selecting.startMinute, 0, 0);

    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + Math.abs(roundedDeltaMinutes));

    const finalStartDate = roundedDeltaMinutes < 0 ? endDate : startDate;
    const finalEndDate = roundedDeltaMinutes < 0 ? startDate : endDate;

    // Minimum 30 min duration
    const durationMs = finalEndDate.getTime() - finalStartDate.getTime();
    if (durationMs < 30 * 60 * 1000) {
      finalEndDate.setMinutes(finalEndDate.getMinutes() + 30);
    }

    onTimeSlotSelect(finalStartDate, finalEndDate);
    setSelecting(null);
  }, [selecting, date, onTimeSlotSelect, hourGridHeight]);

  useEffect(() => {
    if (!selecting) return;

    window.addEventListener('mousemove', handleSelectionMove);
    window.addEventListener('mouseup', handleSelectionEnd);

    return () => {
      window.removeEventListener('mousemove', handleSelectionMove);
      window.removeEventListener('mouseup', handleSelectionEnd);
    };
  }, [selecting, handleSelectionMove, handleSelectionEnd]);

  const getSelectionOverlay = useCallback(() => {
    if (!selecting) return null;

    const hourHeight = hourGridHeight > 0 ? hourGridHeight / 13 : 0;
    const deltaY = selecting.currentY - selecting.startY;
    const startOffset =
      (selecting.startHour - 8) * hourHeight + (selecting.startMinute / 60) * hourHeight;

    const height = Math.abs(deltaY);
    const top = deltaY < 0 ? startOffset + deltaY : startOffset;

    return { top, height };
  }, [selecting, hourGridHeight]);

  return {
    selecting,
    handleSelectionStart,
    getSelectionOverlay
  };
}
