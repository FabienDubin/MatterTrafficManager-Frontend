import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { useFilterStore } from '@/store/filter.store';
import { projectsService, type Project } from '@/services/api/projects.service';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

/**
 * ProjectMultiSelect - Multi-select combobox for filtering by projects (active only)
 * Uses FilterStore for state management
 */
export function ProjectMultiSelect() {
  const { selectedProjects, setSelectedProjects } = useFilterStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // Load active projects on mount
  useEffect(() => {
    const loadProjects = async () => {
      setIsLoading(true);
      try {
        const activeProjects = await projectsService.getActiveProjects();
        setProjects(activeProjects);
      } catch (error) {
        console.error('[ProjectMultiSelect] Failed to load projects:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProjects();
  }, []);

  const toggleProject = (projectId: string) => {
    if (selectedProjects.includes(projectId)) {
      setSelectedProjects(selectedProjects.filter(id => id !== projectId));
    } else {
      setSelectedProjects([...selectedProjects, projectId]);
    }
  };

  const removeProject = (projectId: string) => {
    setSelectedProjects(selectedProjects.filter(id => id !== projectId));
  };

  const clearAll = () => {
    setSelectedProjects([]);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Projets en cours</label>
        </div>
        <div className="text-xs text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Projets en cours</label>
        {selectedProjects.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="h-auto py-0 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            Effacer
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {/* Badges des projets sélectionnés */}
        {selectedProjects.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedProjects.map((projectId) => {
              const project = projects.find((p) => p.id === projectId);
              if (!project) return null;
              return (
                <Badge key={projectId} variant="default" className="gap-1">
                  {project.name}
                  {project.clientName && (
                    <span className="text-xs text-muted-foreground">
                      ({project.clientName})
                    </span>
                  )}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => removeProject(projectId)}
                  />
                </Badge>
              );
            })}
          </div>
        )}

        {/* Combobox pour sélection */}
        <Popover open={open} onOpenChange={setOpen} modal={true}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className={cn(
                "w-full justify-between",
                !selectedProjects.length && "text-muted-foreground"
              )}
            >
              {selectedProjects.length > 0
                ? `${selectedProjects.length} projet(s) sélectionné(s)`
                : 'Sélectionner des projets'}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder="Rechercher un projet..." />
            <CommandList>
              <CommandEmpty>Aucun projet trouvé.</CommandEmpty>
              <CommandGroup>
                {projects.length > 0 ? (
                  projects.map((project) => {
                    const isSelected = selectedProjects.includes(project.id);
                    const displayName = project.clientName
                      ? `${project.name} (${project.clientName})`
                      : project.name;

                    return (
                      <CommandItem
                        key={project.id}
                        value={displayName}
                        onSelect={() => toggleProject(project.id)}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            isSelected ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        <div className="flex flex-col">
                          <span>{project.name}</span>
                          {project.clientName && (
                            <span className="text-xs text-muted-foreground">
                              {project.clientName}
                            </span>
                          )}
                        </div>
                      </CommandItem>
                    );
                  })
                ) : (
                  <div className="py-6 text-center text-sm">Chargement des projets...</div>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      </div>
    </div>
  );
}
