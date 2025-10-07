import { format } from 'date-fns';
import { ExternalLink } from 'lucide-react';
import { Task } from '@/types/task.types';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export interface TaskFormHistorySectionProps {
  task: Task | null;
  isCreateMode: boolean;
}

/**
 * History section of task form: created and updated dates, notion link (edit mode only)
 */
export function TaskFormHistorySection({
  task,
  isCreateMode
}: TaskFormHistorySectionProps) {
  // Only show in edit mode
  if (isCreateMode || !task) {
    return null;
  }

  const hasHistory = task.createdAt || task.updatedAt;
  const notionUrl = task.notionUrl;

  // Don't render if no history and no notion URL
  if (!hasHistory && !notionUrl) {
    return null;
  }

  return (
    <div className='space-y-2'>
      <Label className='text-sm font-medium'>Historique</Label>

      {hasHistory && (
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
      )}

      {notionUrl && (
        <Button
          variant='outline'
          size='sm'
          type='button'
          onClick={() => window.open(notionUrl, '_blank', 'noopener,noreferrer')}
          className='w-full mt-2'
        >
          <ExternalLink className='h-4 w-4 mr-2' />
          Ouvrir dans Notion
        </Button>
      )}
    </div>
  );
}
