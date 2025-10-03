import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface TaskFormActionsProps {
  isCreateMode: boolean;
  onCancel: () => void;
  onDelete?: () => void;
  isPending?: boolean;
}

/**
 * Actions section of task form: submit, cancel, delete buttons
 */
export function TaskFormActions({
  isCreateMode,
  onCancel,
  onDelete,
  isPending
}: TaskFormActionsProps) {
  return (
    <div className='flex justify-between items-center pt-4 border-t mt-4'>
      <TooltipProvider>
        <div className='flex gap-2'>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type='submit' disabled={isPending}>
                Enregistrer
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{navigator.userAgent.includes('Mac') ? '⌘' : 'Ctrl'} + ↩︎</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant='outline' onClick={onCancel} type='button' disabled={isPending}>
                Annuler
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{navigator.userAgent.includes('Mac') ? '⌘' : 'Ctrl'} + ⌫</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      {/* Bouton Delete - Uniquement en mode édition */}
      {!isCreateMode && onDelete && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant='ghost'
              size='icon'
              type='button'
              className='text-destructive hover:text-destructive hover:bg-destructive/10'
              disabled={isPending}
            >
              <Trash2 className='h-5 w-5' />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. La tâche sera définitivement supprimée.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete}>
                Confirmer la suppression
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
