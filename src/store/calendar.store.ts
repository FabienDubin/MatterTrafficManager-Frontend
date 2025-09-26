import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CalendarViewType } from '@/components/calendar/ViewSwitcher';

interface CalendarState {
  // Current view (day, week, month)
  currentView: CalendarViewType;
  // Current date for navigation
  currentDate: Date;
  
  // Actions
  setCurrentView: (view: CalendarViewType) => void;
  setCurrentDate: (date: Date) => void;
  navigateToToday: () => void;
}

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set) => ({
      // Initial state
      currentView: 'week',
      currentDate: new Date(),
      
      // Actions
      setCurrentView: (view) => set({ currentView: view }),
      
      setCurrentDate: (date) => set({ currentDate: date }),
      
      navigateToToday: () => set({ currentDate: new Date() }),
    }),
    {
      name: 'calendar-storage', // localStorage key
      // Custom serialization to handle Date objects
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const state = JSON.parse(str);
          // Convert date string back to Date object
          if (state.state?.currentDate) {
            state.state.currentDate = new Date(state.state.currentDate);
          }
          return state;
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);