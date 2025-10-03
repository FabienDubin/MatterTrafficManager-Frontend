import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { format } from 'date-fns';
import { Check, ChevronsUpDown, X, ChevronDownIcon } from 'lucide-react';
import { TaskEditFormData } from '@/schemas/taskEdit.schema';
import { Member } from '@/services/api/members.service';
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
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';

export interface TaskFormAssignmentSectionProps {
  form: UseFormReturn<TaskEditFormData>;
  members: Member[];
  selectedMembers: string[];
}

/**
 * Assignment section of task form: assigned members, dates, times
 */
export function TaskFormAssignmentSection({
  form,
  members,
  selectedMembers
}: TaskFormAssignmentSectionProps) {
  const [openMembersCombobox, setOpenMembersCombobox] = useState(false);
  const [openStartDatePicker, setOpenStartDatePicker] = useState(false);
  const [openEndDatePicker, setOpenEndDatePicker] = useState(false);

  return (
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
                  if (!member) {
                    return null;
                  }
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
  );
}
