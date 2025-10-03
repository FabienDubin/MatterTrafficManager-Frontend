import { Edit, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TeamConfig } from '@/store/config.store';
import * as LucideIcons from 'lucide-react';

interface TeamCardProps {
  team: TeamConfig;
  onEdit: (team: TeamConfig) => void;
  onDelete: (teamId: string) => void;
  isDragging?: boolean;
}

export function TeamCard({ team, onEdit, onDelete, isDragging }: TeamCardProps) {
  // Get the Lucide icon component dynamically
  const IconComponent = (LucideIcons as any)[team.icon] || LucideIcons.Users;

  return (
    <Card className={`transition-shadow ${isDragging ? 'shadow-lg' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          {/* Drag handle */}
          <div className="cursor-grab active:cursor-grabbing">
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>

          {/* Icon preview */}
          <div
            className="w-12 h-12 rounded-md flex items-center justify-center"
            style={{ backgroundColor: team.color }}
          >
            <IconComponent className="h-6 w-6 text-white" />
          </div>

          {/* Team info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{team.name}</p>
            <p className="text-xs text-muted-foreground">{team.icon} • {team.color}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(team)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(team.id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
