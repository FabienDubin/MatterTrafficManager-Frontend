import { format } from 'date-fns';
import { Task } from '@/types/task.types';
import { Label } from '@/components/ui/label';

export interface TaskFormHistorySectionProps {
  task: Task | null;
  isCreateMode: boolean;
}

/**
 * History section of task form: created and updated dates (edit mode only)
 */
export function TaskFormHistorySection({
  task,
  isCreateMode
}: TaskFormHistorySectionProps) {
  // Only show in edit mode
  if (isCreateMode || !task || (!task.createdAt && !task.updatedAt)) {
    return null;
  }

  return (
    <div className='space-y-2'>
      <Label className='text-sm font-medium'>Historique</Label>
      <div className='space-y-1 text-sm text-muted-foreground'>
        {task.createdAt && (
          <div>Créé le {format(new Date(task.createdAt), 'dd/MM/yyyy à HH:mm')}</div>
        )}
        {task.updatedAt && (
          <div>
            Modifié le {format(new Date(task.updatedAt), 'dd/MM/yyyy à HH:mm')}
          </div>
        )}
      </div>
    </div>
  );
}
