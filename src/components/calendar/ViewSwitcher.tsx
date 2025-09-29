import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { CalendarDays, CalendarRange, Calendar } from 'lucide-react';

export type CalendarViewType = 'day' | 'week' | 'month';

interface ViewSwitcherProps {
  currentView: CalendarViewType;
  onViewChange: (view: CalendarViewType) => void;
}

export function ViewSwitcher({ currentView, onViewChange }: ViewSwitcherProps) {
  return (
    <ToggleGroup 
      type="single" 
      value={currentView}
      onValueChange={(value) => {
        if (value) {onViewChange(value as CalendarViewType);}
      }}
      className="border rounded-md h-10 min-w-[280px]"
    >
      <ToggleGroupItem 
        value="day" 
        aria-label="Vue jour"
        className="gap-2 h-9 px-3 flex-1 data-[state=on]:bg-muted"
      >
        <Calendar className="h-4 w-4" />
        <span className="hidden sm:inline">Jour</span>
      </ToggleGroupItem>
      
      <ToggleGroupItem 
        value="week" 
        aria-label="Vue semaine"
        className="gap-2 h-9 px-3 flex-1 data-[state=on]:bg-muted"
      >
        <CalendarRange className="h-4 w-4" />
        <span className="hidden sm:inline">Semaine</span>
      </ToggleGroupItem>
      
      <ToggleGroupItem 
        value="month" 
        aria-label="Vue mois"
        className="gap-2 h-9 px-3 flex-1 data-[state=on]:bg-muted"
      >
        <CalendarDays className="h-4 w-4" />
        <span className="hidden sm:inline">Mois</span>
      </ToggleGroupItem>
    </ToggleGroup>
  );
}