import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface FilterState {
  isPanelOpen: boolean;
  togglePanel: () => void;

  selectedTeams: string[];
  setSelectedTeams: (teams: string[]) => void;
  toggleTeam: (teamId: string) => void;

  selectedMembers: string[];
  setSelectedMembers: (members: string[]) => void;

  selectedClients: string[];
  setSelectedClients: (clients: string[]) => void;

  selectedProjects: string[];
  setSelectedProjects: (projects: string[]) => void;

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
        // isPanelOpen is NOT persisted - always starts closed on refresh
        isPanelOpen: false,
        togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),

        selectedTeams: [],
        setSelectedTeams: (teams) => set({ selectedTeams: teams }),
        toggleTeam: (teamId) => set((state) => ({
          selectedTeams: state.selectedTeams.includes(teamId)
            ? state.selectedTeams.filter((id) => id !== teamId)
            : [...state.selectedTeams, teamId],
        })),

        selectedMembers: [],
        setSelectedMembers: (members) => set({ selectedMembers: members }),

        selectedClients: [],
        setSelectedClients: (clients) => set({ selectedClients: clients }),

        selectedProjects: [],
        setSelectedProjects: (projects) => set({ selectedProjects: projects }),

        showAvailability: false,
        toggleShowAvailability: () => set((state) => ({ showAvailability: !state.showAvailability })),

        colorMode: 'client',
        setColorMode: (mode) => set({ colorMode: mode }),

        resetFilters: () => set({
          selectedTeams: [],
          selectedMembers: [],
          selectedClients: [],
          selectedProjects: [],
          showAvailability: false,
          colorMode: 'client',
        }),
      }),
      {
        name: 'filter-state',
        // Exclude isPanelOpen from persistence
        partialize: (state) => ({
          selectedTeams: state.selectedTeams,
          selectedMembers: state.selectedMembers,
          selectedClients: state.selectedClients,
          selectedProjects: state.selectedProjects,
          showAvailability: state.showAvailability,
          colorMode: state.colorMode,
        }),
      }
    ),
    { name: 'FilterStore' }
  )
);
