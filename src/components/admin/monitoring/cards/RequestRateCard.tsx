import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';

interface RequestRateCardProps {
  activity: any;
}

export function RequestRateCard({ activity }: RequestRateCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Débit Requêtes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <Activity className="h-8 w-8 text-purple-500" />
          <div>
            <p className="text-2xl font-bold">
              {activity?.requestsPerMinute || 0}
              <span className="text-sm font-normal text-muted-foreground ml-1">req/min</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Moyenne sur 60 secondes
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}