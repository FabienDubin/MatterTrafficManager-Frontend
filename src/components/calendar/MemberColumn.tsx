import { useMemo, useRef } from 'react';
import { cn } from '@/lib/utils';
import { MemberColumnProps } from '@/types/calendar.types';

// Hooks customs
import { useTaskDragAndDrop } from '@/hooks/calendar/useTaskDragAndDrop';
import { useTaskResize } from '@/hooks/calendar/useTaskResize';
import { useTimeSlotSelection } from '@/hooks/calendar/useTimeSlotSelection';

// Utils
import { calculateTaskPositions } from '@/utils/taskPositioning';

// Sous-composants
import { MemberColumnHeader } from './columns/MemberColumnHeader';
import { TimeGrid } from './columns/TimeGrid';
import { PositionedTasksList } from './columns/PositionedTasksList';
import { SelectionOverlay } from './columns/SelectionOverlay';
import { ResizeTooltip } from './columns/ResizeTooltip';

/**
 * Column for a member with positioned tasks
 */
export function MemberColumn({
  member,
  tasks,
  date,
  viewConfig,
  hourGridHeight,
  onTaskClick,
  onTimeSlotClick,
  onTimeSlotSelect,
  onTaskDrop,
  onTaskResize,
  holidayTask,
  remoteTask,
  schoolTask,
}: MemberColumnProps) {
  const timeSlotsRef = useRef<HTMLDivElement>(null);

  // 1. Drag & drop
  const {
    handleDrop,
    handleDragOver,
    handleDragLeave,
    handleDragStart
  } = useTaskDragAndDrop({
    date,
    memberId: member.id,
    onTaskDrop,
    holidayTask,
    schoolTask,
    memberName: member.name
  });

  // 2. Resize
  const {
    resizingTask,
    resizeTooltip,
    handleResizeStart
  } = useTaskResize({
    date,
    hourGridHeight,
    onTaskResize,
    tasks
  });

  // 3. Time slot selection
  const {
    handleSelectionStart,
    getSelectionOverlay
  } = useTimeSlotSelection({
    date,
    hourGridHeight,
    onTimeSlotSelect: onTimeSlotSelect
      ? (start, end) => onTimeSlotSelect(member, start, end)
      : undefined,
    enabled: !!onTimeSlotSelect
  });

  // 4. Calculate task positions with resize overrides
  const taskPositions = useMemo(() => {
    // Build resize overrides map
    const overrides = new Map<string, { startDate: Date; endDate: Date }>();
    if (resizingTask?.tempStartDate && resizingTask?.tempEndDate) {
      overrides.set(resizingTask.taskId, {
        startDate: resizingTask.tempStartDate,
        endDate: resizingTask.tempEndDate
      });
    }

    return calculateTaskPositions(tasks, date, hourGridHeight, overrides);
  }, [tasks, date, hourGridHeight, resizingTask]);

  // 5. Time slot click handler
  const handleTimeSlotClick = (hour: number) => {
    if (onTimeSlotClick) {
      const clickDate = new Date(date);
      clickDate.setHours(hour, 0, 0, 0);
      onTimeSlotClick(clickDate, hour);
    }
  };

  // 6. Column styling based on member status
  const columnClassName = cn(
    'flex-1 min-w-[200px] border-r flex flex-col',
    holidayTask && 'bg-muted/80',
    schoolTask && 'bg-blue-50/80 dark:bg-blue-950/20'
  );

  // 7. Selection overlay
  const selectionOverlay = getSelectionOverlay();

  return (
    <div className={columnClassName}>
      {/* Header */}
      <MemberColumnHeader
        member={member}
        taskCount={tasks.length}
        holidayTask={holidayTask}
        remoteTask={remoteTask}
        schoolTask={schoolTask}
      />

      {/* Time grid + tasks */}
      <div
        ref={timeSlotsRef}
        className='grid grid-rows-[repeat(13,1fr)] relative'
        style={{ height: hourGridHeight > 0 ? `${hourGridHeight}px` : undefined }}
        onMouseDown={e => {
          if (timeSlotsRef.current) {
            handleSelectionStart(e, timeSlotsRef.current);
          }
        }}
      >
        <TimeGrid
          hourGridHeight={hourGridHeight}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onTimeSlotClick={handleTimeSlotClick}
        >
          {/* Positioned tasks */}
          <PositionedTasksList
            taskPositions={taskPositions}
            viewConfig={viewConfig}
            onTaskClick={onTaskClick}
            onDragStart={handleDragStart}
            onResizeStart={handleResizeStart}
          />

          {/* Selection overlay */}
          {selectionOverlay && (
            <SelectionOverlay
              top={selectionOverlay.top}
              height={selectionOverlay.height}
            />
          )}
        </TimeGrid>
      </div>

      {/* Resize tooltip (portal) */}
      {resizeTooltip && (
        <ResizeTooltip
          visible={resizeTooltip.visible}
          x={resizeTooltip.x}
          y={resizeTooltip.y}
          timeRange={resizeTooltip.timeRange}
        />
      )}
    </div>
  );
}
