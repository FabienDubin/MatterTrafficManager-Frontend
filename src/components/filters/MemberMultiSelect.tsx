import { useState, useEffect } from 'react';
import { useFilterStore } from '@/store/filter.store';
import { membersService, Member } from '@/services/api/members.service';
import { MemberCombobox } from '@/components/shared/MemberCombobox';

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
    if (selectedMembers.includes(memberId)) {
      setSelectedMembers(selectedMembers.filter(id => id !== memberId));
    } else {
      setSelectedMembers([...selectedMembers, memberId]);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium">Membres</label>
        <div className="text-xs text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Membres</label>
      <MemberCombobox
        members={members}
        selectedMembers={selectedMembers}
        onToggleMember={toggleMember}
      />
    </div>
  );
}
