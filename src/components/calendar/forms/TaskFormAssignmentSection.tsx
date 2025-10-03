import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { format } from 'date-fns';
import { ChevronDownIcon } from 'lucide-react';
import { TaskEditFormData } from '@/schemas/taskEdit.schema';
import { Member } from '@/services/api/members.service';
import { cn } from '@/lib/utils';
import { MemberCombobox } from '@/components/shared/MemberCombobox';

// UI Components
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  const [openStartDatePicker, setOpenStartDatePicker] = useState(false);
  const [openEndDatePicker, setOpenEndDatePicker] = useState(false);

  const toggleMember = (memberId: string) => {
    const currentMembers = form.getValues('assignedMembers') || [];
    if (currentMembers.includes(memberId)) {
      form.setValue('assignedMembers', currentMembers.filter(id => id !== memberId));
    } else {
      form.setValue('assignedMembers', [...currentMembers, memberId]);
    }
  };

  return (
    <div className='space-y-4'>
      {/* Assignée à (Multi-select Combobox) */}
      <FormField
        control={form.control}
        name='assignedMembers'
        render={() => (
          <FormItem className='flex flex-col'>
            <FormLabel>Assignée à</FormLabel>
            <FormControl>
              <MemberCombobox
                members={members}
                selectedMembers={selectedMembers}
                onToggleMember={toggleMember}
              />
            </FormControl>
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
