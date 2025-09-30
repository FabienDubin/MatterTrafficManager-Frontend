import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface RequestTrendChartProps {
  requestTrendData: any[];
}

export function RequestTrendChart({ requestTrendData }: RequestTrendChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Évolution du Trafic</CardTitle>
        <CardDescription>
          Requêtes et latence sur les 20 dernières minutes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={requestTrendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="requests" 
              stroke="#8884d8" 
              name="Requêtes"
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="avgLatency" 
              stroke="#82ca9d" 
              name="Latence (ms)"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}