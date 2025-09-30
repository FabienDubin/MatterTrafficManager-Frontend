import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

interface ActiveUsersCardProps {
  activity: any;
}

export function ActiveUsersCard({ activity }: ActiveUsersCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Utilisateurs Actifs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <Users className="h-8 w-8 text-blue-500" />
          <div>
            <p className="text-2xl font-bold">{activity?.activeUsers || 0}</p>
            <p className="text-xs text-muted-foreground">
              Dans les 5 dernières minutes
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}