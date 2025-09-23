import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Users, Database, Calendar } from 'lucide-react';

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard Administration</h1>
        <p className="text-muted-foreground mt-1">
          Vue d'ensemble du système Matter Traffic
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Utilisateurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">3 admins, 9 utilisateurs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Tâches aujourd'hui
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28</div>
            <p className="text-xs text-muted-foreground">15 terminées, 13 en cours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="h-4 w-4" />
              Cache Hit Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <p className="text-xs text-muted-foreground">Performance optimale</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              API Latence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42ms</div>
            <p className="text-xs text-muted-foreground">p95: 128ms</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
            <CardDescription>
              Dernières actions dans le système
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 bg-green-500 rounded-full" />
                <div className="flex-1">
                  <p className="text-sm">Synchronisation Notion réussie</p>
                  <p className="text-xs text-muted-foreground">Il y a 5 minutes</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 bg-blue-500 rounded-full" />
                <div className="flex-1">
                  <p className="text-sm">Cache warmup complété</p>
                  <p className="text-xs text-muted-foreground">Il y a 12 minutes</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 bg-yellow-500 rounded-full" />
                <div className="flex-1">
                  <p className="text-sm">Nouvel utilisateur connecté</p>
                  <p className="text-xs text-muted-foreground">Il y a 23 minutes</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statut des services</CardTitle>
            <CardDescription>
              État des différents services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">API Backend</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-green-600">Opérationnel</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Redis Cache</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-green-600">Opérationnel</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Notion API</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-green-600">Connecté</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Webhooks</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-yellow-500 rounded-full" />
                  <span className="text-xs text-yellow-600">Mode capture</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}