import { useDisplayedTeams } from '@/store/config.store';
import { useFilterStore } from '@/store/filter.store';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import * as LucideIcons from 'lucide-react';

/**
 * TeamToggles - Toggle buttons for team filtering
 *
 * Displays configured teams from admin config with their custom icon and color.
 * Manages selection state via filter store.
 */
export function TeamToggles() {
  const { displayedTeams, isTeamsLoaded } = useDisplayedTeams();
  const { selectedTeams, toggleTeam, setSelectedTeams } = useFilterStore();

  const clearAll = () => {
    setSelectedTeams([]);
  };

  if (!isTeamsLoaded) {
    return (
      <div className='space-y-2'>
        <div className='flex items-center justify-between'>
          <label className='text-sm font-medium'>Équipes</label>
        </div>
        <div className='text-xs text-muted-foreground'>Chargement...</div>
      </div>
    );
  }

  if (displayedTeams.length === 0) {
    return (
      <div className='space-y-2'>
        <div className='flex items-center justify-between'>
          <label className='text-sm font-medium'>Équipes</label>
        </div>
        <div className='text-xs text-muted-foreground'>Aucune équipe configurée</div>
      </div>
    );
  }

  return (
    <div className='space-y-2'>
      <div className='flex items-center justify-between'>
        <label className='text-sm font-medium'>Équipes</label>
        {selectedTeams.length > 0 && (
          <Button
            variant='ghost'
            size='sm'
            onClick={clearAll}
            className='h-auto py-0 px-2 text-xs text-muted-foreground hover:text-foreground'
          >
            Effacer
          </Button>
        )}
      </div>
      <div className='flex justify-around'>
        <TooltipProvider>
          {displayedTeams.map(team => {
            const IconComponent = (LucideIcons as any)[team.icon] || LucideIcons.Users;
            const isSelected = selectedTeams.includes(team.id);

            return (
              <Tooltip key={team.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant={isSelected ? 'default' : 'secondary'}
                    size='icon'
                    onClick={() => toggleTeam(team.id)}
                    className='h-12 w-12'
                  >
                    <IconComponent />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{team.name}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </div>
    </div>
  );
}
