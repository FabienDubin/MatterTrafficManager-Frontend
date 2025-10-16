import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { CalendarViewType } from '@/components/calendar/ViewSwitcher';

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
  showAvailabilityUserPreference: boolean;
  toggleShowAvailability: () => void;
  setShowAvailability: (enabled: boolean) => void;
  setShowAvailabilityUserPreference: (enabled: boolean) => void;
  canEnableAvailability: (currentView: CalendarViewType) => boolean;

  colorMode: 'client' | 'taskStatus';
  setColorMode: (mode: 'client' | 'taskStatus') => void;

  resetFilters: () => void;
}

// Helper to ensure array values
const ensureArray = (value: any): string[] => {
  return Array.isArray(value) ? value : [];
};

export const useFilterStore = create<FilterState>()(
  devtools(
    persist(
      (set) => ({
        // isPanelOpen is NOT persisted - always starts closed on refresh
        isPanelOpen: false,
        togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),

        selectedTeams: [],
        setSelectedTeams: (teams) => set({ selectedTeams: ensureArray(teams) }),
        toggleTeam: (teamId) => set((state) => {
          const teams = ensureArray(state.selectedTeams);
          return {
            selectedTeams: teams.includes(teamId)
              ? teams.filter((id) => id !== teamId)
              : [...teams, teamId],
          };
        }),

        selectedMembers: [],
        setSelectedMembers: (members) => set({ selectedMembers: ensureArray(members) }),

        selectedClients: [],
        setSelectedClients: (clients) => set({ selectedClients: ensureArray(clients) }),

        selectedProjects: [],
        setSelectedProjects: (projects) => set({ selectedProjects: ensureArray(projects) }),

        showAvailability: false,
        showAvailabilityUserPreference: false,
        
        toggleShowAvailability: () => set((state) => {
          const newValue = !state.showAvailability;
          return { 
            showAvailability: newValue,
            showAvailabilityUserPreference: newValue  // Sauvegarder la préférence
          };
        }),
        
        setShowAvailability: (enabled) => set({ showAvailability: enabled }),
        
        setShowAvailabilityUserPreference: (enabled) => set({ showAvailabilityUserPreference: enabled }),
        
        canEnableAvailability: (currentView) => currentView === 'week',

        colorMode: 'client',
        setColorMode: (mode) => set({ colorMode: mode }),

        resetFilters: () => set({
          selectedTeams: [],
          selectedMembers: [],
          selectedClients: [],
          selectedProjects: [],
          showAvailability: false,
          showAvailabilityUserPreference: false,
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
          showAvailabilityUserPreference: state.showAvailabilityUserPreference,
          colorMode: state.colorMode,
        }),
        // Migrate/validate persisted data to ensure arrays
        migrate: (persistedState: any, version: number) => {
          const state = persistedState as Partial<FilterState>;
          return {
            ...state,
            selectedTeams: Array.isArray(state.selectedTeams) ? state.selectedTeams : [],
            selectedMembers: Array.isArray(state.selectedMembers) ? state.selectedMembers : [],
            selectedClients: Array.isArray(state.selectedClients) ? state.selectedClients : [],
            selectedProjects: Array.isArray(state.selectedProjects) ? state.selectedProjects : [],
          };
        },
        version: 1, // Increment this to force migration
      }
    ),
    { name: 'FilterStore' }
  )
);
