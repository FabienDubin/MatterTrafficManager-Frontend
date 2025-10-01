import { z } from 'zod';

/**
 * Zod schema for Task Edit Form
 * Used for frontend validation with React Hook Form
 *
 * Required fields: title, projectId, startDate, endDate
 */
export const taskEditSchema = z.object({
  // Required fields (*)
  title: z.string()
    .min(1, 'Le nom de la tâche est requis')
    .max(200, 'Le nom ne peut pas dépasser 200 caractères'),

  projectId: z.string()
    .min(1, 'Le projet est requis'),

  // Work period dates (required)
  startDate: z.date({
    required_error: 'La date de début est requise',
    invalid_type_error: 'Date invalide',
  }),
  startTime: z.string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format HH:mm requis'),

  endDate: z.date({
    required_error: 'La date de fin est requise',
    invalid_type_error: 'Date invalide',
  }),
  endTime: z.string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format HH:mm requis'),

  // Optional fields
  status: z.enum(['not_started', 'in_progress', 'completed']).optional(),
  assignedMembers: z.array(z.string()).optional(),
  notes: z.string()
    .max(500, 'Les notes ne peuvent pas dépasser 500 caractères')
    .optional(),
  addToCalendar: z.boolean().optional(),
})
.refine((data) => {
  // Ensure end is after start (dates are now required)
  const start = new Date(data.startDate);
  const [startHours, startMinutes] = data.startTime.split(':').map(Number);
  start.setHours(startHours, startMinutes, 0, 0);

  const end = new Date(data.endDate);
  const [endHours, endMinutes] = data.endTime.split(':').map(Number);
  end.setHours(endHours, endMinutes, 0, 0);

  return end > start;
}, {
  message: 'La date de fin doit être après la date de début',
  path: ['endDate'], // Error will be attached to endDate field
});

/**
 * TypeScript type inferred from schema
 */
export type TaskEditFormData = z.infer<typeof taskEditSchema>;
