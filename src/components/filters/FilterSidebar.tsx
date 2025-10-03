import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sidebar, SidebarContent, SidebarHeader, useSidebar } from '@/components/ui/sidebar';

/**
 * FilterSidebarTrigger - Custom trigger button for filter sidebar
 * Uses Filter icon instead of PanelLeft
 */
const FilterSidebarTrigger = React.forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentProps<typeof Button>
>(({ className, onClick, ...props }, ref) => {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      ref={ref}
      data-sidebar='trigger'
      variant='ghost'
      size='icon'
      className={cn('h-7 w-7', className)}
      onClick={event => {
        onClick?.(event);
        toggleSidebar();
      }}
      {...props}
    >
      <Filter className='h-4 w-4' />
      <span className='sr-only'>Toggle Filtres</span>
    </Button>
  );
});
FilterSidebarTrigger.displayName = 'FilterSidebarTrigger';

/**
 * FilterSidebar - Custom sidebar component for filters
 * Width: 24rem (384px) instead of default 16rem
 */
const FilterSidebar = React.forwardRef<HTMLDivElement, React.ComponentProps<typeof Sidebar>>(
  ({ className, style, ...props }, ref) => {
    return (
      <Sidebar
        ref={ref}
        className={cn('border-r bg-white', className)}
        style={
          {
            ...style,
            '--sidebar-width': '20rem',
          } as React.CSSProperties
        }
        {...props}
      />
    );
  }
);
FilterSidebar.displayName = 'FilterSidebar';

export { FilterSidebar, FilterSidebarTrigger, SidebarContent, SidebarHeader };
