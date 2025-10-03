import { useQuery } from '@tanstack/react-query';
import { membersService, type Member } from '@/services/api/members.service';

/**
 * Hook pour récupérer tous les membres depuis l'API
 */
export function useMembers() {
  return useQuery<Member[]>({
    queryKey: ['members'],
    queryFn: () => membersService.getAllMembers(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}
