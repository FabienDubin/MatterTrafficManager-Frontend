import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Layout, Palette } from 'lucide-react';
import { ConfigTab } from './calendar-config/ConfigTab';
import { LayoutTab } from './calendar-config/LayoutTab';
import { ColorsTab } from './calendar-config/ColorsTab';

export function CalendarConfigPage() {

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Configuration du Calendrier</h2>
        <p className="text-muted-foreground mt-1">
          Configurez l'affichage, les filtres et les couleurs du calendrier
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="config" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="config" className="gap-2">
            <Settings className="h-4 w-4" />
            Config
          </TabsTrigger>
          <TabsTrigger value="layout" className="gap-2">
            <Layout className="h-4 w-4" />
            Layout
          </TabsTrigger>
          <TabsTrigger value="colors" className="gap-2">
            <Palette className="h-4 w-4" />
            Couleurs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="config">
          <ConfigTab />
        </TabsContent>

        <TabsContent value="layout">
          <LayoutTab />
        </TabsContent>

        <TabsContent value="colors">
          <ColorsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}