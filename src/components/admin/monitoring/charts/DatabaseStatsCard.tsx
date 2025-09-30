import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database } from 'lucide-react';

interface DatabaseStatsCardProps {
  health: any;
  cache: any;
}

export function DatabaseStatsCard({ health, cache }: DatabaseStatsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Base de Données</CardTitle>
        <CardDescription>
          Statistiques MongoDB et Redis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">MongoDB</span>
            </div>
            <Badge variant="secondary">
              {health.mongodb === 'operational' ? 'Actif' : 'Hors ligne'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}