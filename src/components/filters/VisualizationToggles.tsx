import { useFilterStore } from '@/store/filter.store';
import { useCalendarStore } from '@/store/calendar.store';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { CheckCircle, Building2, Users, UserCheck } from 'lucide-react';

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
  const {
    colorMode,
    setColorMode,
    showAvailability,
    toggleShowAvailability,
    canEnableAvailability,
  } = useFilterStore();
  const { currentView } = useCalendarStore();

  const isWeekView = canEnableAvailability(currentView);

  return (
    <div className='space-y-4'>
      {/* Toggle Vue Disponibilité */}
      <div className='space-y-3'>
        <div className='flex items-center justify-between'>
          <Label className='text-sm font-medium'>Mode disponibilité</Label>
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showAvailability ? 'default' : 'outline'}
                disabled={!isWeekView}
                onClick={toggleShowAvailability}
                aria-label='Vue disponibilité'
                className={`h-10 w-full justify-start gap-2 ${
                  !isWeekView ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {showAvailability ? (
                  <UserCheck className='h-4 w-4' />
                ) : (
                  <Users className='h-4 w-4' />
                )}
                <span className='text-sm'>
                  {showAvailability
                    ? 'Désactiver le mode disponibilité'
                    : 'Activer le mode disponibilité'}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {!isWeekView
                  ? 'Disponible uniquement en vue semaine'
                  : showAvailability
                    ? 'Revenir à la vue tâches'
                    : 'Afficher la disponibilité des membres'}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Separator />

      {/* Couleurs par (désactivé en mode disponibilité) */}
      <div className='space-y-3'>
        <div className='flex items-center justify-between'>
          <Label
            className={`text-sm font-medium ${showAvailability ? 'text-muted-foreground' : ''}`}
          >
            Couleurs par
          </Label>
        </div>

        <div
          className={`flex border rounded-md bg-muted p-1 gap-1 ${showAvailability ? 'opacity-50' : ''}`}
        >
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={colorMode === 'client' ? 'default' : 'ghost'}
                  size='sm'
                  onClick={() => setColorMode('client')}
                  disabled={showAvailability}
                  aria-label='Couleurs par client'
                  className='flex-1 gap-2 border-0'
                >
                  <Building2 className='h-4 w-4' />
                  <span className='text-xs'>Client</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {showAvailability ? 'Indisponible en mode disponibilité' : 'Couleurs par client'}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={colorMode === 'taskStatus' ? 'default' : 'ghost'}
                  size='sm'
                  onClick={() => setColorMode('taskStatus')}
                  disabled={showAvailability}
                  aria-label='Couleurs par statut'
                  className='flex-1 gap-2 border-0'
                >
                  <CheckCircle className='h-4 w-4' />
                  <span className='text-xs'>Statut</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {showAvailability
                    ? 'Indisponible en mode disponibilité'
                    : 'Couleurs par statut des tâches'}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}
