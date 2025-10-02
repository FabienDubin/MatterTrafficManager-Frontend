import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { ChevronDownIcon, Check, ChevronsUpDown, X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

// UI Components
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Types & Schema
import type { Task } from '@/types/task.types';
import { taskEditSchema, TaskEditFormData } from '@/schemas/taskEdit.schema';
import { cn } from '@/lib/utils';
import { membersService, Member } from '@/services/api/members.service';
import { projectsService, Project } from '@/services/api/projects.service';

interface TaskEditSheetProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onUpdate?: (id: string, data: Partial<Task>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onCreate?: (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  initialDates?: {
    start: Date;
    end: Date;
  };
  initialMember?: string; // ID du membre pré-sélectionné (pour DayView)
}

export function TaskEditSheet({ task, open, onClose, onUpdate, onDelete, onCreate, initialDates, initialMember }: TaskEditSheetProps) {
  // Déterminer le mode : création ou édition
  const isCreateMode = !task;
  // State for projects and members
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [openProjectCombobox, setOpenProjectCombobox] = useState(false);
  const [openMembersCombobox, setOpenMembersCombobox] = useState(false);
  const [openStartDatePicker, setOpenStartDatePicker] = useState(false);
  const [openEndDatePicker, setOpenEndDatePicker] = useState(false);

  // React Hook Form with Zod validation
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

  // Load projects and members on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingProjects(true);
        const projectsData = await projectsService.getActiveProjects();
        setProjects(projectsData);
      } catch (error) {
        console.error('Failed to load projects:', error);
        toast.error('Erreur lors du chargement des projets');
      } finally {
        setLoadingProjects(false);
      }

      try {
        setLoadingMembers(true);
        const membersData = await membersService.getAllMembers();
        setMembers(membersData);
      } catch (error) {
        console.error('Failed to load members:', error);
        toast.error('Erreur lors du chargement des membres');
      } finally {
        setLoadingMembers(false);
      }
    };

    if (open) {
      loadData();
    }
  }, [open]);

  // Helper to normalize status from backend
  const normalizeStatus = (status: string): 'not_started' | 'in_progress' | 'completed' => {
    const normalized = status.toLowerCase();
    if (normalized === 'not_started' || normalized === 'pas commencé') return 'not_started';
    if (normalized === 'in_progress' || normalized === 'en cours' || normalized === 'a valider')
      return 'in_progress';
    if (normalized === 'completed' || normalized === 'terminé') return 'completed';
    return 'not_started';
  };

  // Initialize form when task changes OR when opening in create mode
  useEffect(() => {
    if (task) {
      // Mode édition - pré-remplir avec les données de la tâche
      const startDate = task.workPeriod?.startDate
        ? new Date(task.workPeriod.startDate)
        : undefined;
      const endDate = task.workPeriod?.endDate ? new Date(task.workPeriod.endDate) : undefined;

      form.reset({
        title: task.title || '',
        projectId: task.projectId || '',
        status: normalizeStatus(task.status || 'not_started'),
        assignedMembers: task.assignedMembers || [],
        startDate,
        startTime: startDate ? format(startDate, 'HH:mm') : '09:00',
        endDate,
        endTime: endDate ? format(endDate, 'HH:mm') : '18:00',
        notes: task.notes || '',
        addToCalendar: false,
      });
    } else if (isCreateMode && open) {
      // Mode création - pré-remplir avec initialDates et initialMember
      const startDate = initialDates?.start;
      const endDate = initialDates?.end;

      form.reset({
        title: '',
        projectId: '',
        status: 'not_started',
        assignedMembers: initialMember ? [initialMember] : [],
        startDate,
        startTime: startDate ? format(startDate, 'HH:mm') : '09:00',
        endDate,
        endTime: endDate ? format(endDate, 'HH:mm') : '18:00',
        notes: '',
        addToCalendar: false,
      });
    }
  }, [task, form, isCreateMode, open, initialDates, initialMember]);

  // Watch selected members and project
  const selectedMembers = form.watch('assignedMembers');
  const selectedProjectId = form.watch('projectId');

  // Get selected project to display client
  const selectedProject = projects.find(p => p.id === selectedProjectId);

  // Handle form submission
  const onSubmit = async (data: TaskEditFormData) => {
    // MODE CRÉATION
    if (isCreateMode) {
      if (!onCreate) {
        console.error('onCreate callback is required in create mode');
        return;
      }

      // Valider les champs requis
      if (!data.title || !data.projectId || !data.startDate || !data.endDate) {
        toast.error('Veuillez remplir tous les champs obligatoires');
        return;
      }

      // Build create payload
      const [startHours, startMinutes] = data.startTime.split(':').map(Number);
      const startDateTime = new Date(data.startDate);
      startDateTime.setHours(startHours, startMinutes, 0, 0);

      const [endHours, endMinutes] = data.endTime.split(':').map(Number);
      const endDateTime = new Date(data.endDate);
      endDateTime.setHours(endHours, endMinutes, 0, 0);

      // Get project data for enrichment
      const selectedProject = projects.find(p => p.id === data.projectId);

      // Get member data for enrichment
      const enrichedMembers = data.assignedMembers
        ?.map(memberId => {
          const member = members.find(m => m.id === memberId);
          return member
            ? {
                id: member.id,
                name: member.name,
                email: member.email,
                teams: member.teams,
              }
            : null;
        })
        .filter(Boolean) as Array<{
        id: string;
        name: string;
        email: string;
        teams?: string[];
      }>;

      const createPayload = {
        title: data.title,
        projectId: data.projectId,
        projectData: selectedProject
          ? {
              id: selectedProject.id,
              name: selectedProject.name,
              status: selectedProject.status,
            }
          : undefined,
        clientId: selectedProject?.client || undefined,
        clientData:
          selectedProject?.clientName && selectedProject?.client
            ? {
                id: selectedProject.client,
                name: selectedProject.clientName,
              }
            : undefined,
        status: data.status,
        assignedMembers: data.assignedMembers || [],
        assignedMembersData: enrichedMembers,
        workPeriod: {
          startDate: startDateTime.toISOString(),
          endDate: endDateTime.toISOString(),
        },
        notes: data.notes || '',
        addToCalendar: data.addToCalendar,
      } as Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;

      // Close and perform create
      onClose();
      toast.success('Création en cours...');

      try {
        await onCreate(createPayload);
      } catch (error) {
        console.error('Error creating task:', error);
        toast.error('Erreur de synchronisation', {
          description: "La création n'a pas pu être synchronisée avec Notion",
        });
      }
      return;
    }

    // MODE ÉDITION
    if (!task || !onUpdate) return;

    // Build update payload
    const updatePayload: Partial<Task> = {};

    if (data.title !== task.title) {
      updatePayload.title = data.title;
    }

    if (data.projectId !== task.projectId) {
      updatePayload.projectId = data.projectId;

      // When project changes, also update project and client info for optimistic UI update
      const newProject = projects.find(p => p.id === data.projectId);
      if (newProject) {
        // Update project data
        updatePayload.projectData = {
          id: newProject.id,
          name: newProject.name,
          status: newProject.status,
        };

        // Update client data
        updatePayload.clientId = newProject.client || undefined;
        updatePayload.clientData =
          newProject.clientName && newProject.client
            ? {
                id: newProject.client,
                name: newProject.clientName,
              }
            : undefined;
      }
    }

    if (data.status !== task.status) {
      updatePayload.status = data.status;
    }

    // Handle dates
    if (data.startDate && data.endDate) {
      const [startHours, startMinutes] = data.startTime.split(':').map(Number);
      const startDateTime = new Date(data.startDate);
      startDateTime.setHours(startHours, startMinutes, 0, 0);

      const [endHours, endMinutes] = data.endTime.split(':').map(Number);
      const endDateTime = new Date(data.endDate);
      endDateTime.setHours(endHours, endMinutes, 0, 0);

      const originalStart = task.workPeriod?.startDate ? new Date(task.workPeriod.startDate) : null;
      const originalEnd = task.workPeriod?.endDate ? new Date(task.workPeriod.endDate) : null;

      const datesChanged =
        !originalStart ||
        !originalEnd ||
        originalStart.getTime() !== startDateTime.getTime() ||
        originalEnd.getTime() !== endDateTime.getTime();

      if (datesChanged) {
        updatePayload.workPeriod = {
          startDate: startDateTime.toISOString(),
          endDate: endDateTime.toISOString(),
        };
      }
    }

    // Handle assigned members
    const membersChanged =
      JSON.stringify(data.assignedMembers?.sort()) !== JSON.stringify(task.assignedMembers?.sort());
    if (membersChanged) {
      updatePayload.assignedMembers = data.assignedMembers;

      // Enrich with member data for optimistic UI update
      updatePayload.assignedMembersData = data.assignedMembers
        ?.map(memberId => {
          const member = members.find(m => m.id === memberId);
          return member
            ? {
                id: member.id,
                name: member.name,
                email: member.email,
                teams: member.teams,
              }
            : null;
        })
        .filter(Boolean) as Array<{
        id: string;
        name: string;
        email: string;
        teams?: string[];
      }>;
    }

    // Handle notes
    if (data.notes !== task.notes) {
      updatePayload.notes = data.notes;
    }

    // Handle addToCalendar
    updatePayload.addToCalendar = data.addToCalendar;

    // Only proceed if something changed
    if (Object.keys(updatePayload).length === 0) {
      onClose();
      return;
    }

    // Close and perform update
    onClose();
    toast.success('Modification en cours...');

    try {
      await onUpdate(task.id, updatePayload);
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Erreur de synchronisation', {
        description: "La modification n'a pas pu être synchronisée avec Notion",
      });
    }
  };

  // Keyboard shortcuts: Cmd/Ctrl+Enter to submit, Escape to close
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+Enter (Mac) or Ctrl+Enter (Windows/Linux) to submit
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();

        // Trigger form submission programmatically
        form.handleSubmit(onSubmit)();
      }

      // Escape to close (ShadCN handles it natively, but we ensure clean close)
      if ((e.metaKey || e.ctrlKey) && e.key === 'Backspace') {
        // Only if not focused in a textarea (let textarea handle Escape naturally)
        const target = e.target as HTMLElement;
        if (target.tagName !== 'TEXTAREA') {
          onClose();
        }
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, form, onSubmit, onClose]);

  // Handle delete
  const handleDelete = async () => {
    if (!task || !onDelete) return;

    onClose();
    toast.success('Suppression en cours...');

    try {
      await onDelete(task.id);
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Erreur de synchronisation', {
        description: "La suppression n'a pas pu être synchronisée avec Notion",
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className='w-[400px] sm:w-[540px] flex flex-col'>
        <SheetHeader>
          <SheetTitle>{isCreateMode ? 'Créer une tâche' : 'Modifier la tâche'}</SheetTitle>
          <SheetDescription>
            {isCreateMode ? 'Créez une nouvelle tâche' : 'Modifiez les informations de la tâche'}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='flex flex-col flex-1 min-h-0'>
            <ScrollArea className='flex-1 pr-4'>
              <div className='space-y-6 py-6'>
                {/* SECTION 1: Informations principales */}
                <div className='space-y-4'>
                  {/* Nom de la tâche * */}
                  <FormField
                    control={form.control}
                    name='title'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Nom de la tâche <span className='text-red-500'>*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder='Entrez le nom de la tâche' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Projet * (Combobox) */}
                  <FormField
                    control={form.control}
                    name='projectId'
                    render={({ field }) => (
                      <FormItem className='flex flex-col'>
                        <FormLabel>
                          Projet <span className='text-red-500'>*</span>
                        </FormLabel>
                        <Popover
                          open={openProjectCombobox}
                          onOpenChange={setOpenProjectCombobox}
                          modal={true}
                        >
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant='outline'
                                role='combobox'
                                className={cn(
                                  'w-full justify-between',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value
                                  ? projects.find(p => p.id === field.value)?.name
                                  : 'Sélectionner un projet'}
                                <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className='w-[400px] p-0'>
                            <Command>
                              <CommandInput placeholder='Rechercher un projet...' />
                              <CommandList>
                                <CommandEmpty>Aucun projet trouvé.</CommandEmpty>
                                <CommandGroup>
                                  {projects.map(project => (
                                    <CommandItem
                                      key={project.id}
                                      value={project.name}
                                      onSelect={() => {
                                        form.setValue('projectId', project.id);
                                        setOpenProjectCombobox(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          'mr-2 h-4 w-4',
                                          project.id === field.value ? 'opacity-100' : 'opacity-0'
                                        )}
                                      />
                                      {project.name}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Client (read-only) - Display from selected project */}
                  {selectedProject?.clientName && (
                    <div className='space-y-2'>
                      <Label className='text-sm text-muted-foreground'>Client</Label>
                      <div>
                        <Badge variant='outline'>{selectedProject.clientName}</Badge>
                      </div>
                    </div>
                  )}

                  {/* Statut */}
                  <FormField
                    control={form.control}
                    name='status'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Statut</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Sélectionner un statut' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value='not_started'>Pas Commencé</SelectItem>
                            <SelectItem value='in_progress'>A valider</SelectItem>
                            <SelectItem value='completed'>Terminé</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                {/* SECTION 2: Attribution & Planification */}
                <div className='space-y-4'>
                  {/* Assignée à (Multi-select Combobox) */}
                  <FormField
                    control={form.control}
                    name='assignedMembers'
                    render={({ field }) => (
                      <FormItem className='flex flex-col'>
                        <FormLabel>Assignée à</FormLabel>
                        {/* Selected members badges */}
                        {selectedMembers && selectedMembers.length > 0 && (
                          <div className='flex flex-wrap gap-2 mt-2'>
                            {selectedMembers.map(memberId => {
                              const member = members.find(m => m.id === memberId);
                              if (!member) return null;
                              return (
                                <Badge key={memberId} variant='default' className='gap-1'>
                                  {member.name}
                                  <X
                                    className='h-3 w-3 cursor-pointer'
                                    onClick={() => {
                                      const currentMembers = selectedMembers || [];
                                      form.setValue(
                                        'assignedMembers',
                                        currentMembers.filter(id => id !== memberId)
                                      );
                                    }}
                                  />
                                </Badge>
                              );
                            })}
                          </div>
                        )}
                        <Popover
                          open={openMembersCombobox}
                          onOpenChange={setOpenMembersCombobox}
                          modal={true}
                        >
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant='outline'
                                role='combobox'
                                className={cn(
                                  'w-full justify-between',
                                  !selectedMembers?.length && 'text-muted-foreground'
                                )}
                              >
                                {selectedMembers?.length
                                  ? `${selectedMembers.length} membre(s) sélectionné(s)`
                                  : 'Sélectionner des membres'}
                                <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className='w-[400px] p-0'>
                            <Command>
                              <CommandInput placeholder='Rechercher un membre...' />
                              <CommandList>
                                <CommandEmpty>Aucun membre trouvé.</CommandEmpty>
                                <CommandGroup>
                                  {members.map(member => (
                                    <CommandItem
                                      key={member.id}
                                      value={member.name}
                                      onSelect={() => {
                                        const currentMembers = field.value || [];
                                        const isSelected = currentMembers.includes(member.id);

                                        if (isSelected) {
                                          form.setValue(
                                            'assignedMembers',
                                            currentMembers.filter(id => id !== member.id)
                                          );
                                        } else {
                                          form.setValue('assignedMembers', [
                                            ...currentMembers,
                                            member.id,
                                          ]);
                                        }
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          'mr-2 h-4 w-4',
                                          selectedMembers?.includes(member.id)
                                            ? 'opacity-100'
                                            : 'opacity-0'
                                        )}
                                      />
                                      {member.name}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Dates & Heures * */}
                  <div className='grid grid-cols-2 gap-4'>
                    <FormField
                      control={form.control}
                      name='startDate'
                      render={({ field }) => (
                        <FormItem className='flex flex-col'>
                          <FormLabel>
                            Date de début <span className='text-red-500'>*</span>
                          </FormLabel>
                          <Popover
                            open={openStartDatePicker}
                            onOpenChange={setOpenStartDatePicker}
                            modal={true}
                          >
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant='outline'
                                  className={cn(
                                    'w-full justify-start text-left font-normal',
                                    !field.value && 'text-muted-foreground'
                                  )}
                                >
                                  {field.value ? format(field.value, 'dd/MM/yyyy') : 'Sélectionner'}
                                  <ChevronDownIcon className='ml-auto h-4 w-4' />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className='w-auto p-0' align='start'>
                              <Calendar
                                mode='single'
                                selected={field.value}
                                onSelect={date => {
                                  field.onChange(date);
                                  setOpenStartDatePicker(false);
                                }}
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='startTime'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Heure</FormLabel>
                          <FormControl>
                            <Input type='time' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className='grid grid-cols-2 gap-4'>
                    <FormField
                      control={form.control}
                      name='endDate'
                      render={({ field }) => (
                        <FormItem className='flex flex-col'>
                          <FormLabel>
                            Date de fin <span className='text-red-500'>*</span>
                          </FormLabel>
                          <Popover
                            open={openEndDatePicker}
                            onOpenChange={setOpenEndDatePicker}
                            modal={true}
                          >
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant='outline'
                                  className={cn(
                                    'w-full justify-start text-left font-normal',
                                    !field.value && 'text-muted-foreground'
                                  )}
                                >
                                  {field.value ? format(field.value, 'dd/MM/yyyy') : 'Sélectionner'}
                                  <ChevronDownIcon className='ml-auto h-4 w-4' />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className='w-auto p-0' align='start'>
                              <Calendar
                                mode='single'
                                selected={field.value}
                                onSelect={date => {
                                  field.onChange(date);
                                  setOpenEndDatePicker(false);
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='endTime'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Heure</FormLabel>
                          <FormControl>
                            <Input type='time' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* SECTION 3: Options avancées (Accordion) */}
                <Accordion type='single' collapsible>
                  <AccordionItem value='advanced-options'>
                    <AccordionTrigger>Options avancées</AccordionTrigger>
                    <AccordionContent>
                      <div className='space-y-4 pt-2'>
                        {/* Ajouter au Calendrier */}
                        <FormField
                          control={form.control}
                          name='addToCalendar'
                          render={({ field }) => (
                            <FormItem className='flex flex-row items-start space-x-3 space-y-0'>
                              <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                              <div className='space-y-1 leading-none'>
                                <FormLabel>Ajouter au Calendrier Notion</FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />

                        {/* Notes */}
                        <FormField
                          control={form.control}
                          name='notes'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Notes</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder='Ajoutez des notes pour cette tâche...'
                                  className='resize-none'
                                  rows={4}
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription className='text-right'>
                                {field.value?.length || 0}/500 caractères
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {/* SECTION 4: Historique - Uniquement en mode édition */}
                {!isCreateMode && task && (task.createdAt || task.updatedAt) && (
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
                )}
              </div>
            </ScrollArea>

            {/* SECTION 5: Actions (Footer) - Fixé en bas */}
            <SheetFooter className='flex justify-between items-center pt-4 border-t mt-4'>
              <TooltipProvider>
                <div className='flex gap-2'>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button type='submit'>Enregistrer</Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{navigator.userAgent.includes('Mac') ? '⌘' : 'Ctrl'} + ↩︎</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant='outline' onClick={onClose} type='button'>
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
              {!isCreateMode && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant='ghost'
                      size='icon'
                      type='button'
                      className='text-destructive hover:text-destructive hover:bg-destructive/10'
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
                      <AlertDialogAction onClick={handleDelete}>
                        Confirmer la suppression
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
