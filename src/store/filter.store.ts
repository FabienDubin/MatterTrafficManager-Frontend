import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface FilterState {
  isPanelOpen: boolean;
  togglePanel: () => void;

  selectedTeams: string[];
  setSelectedTeams: (teams: string[]) => void;

  selectedMembers: string[];
  setSelectedMembers: (members: string[]) => void;

  showAvailability: boolean;
  toggleShowAvailability: () => void;

  colorMode: 'client' | 'member' | 'taskStatus';
  setColorMode: (mode: 'client' | 'member' | 'taskStatus') => void;

  resetFilters: () => void;
}

export const useFilterStore = create<FilterState>()(
  devtools(
    persist(
      (set) => ({
        isPanelOpen: true,
        togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),

        selectedTeams: [],
        setSelectedTeams: (teams) => set({ selectedTeams: teams }),

        selectedMembers: [],
        setSelectedMembers: (members) => set({ selectedMembers: members }),

        showAvailability: false,
        toggleShowAvailability: () => set((state) => ({ showAvailability: !state.showAvailability })),

        colorMode: 'client',
        setColorMode: (mode) => set({ colorMode: mode }),

        resetFilters: () => set({
          selectedTeams: [],
          selectedMembers: [],
          showAvailability: false,
          colorMode: 'client',
        }),
      }),
      { name: 'filter-state' }
    ),
    { name: 'FilterStore' }
  )
);
