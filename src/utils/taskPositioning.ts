import { Task } from '@/types/task.types';
import { TaskPosition } from '@/types/calendar.types';

/**
 * Calculate non-overlapping positions for tasks in a day column
 */
export function calculateTaskPositions(
  tasks: Task[],
  date: Date,
  containerHeight: number,
  resizeOverrides?: Map<string, { startDate: Date; endDate: Date }>
): TaskPosition[] {
  if (tasks.length === 0) return [];

  const hourHeight = containerHeight > 0 ? containerHeight / 13 : 0;
  const dayStart = new Date(date);
  dayStart.setHours(8, 0, 0, 0);

  // Sort tasks by start time
  const sortedTasks = tasks
    .filter(task => task.workPeriod)
    .sort((a, b) => {
      const aStart = new Date(a.workPeriod!.startDate);
      const bStart = new Date(b.workPeriod!.startDate);
      return aStart.getTime() - bStart.getTime();
    });

  const positions: TaskPosition[] = [];
  const columns: { endTime: number }[] = [];

  sortedTasks.forEach(task => {
    // Check for resize override
    const override = resizeOverrides?.get(task.id);
    let startTime = override?.startDate || new Date(task.workPeriod!.startDate);
    let endTime = override?.endDate || new Date(task.workPeriod!.endDate);

    // Handle all-day tasks
    if (task.isAllDay) {
      startTime = new Date(startTime);
      startTime.setHours(8, 0, 0, 0);
      endTime = new Date(endTime);
      endTime.setHours(21, 0, 0, 0);
    }

    // Calculate position
    const startHour = startTime.getHours() + startTime.getMinutes() / 60;
    const endHour = endTime.getHours() + endTime.getMinutes() / 60;

    const top = (startHour - 8) * hourHeight;
    const height = Math.max((endHour - startHour) * hourHeight, 20);

    // Find available column
    let columnIndex = columns.findIndex(col => col.endTime <= startTime.getTime());
    if (columnIndex === -1) {
      columnIndex = columns.length;
      columns.push({ endTime: endTime.getTime() });
    } else {
      columns[columnIndex].endTime = endTime.getTime();
    }

    // Calculate horizontal position
    const totalColumns = Math.max(columns.length, 1);
    const width = 100 / totalColumns;
    const left = columnIndex * width;

    positions.push({ task, top, height, left, width });
  });

  // Adjust widths for all tasks based on max columns
  const maxColumns = columns.length;
  if (maxColumns > 1) {
    positions.forEach(pos => {
      pos.width = 100 / maxColumns;
    });
  }

  return positions;
}
