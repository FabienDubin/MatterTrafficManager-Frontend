import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface CachePerformanceChartProps {
  cache: any;
  cacheDistribution: any[];
}

export function CachePerformanceChart({ cache, cacheDistribution }: CachePerformanceChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance du Cache</CardTitle>
        <CardDescription>
          Taux de réussite et distribution
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Hit Rate</span>
              <span className="text-sm text-muted-foreground">{cache.hitRate}%</span>
            </div>
            <Progress value={cache.hitRate} className="h-2" />
          </div>
          
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie
                data={cacheDistribution}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={60}
                paddingAngle={5}
                dataKey="value"
              >
                {cacheDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="flex justify-around text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded" />
              <span>Hits: {Math.round(cache.totalRequests * cache.hitRate / 100)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded" />
              <span>Misses: {Math.round(cache.totalRequests * (100 - cache.hitRate) / 100)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}