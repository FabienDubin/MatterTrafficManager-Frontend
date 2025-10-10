import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Palette, CheckCircle } from 'lucide-react';
import { ClientColorsSection } from './colors/ClientColorsSection';
import { TaskStatusColorsSection } from './colors/TaskStatusColorsSection';

/**
 * ColorsTab - Onglet de configuration des couleurs pour le calendrier
 * 
 * Contient 2 sections :
 * - Couleurs Clients 
 * - Couleurs Statuts
 */
export function ColorsTab() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">Configuration des Couleurs</h3>
        <p className="text-muted-foreground text-sm">
          Configurez les couleurs d'affichage des tâches selon les modes : clients ou statuts
        </p>
      </div>

      {/* Sous-onglets pour les 2 types de couleurs */}
      <Tabs defaultValue="clients" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="clients" className="gap-2">
            <Palette className="h-4 w-4" />
            Clients
          </TabsTrigger>
          <TabsTrigger value="status" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Statuts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clients">
          <ClientColorsSection />
        </TabsContent>

        <TabsContent value="status">
          <TaskStatusColorsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}