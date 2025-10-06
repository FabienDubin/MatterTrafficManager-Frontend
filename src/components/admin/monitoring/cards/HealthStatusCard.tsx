import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface HealthStatusCardProps {
  health: any;
  isServerDown: boolean;
}

export function HealthStatusCard({ health, isServerDown }: HealthStatusCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Santé Globale</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isServerDown ? (
              <XCircle className="h-8 w-8 text-red-500" />
            ) : health.redis === 'operational' && health.api === 'operational' ? (
              <CheckCircle className="h-8 w-8 text-green-500" />
            ) : (
              <AlertCircle className="h-8 w-8 text-yellow-500" />
            )}
            <div>
              <p className="text-2xl font-bold">
                {isServerDown ? 'Hors ligne' : 
                 health.redis === 'operational' && health.api === 'operational' ? 'Optimal' : 'Dégradé'}
              </p>
              <p className="text-xs text-muted-foreground">
                {Object.values(health).filter(s => s === 'operational').length}/4 services actifs
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}