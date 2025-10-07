import { Dispatch, SetStateAction } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Task } from '@/types/task.types';

// Hooks customs
import { useTaskFormData } from '@/hooks/calendar/useTaskFormData';
import { useTaskFormInitialization } from '@/hooks/calendar/useTaskFormInitialization';
import { useTaskFormKeyboardShortcuts } from '@/hooks/calendar/useTaskFormKeyboardShortcuts';
import { useOptimisticTaskCreate } from '@/hooks/useOptimisticTaskCreate';
import { useOptimisticTaskUpdate } from '@/hooks/useOptimisticTaskUpdate';
import { useOptimisticTaskDelete } from '@/hooks/useOptimisticTaskDelete';

// Utils
import { buildCreatePayload, buildUpdatePayload } from '@/utils/taskPayloadBuilder';

// Sous-composants
import { TaskFormMainSection } from './forms/TaskFormMainSection';
import { TaskFormAssignmentSection } from './forms/TaskFormAssignmentSection';
import { TaskFormAdvancedSection } from './forms/TaskFormAdvancedSection';
import { TaskFormHistorySection } from './forms/TaskFormHistorySection';
import { TaskFormActions } from './forms/TaskFormActions';

// Schema
import { taskEditSchema, TaskEditFormData } from '@/schemas/taskEdit.schema';

// UI
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Form } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

export interface TaskEditSheetProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  tasks: Task[];
  setTasks: Dispatch<SetStateAction<Task[]>>;
  initialDates?: { start: Date; end: Date };
  initialMember?: string;
  initialMembers?: string[];
}

export function TaskEditSheet({
  task,
  open,
  onClose,
  tasks,
  setTasks,
  initialDates,
  initialMember,
  initialMembers
}: TaskEditSheetProps) {
  const isCreateMode = !task;

  // 1. Form setup
  const form = useForm<TaskEditFormData>({
    resolver: zodResolver(taskEditSchema),
    defaultValues: {
      title: '',
      projectId: '',
      status: 'not_started',
      assignedMembers: [],
      startDate: undefined,
      startTime: '09:00',
      endDate: undefined,
      endTime: '18:00',
      notes: '',
      addToCalendar: false,
    },
  });

  // 2. Load data (projects, members)
  const { projects, members, loadingProjects, loadingMembers } = useTaskFormData(open);

  // 3. Initialize form when task or initial data changes
  useTaskFormInitialization({
    task,
    isCreateMode,
    open,
    initialDates,
    initialMember,
    initialMembers,
    form
  });

  // 4. Optimistic mutations hooks
  const { mutate: createTask, isPending: isCreating } = useOptimisticTaskCreate(
    tasks,
    setTasks
  );

  const { mutate: updateTask, isPending: isUpdating } = useOptimisticTaskUpdate(
    tasks,
    setTasks
  );

  const { mutate: deleteTask, isPending: isDeleting } = useOptimisticTaskDelete(
    tasks,
    setTasks
  );

  // 5. Form submission
  const onSubmit = (data: TaskEditFormData) => {
    if (isCreateMode) {
      // Validate required fields
      if (!data.title || !data.projectId || !data.startDate || !data.endDate) {
        toast.error('Veuillez remplir tous les champs obligatoires');
        return;
      }

      // Build payload
      const payload = buildCreatePayload({ formData: data, projects, members });

      // Close and create
      onClose();
      createTask(payload);
    } else {
      if (!task) {
        return;
      }

      // Build update payload
      const payload = buildUpdatePayload({
        formData: data,
        originalTask: task,
        projects,
        members
      });

      // Nothing changed
      if (!payload) {
        onClose();
        return;
      }

      // Close and update
      onClose();
      updateTask({ id: task.id, updates: payload });
    }
  };

  // 6. Delete handler
  const handleDelete = () => {
    if (!task) {
      return;
    }
    onClose();
    deleteTask({ id: task.id });
  };

  // 7. Keyboard shortcuts
  useTaskFormKeyboardShortcuts({
    enabled: open,
    onSubmit: form.handleSubmit(onSubmit),
    onClose
  });

  // 8. Computed values
  const selectedMembers = form.watch('assignedMembers');
  const selectedProjectId = form.watch('projectId');
  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const isPending = isCreating || isUpdating || isDeleting;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className='w-[400px] sm:w-[540px] flex flex-col'>
        <SheetHeader>
          <SheetTitle>
            {isCreateMode ? 'Créer une tâche' : 'Modifier la tâche'}
          </SheetTitle>
          <SheetDescription>
            {isCreateMode
              ? 'Créez une nouvelle tâche'
              : 'Modifiez les informations de la tâche'}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex flex-col flex-1 min-h-0'
          >
            <ScrollArea className='flex-1 pr-4'>
              <div className='space-y-6 py-6'>
                {/* Section 1: Main info */}
                <TaskFormMainSection
                  form={form}
                  projects={projects}
                  selectedProject={selectedProject}
                />

                <Separator />

                {/* Section 2: Assignment & Planning */}
                <TaskFormAssignmentSection
                  form={form}
                  members={members}
                  selectedMembers={selectedMembers}
                />

                <Separator />

                {/* Section 3: Advanced options */}
                <TaskFormAdvancedSection form={form} />

                {/* Section 4: History (edit mode only) */}
                <TaskFormHistorySection
                  task={task}
                  isCreateMode={isCreateMode}
                />
              </div>
            </ScrollArea>

            {/* Section 5: Actions */}
            <TaskFormActions
              isCreateMode={isCreateMode}
              onCancel={onClose}
              onDelete={isCreateMode ? undefined : handleDelete}
              isPending={isPending}
            />
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
