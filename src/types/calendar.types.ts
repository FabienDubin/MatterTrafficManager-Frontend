import { Task, TaskWithConflicts } from '@/types/task.types';
import { FieldType } from '@/store/calendar-config.store';

// Types spécifiques à la vue calendrier

export interface Member {
  id: string;
  name: string;
  email?: string;
  teams?: string[] | Array<{ id: string; name: string }>;
  teamsData?: Array<{ id: string; name: string }>;
}

export interface TimeSlot {
  hour: number;
  minute: number;
  label: string;
}

export interface TaskPosition {
  task: Task;
  top: number;      // Position from top in pixels
  height: number;   // Height in pixels
  left: number;     // Offset for overlapping tasks
  width: number;    // Width percentage (100%, 50% if overlapping)
}

export interface ViewConfig {
  fields: FieldType[];
  maxTitleLength?: number;
}

export interface DayViewProps {
  date: Date;
  tasks: Task[];
  members: Member[];
  viewConfig?: ViewConfig;
  onTaskClick?: (task: Task) => void;
  onTimeSlotClick?: (member: Member | null, date: Date, hour: number) => void;
  onTaskDrop?: (task: Task, newMember: string | null, newDate: Date, sourceMember?: string) => void;
  onTaskResize?: (task: TaskWithConflicts, newStartDate: Date, newEndDate: Date) => void;
}

export interface MemberColumnProps {
  member: Member;
  tasks: Task[];
  date: Date;
  viewConfig?: ViewConfig;
  onTaskClick?: (task: Task) => void;
  onTimeSlotClick?: (date: Date, hour: number) => void;
  onTaskDrop?: (task: Task, memberId: string, newDate: Date, sourceMemberId?: string) => void;
  onTaskResize?: (task: TaskWithConflicts, newStartDate: Date, newEndDate: Date) => void;
  holidayTask?: Task; // Tâche de congé pour ce membre
  remoteTask?: Task;  // Tâche de télétravail pour ce membre
  schoolTask?: Task;  // Tâche de formation pour ce membre
}

export interface UnassignedColumnProps {
  tasks: Task[];
  date: Date;
  viewConfig?: ViewConfig;
  onTaskClick?: (task: Task) => void;
  onTimeSlotClick?: (date: Date, hour: number) => void;
  onTaskDrop?: (task: Task, memberId: string | null, newDate: Date, sourceMemberId?: string) => void;
  onTaskResize?: (task: TaskWithConflicts, newStartDate: Date, newEndDate: Date) => void;
}

export interface TimeGridProps {
  startHour?: number;
  endHour?: number;
  slotDuration?: number; // in minutes
}