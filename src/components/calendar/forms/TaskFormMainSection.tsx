import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Check, ChevronsUpDown } from 'lucide-react';
import { TaskEditFormData } from '@/schemas/taskEdit.schema';
import { Project } from '@/services/api/projects.service';
import { cn } from '@/lib/utils';

// UI Components
import {
  FormControl,
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
import { Badge } from '@/components/ui/badge';

export interface TaskFormMainSectionProps {
  form: UseFormReturn<TaskEditFormData>;
  projects: Project[];
  selectedProject?: Project;
}

/**
 * Main section of task form: title, project, client, status
 */
export function TaskFormMainSection({
  form,
  projects,
  selectedProject
}: TaskFormMainSectionProps) {
  const [openProjectCombobox, setOpenProjectCombobox] = useState(false);

  return (
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
  );
}
