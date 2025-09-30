import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ServiceLatencyChartProps {
  performance: any;
}

export function ServiceLatencyChart({ performance }: ServiceLatencyChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparaison des Latences</CardTitle>
        <CardDescription>
          Performance des différents services
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[
            { service: 'Redis Cache', latency: 12, status: 'optimal' },
            { service: 'Notion API', latency: 450, status: 'normal' },
            { service: 'MongoDB', latency: 35, status: 'optimal' },
            { service: 'API Backend', latency: performance.avgLatency, status: performance.avgLatency < 100 ? 'optimal' : 'normal' },
          ].map((service) => (
            <div key={service.service} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  service.status === 'optimal' ? "bg-green-500" : "bg-yellow-500"
                )} />
                <span className="text-sm font-medium w-32">{service.service}</span>
              </div>
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <Progress 
                  value={Math.min((service.latency / 500) * 100, 100)} 
                  className="h-2"
                />
                <span className="text-sm text-muted-foreground w-16 text-right">
                  {service.latency}ms
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}