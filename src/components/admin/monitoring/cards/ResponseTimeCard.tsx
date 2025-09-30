import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, TrendingDown } from 'lucide-react';

interface ResponseTimeCardProps {
  performance: any;
}

export function ResponseTimeCard({ performance }: ResponseTimeCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Temps de Réponse</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <Zap className="h-8 w-8 text-yellow-500" />
          <div>
            <p className="text-2xl font-bold">
              {performance.avgLatency}ms
              {performance.avgLatency < 100 && (
                <TrendingDown className="h-4 w-4 text-green-500 inline ml-2" />
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              P95: {performance.p95Latency}ms
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}