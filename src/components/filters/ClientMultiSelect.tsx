import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { useFilterStore } from '@/store/filter.store';
import { clientsService } from '@/services/api/clients.service';
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

interface Client {
  id: string;
  name: string;
}

/**
 * ClientMultiSelect - Multi-select combobox for filtering by clients
 * Uses FilterStore for state management
 */
export function ClientMultiSelect() {
  const { selectedClients, setSelectedClients } = useFilterStore();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // Load clients on mount
  useEffect(() => {
    const loadClients = async () => {
      setIsLoading(true);
      try {
        const response = await clientsService.getAllClients();
        setClients(response.data);
      } catch (error) {
        console.error('[ClientMultiSelect] Failed to load clients:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadClients();
  }, []);

  const toggleClient = (clientId: string) => {
    if (selectedClients.includes(clientId)) {
      setSelectedClients(selectedClients.filter(id => id !== clientId));
    } else {
      setSelectedClients([...selectedClients, clientId]);
    }
  };

  const removeClient = (clientId: string) => {
    setSelectedClients(selectedClients.filter(id => id !== clientId));
  };

  const clearAll = () => {
    setSelectedClients([]);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Clients</label>
        </div>
        <div className="text-xs text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Clients</label>
        {selectedClients.length > 0 && (
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
        {/* Badges des clients sélectionnés */}
        {selectedClients.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedClients.map((clientId) => {
              const client = clients.find((c) => c.id === clientId);
              if (!client) return null;
              return (
                <Badge key={clientId} variant="default" className="gap-1">
                  {client.name}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => removeClient(clientId)}
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
                !selectedClients.length && "text-muted-foreground"
              )}
            >
              {selectedClients.length > 0
                ? `${selectedClients.length} client(s) sélectionné(s)`
                : 'Sélectionner des clients'}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder="Rechercher un client..." />
            <CommandList>
              <CommandEmpty>Aucun client trouvé.</CommandEmpty>
              <CommandGroup>
                {clients.map((client) => {
                  const isSelected = selectedClients.includes(client.id);
                  return (
                    <CommandItem
                      key={client.id}
                      value={client.name}
                      onSelect={() => toggleClient(client.id)}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          isSelected ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      {client.name}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      </div>
    </div>
  );
}
