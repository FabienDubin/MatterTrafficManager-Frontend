import { Member } from '@/types/calendar.types';
import { Task } from '@/types/task.types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface MemberColumnHeaderProps {
  member: Member;
  taskCount: number;
  holidayTask?: Task;
  remoteTask?: Task;
  schoolTask?: Task;
}

/**
 * Header for member column with avatar, name, teams, and status badges
 */
export function MemberColumnHeader({
  member,
  taskCount,
  holidayTask,
  remoteTask,
  schoolTask
}: MemberColumnHeaderProps) {
  // Get member initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className='sticky top-0 z-30 bg-muted/30 border-b px-3 h-[4.5rem] flex items-center flex-shrink-0'>
      <div className='flex items-center gap-2 w-full'>
        <Avatar className='h-7 w-7'>
          <AvatarImage src={`/avatars/${member.id}.png`} alt={member.name} />
          <AvatarFallback className='text-xs'>{getInitials(member.name)}</AvatarFallback>
        </Avatar>
        <div className='flex-1 min-w-0'>
          <p className='text-sm font-medium truncate'>{member.name}</p>
          {/* Afficher les équipes si disponibles */}
          {(() => {
            // Priorité 1: teamsData (données enrichies)
            if (member.teamsData && member.teamsData.length > 0) {
              return (
                <p className='text-xs text-muted-foreground truncate'>
                  {member.teamsData.map(t => t.name).join(', ')}
                </p>
              );
            }
            // Priorité 2: teams (peut être des strings ou des objets)
            if (member.teams && member.teams.length > 0) {
              const teamNames = member.teams.map(team =>
                typeof team === 'object' && 'name' in team ? team.name : (team as string)
              );
              // N'afficher que si ce ne sont pas des IDs UUID
              const hasNames = teamNames.some(t => !t.includes('-'));
              if (hasNames) {
                return (
                  <p className='text-xs text-muted-foreground truncate'>{teamNames.join(', ')}</p>
                );
              }
            }
            return null;
          })()}
        </div>
        <div className='flex flex-col items-end gap-0.5'>
          {/* Badges de statut - emoji seulement avec tooltip */}
          {(holidayTask || remoteTask || schoolTask) && (
            <div className='flex gap-1'>
              <TooltipProvider>
                {holidayTask && (
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <div className='cursor-default'>
                        <Badge variant='secondary' className='text-xs px-1.5 h-5'>
                          🏖️
                        </Badge>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className='text-xs'>Congé</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {remoteTask && (
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <div className='cursor-default'>
                        <Badge variant='outline' className='text-xs px-1.5 h-5'>
                          🏠
                        </Badge>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className='text-xs'>Télétravail</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {schoolTask && (
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <div className='cursor-default'>
                        <Badge variant='secondary' className='text-xs px-1.5 h-5'>
                          📚
                        </Badge>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className='text-xs'>Formation</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </TooltipProvider>
            </div>
          )}
          {/* Badge du nombre de tâches */}
          <Badge
            variant='secondary'
            className='text-xs h-5 min-w-[1.25rem] flex items-center justify-center'
          >
            {taskCount}
          </Badge>
        </div>
      </div>
    </div>
  );
}
