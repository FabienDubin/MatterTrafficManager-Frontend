import { useMemo } from 'react';
import { useTaskColors } from '@/store/config.store';
import { useFilterStore } from '@/store/filter.store';
import type { Task } from '@/types/task.types';

/**
 * Hook pour enrichir les tâches avec les couleurs selon le mode sélectionné
 * Applique les couleurs dynamiquement selon le colorMode du filter store
 */
export function useTasksWithColors(tasks: Task[]) {
  const { getColorForTask, allColorsLoaded } = useTaskColors();
  const { colorMode } = useFilterStore();

  const tasksWithColors = useMemo(() => {
    if (!tasks.length) {
      return tasks;
    }

    return tasks.map(task => ({
      ...task,
      dynamicColor: getColorForTask(task, colorMode),
    }));
  }, [tasks, getColorForTask, colorMode, allColorsLoaded]);

  return {
    tasks: tasksWithColors,
    colorMode,
    allColorsLoaded,
  };
}