import { useState } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { Member } from '@/services/api/members.service';
import { cn } from '@/lib/utils';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface MemberComboboxProps {
  members: Member[];
  selectedMembers: string[];
  onToggleMember: (memberId: string) => void;
  placeholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * MemberCombobox - Reusable multi-select combobox for members
 * Can be used with FilterStore or react-hook-form
 */
export function MemberCombobox({
  members,
  selectedMembers,
  onToggleMember,
  placeholder = 'Sélectionner des membres',
  emptyText = 'Aucun membre trouvé.',
  className,
  disabled = false,
}: MemberComboboxProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn('space-y-2', className)}>
      {/* Selected members badges */}
      {selectedMembers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedMembers.map(memberId => {
            const member = members.find(m => m.id === memberId);
            if (!member) return null;

            return (
              <Badge key={memberId} variant="default" className="gap-1">
                {member.name}
                {!disabled && (
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => onToggleMember(memberId)}
                  />
                )}
              </Badge>
            );
          })}
        </div>
      )}

      {/* Combobox */}
      <Popover open={open} onOpenChange={setOpen} modal={true}>
        <PopoverTrigger asChild disabled={disabled}>
          <Button
            variant="outline"
            role="combobox"
            disabled={disabled}
            className={cn(
              'w-full justify-between',
              !selectedMembers.length && 'text-muted-foreground'
            )}
          >
            {selectedMembers.length
              ? `${selectedMembers.length} membre(s) sélectionné(s)`
              : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder="Rechercher un membre..." />
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {members.map(member => (
                  <CommandItem
                    key={member.id}
                    value={member.name}
                    onSelect={() => onToggleMember(member.id)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        selectedMembers.includes(member.id)
                          ? 'opacity-100'
                          : 'opacity-0'
                      )}
                    />
                    {member.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
