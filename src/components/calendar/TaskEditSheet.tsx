import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ChevronDownIcon, Loader2, Trash2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { Task } from '@/services/api/tasks.service';

interface TaskEditSheetProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onUpdate: (id: string, data: Partial<Task>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function TaskEditSheet({
  task,
  open,
  onClose,
  onUpdate,
  onDelete,
}: TaskEditSheetProps) {
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [endTime, setEndTime] = useState('');
  const [openStartDatePicker, setOpenStartDatePicker] = useState(false);
  const [openEndDatePicker, setOpenEndDatePicker] = useState(false);

  // Initialize form when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      
      if (task.workPeriod?.startDate) {
        const start = new Date(task.workPeriod.startDate);
        setStartDate(start);
        setStartTime(format(start, 'HH:mm'));
      } else {
        setStartDate(undefined);
        setStartTime('09:00');
      }
      
      if (task.workPeriod?.endDate) {
        const end = new Date(task.workPeriod.endDate);
        setEndDate(end);
        setEndTime(format(end, 'HH:mm'));
      } else {
        setEndDate(undefined);
        setEndTime('18:00');
      }
    }
  }, [task]);

  const handleSave = async () => {
    if (!task) return;
    
    if (!title.trim()) {
      toast.error('Le nom de la tâche est requis');
      return;
    }

    // Build update payload - only include what changed
    const updatePayload: Partial<Task> = {};
    
    // Check if title actually changed
    if (title !== task.title) {
      updatePayload.title = title;
    }
    
    // Only process dates if user has dates in the form
    if (startDate && endDate) {
      // Combine date and time
      const [startHours, startMinutes] = startTime.split(':').map(Number);
      const [endHours, endMinutes] = endTime.split(':').map(Number);
      
      const startDateTime = new Date(startDate);
      startDateTime.setHours(startHours, startMinutes, 0, 0);
      
      const endDateTime = new Date(endDate);
      endDateTime.setHours(endHours, endMinutes, 0, 0);

      if (endDateTime <= startDateTime) {
        toast.error('La date de fin doit être après la date de début');
        return;
      }
      
      // Check if dates actually changed
      const originalStart = task.workPeriod?.startDate ? new Date(task.workPeriod.startDate) : null;
      const originalEnd = task.workPeriod?.endDate ? new Date(task.workPeriod.endDate) : null;
      
      const datesChanged = !originalStart || !originalEnd ||
        originalStart.getTime() !== startDateTime.getTime() ||
        originalEnd.getTime() !== endDateTime.getTime();
      
      if (datesChanged) {
        updatePayload.workPeriod = {
          startDate: startDateTime.toISOString(),
          endDate: endDateTime.toISOString(),
        };
      }
    }
    
    // Only proceed if something changed
    if (Object.keys(updatePayload).length === 0) {
      onClose();
      return;
    }

    // Optimistic update: Close immediately for better UX
    onClose();
    toast.success('Modification en cours...');
    
    // Perform the update in background - only with changed fields
    onUpdate(task.id, updatePayload).then(() => {
      // Success is already handled by the optimistic update
      console.log('Task updated successfully');
    }).catch((error) => {
      console.error('Error updating task:', error);
      toast.error('Erreur de synchronisation', {
        description: 'La modification n\'a pas pu être synchronisée avec Notion'
      });
      // Here we could implement a rollback if needed
    });
  };

  const handleDelete = async () => {
    if (!task) return;
    
    // Optimistic update: Close immediately for better UX
    onClose();
    toast.success('Suppression en cours...');
    
    // Perform the delete in background
    onDelete(task.id).then(() => {
      console.log('Task deleted successfully');
    }).catch((error) => {
      console.error('Error deleting task:', error);
      toast.error('Erreur de synchronisation', {
        description: 'La suppression n\'a pas pu être synchronisée avec Notion'
      });
    });
  };

  if (!task) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Modifier la tâche</SheetTitle>
          <SheetDescription>
            Modifiez les informations de la tâche
          </SheetDescription>
        </SheetHeader>

        <div className="grid gap-6 py-6">
          {/* Task Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Nom de la tâche</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Entrez le nom de la tâche"
            />
          </div>

          {/* Start Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Date de début</Label>
              <Popover open={openStartDatePicker} onOpenChange={setOpenStartDatePicker}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    id="start-date"
                    className="w-full justify-between font-normal"
                  >
                    {startDate ? format(startDate, 'dd/MM/yyyy') : 'Sélectionner'}
                    <ChevronDownIcon className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      setStartDate(date);
                      setOpenStartDatePicker(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="start-time">Heure de début</Label>
              <Input
                type="time"
                id="start-time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {/* End Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="end-date">Date de fin</Label>
              <Popover open={openEndDatePicker} onOpenChange={setOpenEndDatePicker}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    id="end-date"
                    className="w-full justify-between font-normal"
                  >
                    {endDate ? format(endDate, 'dd/MM/yyyy') : 'Sélectionner'}
                    <ChevronDownIcon className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => {
                      setEndDate(date);
                      setOpenEndDatePicker(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="end-time">Heure de fin</Label>
              <Input
                type="time"
                id="end-time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {/* Read-only Fields */}
          <div className="space-y-4 border-t pt-4">
            {/* Project */}
            {task.projectData && (
              <div className="space-y-2">
                <Label className="text-muted-foreground">Projet</Label>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{task.projectData.name}</Badge>
                </div>
              </div>
            )}

            {/* Client */}
            {task.clientData && (
              <div className="space-y-2">
                <Label className="text-muted-foreground">Client</Label>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{task.clientData.name}</Badge>
                </div>
              </div>
            )}

            {/* Assigned Members */}
            {task.assignedMembersData && task.assignedMembersData.length > 0 && (
              <div className="space-y-2">
                <Label className="text-muted-foreground">Membres assignés</Label>
                <div className="flex flex-wrap gap-2">
                  {task.assignedMembersData.map((member) => (
                    <Badge key={member.id} variant="default">
                      {member.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <SheetFooter className="flex justify-between">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                size="sm"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
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
                <AlertDialogAction 
                  onClick={handleDelete}
                >
                  Confirmer la suppression
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSave}
            >
              Enregistrer
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}