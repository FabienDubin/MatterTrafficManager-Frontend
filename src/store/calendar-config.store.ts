import { create } from 'zustand';
import { configService } from '@/services/api/config.service';

// Field options available for display
export const AVAILABLE_FIELDS = [
  { value: 'title', label: 'Titre' },
  { value: 'project', label: 'Projet' },
  { value: 'client', label: 'Client' },
  { value: 'member', label: 'Membre' },
  { value: 'status', label: 'Statut' },
  { value: 'notes', label: 'Notes' },
  { value: 'teams', label: 'Équipes' },
] as const;

export type FieldType = typeof AVAILABLE_FIELDS[number]['value'];

interface CalendarViewConfig {
  fields: FieldType[];
  maxTitleLength?: number;
}

interface CalendarConfig {
  dayView: CalendarViewConfig;
  weekView: CalendarViewConfig;
  monthView: CalendarViewConfig;
  showWeekends: boolean;
}

interface CalendarConfigState {
  config: CalendarConfig | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchConfig: () => Promise<void>;
  updateConfig: (viewType: 'dayView' | 'weekView' | 'monthView', config: CalendarViewConfig) => Promise<void>;
  saveConfig: () => Promise<void>;
}

// Default configuration
const DEFAULT_CONFIG: CalendarConfig = {
  dayView: {
    fields: ['title', 'project', 'client'],
    maxTitleLength: 30,
  },
  weekView: {
    fields: ['title', 'member'],
    maxTitleLength: 20,
  },
  monthView: {
    fields: ['title'],
    maxTitleLength: 15,
  },
  showWeekends: true,
};

export const useCalendarConfigStore = create<CalendarConfigState>((set, get) => ({
  config: null,
  isLoading: false,
  error: null,

  fetchConfig: async () => {
    set({ isLoading: true, error: null });
    try {
      // Fetch all calendar config keys in parallel
      const [dayFields, weekFields, monthFields, dayMaxLength, weekMaxLength, monthMaxLength, showWeekends] = 
        await Promise.allSettled([
          configService.getConfig('CALENDAR_DAY_VIEW_FIELDS'),
          configService.getConfig('CALENDAR_WEEK_VIEW_FIELDS'),
          configService.getConfig('CALENDAR_MONTH_VIEW_FIELDS'),
          configService.getConfig('CALENDAR_TITLE_MAX_LENGTH_DAY'),
          configService.getConfig('CALENDAR_TITLE_MAX_LENGTH_WEEK'),
          configService.getConfig('CALENDAR_TITLE_MAX_LENGTH_MONTH'),
          configService.getConfig('SHOW_WEEKENDS'),
        ]);

      // Helper function to parse value - handles both string and object
      const parseValue = (value: any) => {
        if (typeof value === 'string') {
          try {
            const parsed = JSON.parse(value);
            // Ensure it's an array
            return Array.isArray(parsed) ? parsed : value;
          } catch {
            return value;
          }
        }
        return value;
      };

      // Helper to ensure fields is always an array
      const ensureFieldsArray = (fields: any, defaultFields: FieldType[]): FieldType[] => {
        if (Array.isArray(fields)) {
          return fields;
        }
        // If it's a comma-separated string, split it
        if (typeof fields === 'string' && fields.includes(',')) {
          return fields.split(',').map(f => f.trim()) as FieldType[];
        }
        // Fallback to default
        return defaultFields;
      };

      const config: CalendarConfig = {
        dayView: {
          fields: ensureFieldsArray(
            dayFields.status === 'fulfilled' && dayFields.value
              ? parseValue(dayFields.value.value)
              : undefined,
            DEFAULT_CONFIG.dayView.fields
          ),
          maxTitleLength: dayMaxLength.status === 'fulfilled' && dayMaxLength.value
            ? typeof dayMaxLength.value.value === 'string'
              ? parseInt(dayMaxLength.value.value, 10)
              : dayMaxLength.value.value
            : DEFAULT_CONFIG.dayView.maxTitleLength,
        },
        weekView: {
          fields: ensureFieldsArray(
            weekFields.status === 'fulfilled' && weekFields.value
              ? parseValue(weekFields.value.value)
              : undefined,
            DEFAULT_CONFIG.weekView.fields
          ),
          maxTitleLength: weekMaxLength.status === 'fulfilled' && weekMaxLength.value
            ? typeof weekMaxLength.value.value === 'string'
              ? parseInt(weekMaxLength.value.value, 10)
              : weekMaxLength.value.value
            : DEFAULT_CONFIG.weekView.maxTitleLength,
        },
        monthView: {
          fields: ensureFieldsArray(
            monthFields.status === 'fulfilled' && monthFields.value
              ? parseValue(monthFields.value.value)
              : undefined,
            DEFAULT_CONFIG.monthView.fields
          ),
          maxTitleLength: monthMaxLength.status === 'fulfilled' && monthMaxLength.value
            ? typeof monthMaxLength.value.value === 'string'
              ? parseInt(monthMaxLength.value.value, 10)
              : monthMaxLength.value.value
            : DEFAULT_CONFIG.monthView.maxTitleLength,
        },
        showWeekends: showWeekends.status === 'fulfilled' && showWeekends.value
          ? showWeekends.value.value === true || showWeekends.value.value === 'true'
          : DEFAULT_CONFIG.showWeekends,
      };

      set({ config, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch calendar config:', error);
      set({ 
        config: DEFAULT_CONFIG,
        isLoading: false, 
        error: 'Impossible de charger la configuration' 
      });
    }
  },

  updateConfig: async (viewType, viewConfig) => {
    const currentConfig = get().config || DEFAULT_CONFIG;
    
    set({
      config: {
        ...currentConfig,
        [viewType]: viewConfig,
      },
    });
  },

  saveConfig: async () => {
    const { config } = get();
    if (!config) {return;}

    set({ isLoading: true, error: null });
    try {
      // Save all config values to backend using updateConfigs
      await configService.updateConfigs({
        CALENDAR_DAY_VIEW_FIELDS: JSON.stringify(config.dayView.fields),
        CALENDAR_WEEK_VIEW_FIELDS: JSON.stringify(config.weekView.fields),
        CALENDAR_MONTH_VIEW_FIELDS: JSON.stringify(config.monthView.fields),
        CALENDAR_TITLE_MAX_LENGTH_DAY: String(config.dayView.maxTitleLength || 30),
        CALENDAR_TITLE_MAX_LENGTH_WEEK: String(config.weekView.maxTitleLength || 20),
        CALENDAR_TITLE_MAX_LENGTH_MONTH: String(config.monthView.maxTitleLength || 15),
        SHOW_WEEKENDS: config.showWeekends,
      });

      set({ isLoading: false });
    } catch (error) {
      console.error('Failed to save calendar config:', error);
      set({ 
        isLoading: false, 
        error: 'Impossible de sauvegarder la configuration' 
      });
      throw error;
    }
  },
}));