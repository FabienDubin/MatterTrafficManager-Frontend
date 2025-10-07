import { useState, useEffect } from 'react';
import { useFilterStore } from '@/store/filter.store';
import { membersService, Member } from '@/services/api/members.service';
import { MemberCombobox } from '@/components/shared/MemberCombobox';
import { Button } from '@/components/ui/button';

/**
 * MemberMultiSelect - Multi-select combobox for filtering by members
 * Uses FilterStore for state management
 */
export function MemberMultiSelect() {
  const { selectedMembers, setSelectedMembers } = useFilterStore();
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load members on mount
  useEffect(() => {
    const loadMembers = async () => {
      setIsLoading(true);
      try {
        const data = await membersService.getAllMembers();
        setMembers(data);
      } catch (error) {
        console.error('[MemberMultiSelect] Failed to load members:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMembers();
  }, []);

  const toggleMember = (memberId: string) => {
    const members = Array.isArray(selectedMembers) ? selectedMembers : [];
    if (members.includes(memberId)) {
      setSelectedMembers(members.filter(id => id !== memberId));
    } else {
      setSelectedMembers([...members, memberId]);
    }
  };

  const clearAll = () => {
    setSelectedMembers([]);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Membres</label>
        </div>
        <div className="text-xs text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Membres</label>
        {selectedMembers.length > 0 && (
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
      <MemberCombobox
        members={members}
        selectedMembers={selectedMembers}
        onToggleMember={toggleMember}
      />
    </div>
  );
}
