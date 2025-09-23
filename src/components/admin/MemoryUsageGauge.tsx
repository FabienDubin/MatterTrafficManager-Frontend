import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Database, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MemoryUsageGaugeProps {
  data?: {
    usedMemory: number;
    usedMemoryHuman: string;
    usedMemoryPeak: number;
    usedMemoryPeakHuman: string;
    maxMemory: number;
    maxMemoryHuman: string;
    usedMemoryPercent: number;
    totalKeys: number;
    expiredKeys: number;
  };
  showDetails?: boolean;
  className?: string;
}

export function MemoryUsageGauge({ data, showDetails = false, className }: MemoryUsageGaugeProps) {
  if (!data) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Utilisation mémoire
          </CardTitle>
          <CardDescription>
            État de la mémoire Redis/Upstash
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-muted-foreground">Aucune donnée disponible</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const usagePercent = data.usedMemoryPercent || 0;
  
  // Determine status based on usage percentage
  const getStatus = () => {
    if (usagePercent < 50) return { color: 'green', icon: CheckCircle, text: 'Optimal' };
    if (usagePercent < 75) return { color: 'yellow', icon: TrendingUp, text: 'Normal' };
    return { color: 'red', icon: AlertTriangle, text: 'Élevé' };
  };

  const status = getStatus();
  const StatusIcon = status.icon;

  // Visual gauge representation
  const getGaugeColor = () => {
    if (usagePercent < 50) return 'bg-green-500';
    if (usagePercent < 75) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-4 w-4" />
          Utilisation mémoire
        </CardTitle>
        <CardDescription>
          État de la mémoire Redis/Upstash
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Circular Gauge */}
        <div className="relative mx-auto w-48 h-48">
          <svg className="w-48 h-48 transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              className="text-muted"
            />
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              strokeDasharray={`${(usagePercent / 100) * 553} 553`}
              className={cn(
                "transition-all duration-500",
                usagePercent < 50 ? "text-green-500" : 
                usagePercent < 75 ? "text-yellow-500" : "text-red-500"
              )}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <StatusIcon className={cn(
              "h-8 w-8 mb-2",
              status.color === 'green' ? "text-green-500" :
              status.color === 'yellow' ? "text-yellow-500" : "text-red-500"
            )} />
            <div className="text-3xl font-bold">{usagePercent.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground">{data.usedMemoryHuman}</div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center justify-center">
          <Badge 
            variant={status.color === 'green' ? 'default' : status.color === 'yellow' ? 'secondary' : 'destructive'}
            className="gap-1"
          >
            <StatusIcon className="h-3 w-3" />
            {status.text}
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Utilisation</span>
            <span className="font-medium">{data.usedMemoryHuman} / {data.maxMemoryHuman}</span>
          </div>
          <Progress value={usagePercent} className="h-2" />
        </div>

        {/* Detailed Stats */}
        {showDetails && (
          <div className="pt-4 border-t space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Pic d'utilisation</p>
                <p className="font-medium">{data.usedMemoryPeakHuman}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Clés totales</p>
                <p className="font-medium">{data.totalKeys}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Clés expirées</p>
                <p className="font-medium">{data.expiredKeys}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Ratio expiré</p>
                <p className="font-medium">
                  {data.totalKeys > 0 
                    ? ((data.expiredKeys / data.totalKeys) * 100).toFixed(1) 
                    : 0}%
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}