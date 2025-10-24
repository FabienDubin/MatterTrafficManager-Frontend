import { UseFormReturn } from 'react-hook-form';
import { TaskEditFormData } from '@/schemas/taskEdit.schema';

// UI Components
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

export interface TaskFormAdvancedSectionProps {
  form: UseFormReturn<TaskEditFormData>;
  readOnly?: boolean;
}

/**
 * Advanced options section of task form: accordion with calendar checkbox and notes
 */
export function TaskFormAdvancedSection({ form, readOnly }: TaskFormAdvancedSectionProps) {
  return (
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
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={readOnly}
                    />
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
                      disabled={readOnly}
                    />
                  </FormControl>
                  <FormDescription className='text-right'>
                    {field.value?.length || 0}/2000 caractères
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
