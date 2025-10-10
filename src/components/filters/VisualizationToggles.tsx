import { useFilterStore } from '@/store/filter.store';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle, Building2 } from 'lucide-react';
import type { ColorMode } from '@/store/config.store';

/**
 * VisualizationToggles - Contrôles pour les options de visualisation
 *
 * Features:
 * - Design moderne avec ToggleGroup (même pattern que ViewSwitcher)
 * - Icônes + texte pour chaque mode de couleur
 * - État géré via FilterStore avec persistance
 * - Application immédiate des changements
 */
export function VisualizationToggles() {
  const { colorMode, setColorMode } = useFilterStore();

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between'>
        <Label className='text-sm font-medium'>Couleurs par</Label>
      </div>

      <TooltipProvider>
        <ToggleGroup
          type='single'
          value={colorMode}
          onValueChange={value => {
            if (value) {
              setColorMode(value as ColorMode);
            }
          }}
          className='border rounded-md h-10 bg-white'
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem
                value='client'
                aria-label='Couleurs par client'
                className='h-9 px-3 flex-1 bg-white hover:bg-gray-50 aria-[checked=true]:bg-black aria-[checked=true]:text-white'
              >
                <Building2 className='h-4 w-4' />
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent>
              <p>Couleurs par client</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem
                value='taskStatus'
                aria-label='Couleurs par statut'
                className='h-9 px-3 flex-1 bg-white hover:bg-gray-50 aria-[checked=true]:bg-black aria-[checked=true]:text-white'
              >
                <CheckCircle className='h-4 w-4' />
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent>
              <p>Couleurs par statut des tâches</p>
            </TooltipContent>
          </Tooltip>
        </ToggleGroup>
      </TooltipProvider>
    </div>
  );
}
