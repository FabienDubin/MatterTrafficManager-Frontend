import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface SystemLoadChartProps {
  systemLoad: any[];
}

export function SystemLoadChart({ systemLoad }: SystemLoadChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Charge Système</CardTitle>
        <CardDescription>
          Utilisation des ressources serveur
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {systemLoad.map((load) => (
            <div key={load.metric}>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">{load.metric}</span>
                <span className={cn(
                  "text-sm",
                  load.current > load.threshold ? "text-red-600" : "text-muted-foreground"
                )}>
                  {load.current}% / {load.threshold}%
                </span>
              </div>
              <Progress 
                value={load.current} 
                className={cn(
                  "h-2",
                  load.current > load.threshold && "[&>div]:bg-red-500"
                )}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}