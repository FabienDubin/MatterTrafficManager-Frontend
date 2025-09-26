import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DateNavigatorProps {
  onNavigate: (direction: 'prev' | 'next' | 'today') => void;
}

export function DateNavigator({ onNavigate }: DateNavigatorProps) {
  return (
    <div className='inline-flex items-center gap-1 min-w-[280px]'>
      <Button
        variant='outline'
        size='sm'
        onClick={() => onNavigate('prev')}
        aria-label='Période précédente'
        className='h-10 px-3'
      >
        <ChevronLeft className='h-4 w-4' />
      </Button>

      <Button 
        variant='outline' 
        onClick={() => onNavigate('today')} 
        className='h-10 px-4 flex-1'
      >
        Aujourd'hui
      </Button>

      <Button
        variant='outline'
        size='sm'
        onClick={() => onNavigate('next')}
        aria-label='Période suivante'
        className='h-10 px-3'
      >
        <ChevronRight className='h-4 w-4' />
      </Button>
    </div>
  );
}
