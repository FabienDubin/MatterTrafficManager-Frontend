/**
 * Hook for handling calendar event interactions
 */
export const useCalendarEvents = (
  setSelectedTask: (task: any) => void,
  setSheetOpen: (open: boolean) => void,
  taskUpdate: any
) => {
  const handleEventClick = (arg: any) => {
    const task: any = {
      id: arg.event.id,
      title: arg.event.title,
      status: arg.event.extendedProps.status,
      description: arg.event.extendedProps.description,
      notes: arg.event.extendedProps.notes,
      assignedMembers: arg.event.extendedProps.assignedMembers,
      assignedMembersData: arg.event.extendedProps.assignedMembersData,
      projectId: arg.event.extendedProps.projectId,
      projectData: arg.event.extendedProps.projectData,
      clientId: arg.event.extendedProps.clientId,
      clientData: arg.event.extendedProps.clientData,
      teams: arg.event.extendedProps.teams,
      teamsData: arg.event.extendedProps.teamsData,
      involvedTeamIds: arg.event.extendedProps.involvedTeamIds,
      involvedTeamsData: arg.event.extendedProps.involvedTeamsData,
      workPeriod: {
        startDate: arg.event.startStr,
        endDate: arg.event.endStr,
      },
    };

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