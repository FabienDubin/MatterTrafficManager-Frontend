import { Task, TaskWithConflicts } from '@/types/task.types';

// Types spécifiques à la vue calendrier

export interface Member {
  id: string;
  name: string;
  email?: string;
  teams?: string[];
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

export interface DayViewProps {
  date: Date;
  tasks: Task[];
  members: Member[];
  onTaskClick?: (task: Task) => void;
  onTimeSlotClick?: (member: Member | null, date: Date, hour: number) => void;
  onTaskDrop?: (task: Task, newMember: string | null, newDate: Date) => void;
}

export interface MemberColumnProps {
  member: Member;
  tasks: Task[];
  date: Date;
  onTaskClick?: (task: Task) => void;
  onTimeSlotClick?: (date: Date, hour: number) => void;
  onTaskDrop?: (task: Task, newDate: Date) => void;
}

export interface UnassignedColumnProps {
  tasks: Task[];
  date: Date;
  onTaskClick?: (task: Task) => void;
  onTimeSlotClick?: (date: Date, hour: number) => void;
  onTaskDrop?: (task: Task, newDate: Date) => void;
}

export interface TimeGridProps {
  startHour?: number;
  endHour?: number;
  slotDuration?: number; // in minutes
}