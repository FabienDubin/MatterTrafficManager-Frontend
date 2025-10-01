/**
 * Hook for handling calendar event interactions
 */
export const useCalendarEvents = (
  setSelectedTask: (task: any) => void,
  setSheetOpen: (open: boolean) => void,
  taskUpdate: any
) => {
  const handleEventClick = (arg: any) => {
    // Use the full task object from extendedProps instead of reconstructing it
    // This ensures we get the original title, not the formatted one
    const task = arg.event.extendedProps.task;

    if (!task) {
      console.error('No task found in event extendedProps');
      return;
    }

    // Ouvrir le sheet d'édition avec la tâche sélectionnée
    setSelectedTask(task);
    setSheetOpen(true);
  };

  // Handler pour le drag & drop dans FullCalendar (vues Week/Month)
  const handleEventDrop = (info: any) => {
    const taskId = info.event.id;
    const newStart = info.event.start;
    const newEnd = info.event.end || newStart;
    
    // Mettre à jour les dates avec l'update optimiste
    taskUpdate.mutate({
      id: taskId,
      updates: {
        workPeriod: {
          startDate: newStart.toISOString(),
          endDate: newEnd.toISOString(),
        },
      },
    });
    
    // Pas de toast - les conflits seront affichés via les badges après le retour serveur
  };

  // Handler pour le resize dans FullCalendar
  const handleEventResize = (info: any) => {
    const taskId = info.event.id;
    const newStart = info.event.start;
    const newEnd = info.event.end || newStart;
    
    // Mettre à jour la durée avec l'update optimiste
    taskUpdate.mutate({
      id: taskId,
      updates: {
        workPeriod: {
          startDate: newStart.toISOString(),
          endDate: newEnd.toISOString(),
        },
      },
    });
  };

  return {
    handleEventClick,
    handleEventDrop,
    handleEventResize,
  };
};