import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, AlertCircle, Database, Link, Settings } from 'lucide-react';
import { notionConfigService } from '@/services/notion-config.service';
import { notionMappingService } from '@/services/notion-mapping.service';
import { useToast } from '@/hooks/use-toast';

interface DatabaseConfig {
  id: string;
  name: string;
  lastTestDate?: Date;
  lastTestStatus?: 'success' | 'error' | 'pending';
  lastTestMessage?: string;
  entryCount?: number;
}

interface NotionConfig {
  environment: string;
  notionToken: string;
  databases: {
    teams: DatabaseConfig;
    users: DatabaseConfig;
    clients: DatabaseConfig;
    projects: DatabaseConfig;
    traffic: DatabaseConfig;
  };
  mappings: any[];
  autoDetectEnabled: boolean;
  lastAutoDetectDate?: Date;
  version: number;
}

const NotionConfigPage: React.FC = () => {
  const [config, setConfig] = useState<NotionConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    notionToken: '',
    databases: {
      teams: { id: '268a12bfa99281f886bbd9ffc36be65f', name: 'Teams' },
      users: { id: '268a12bfa99281bf9101ebacbae3e39a', name: 'Users' },
      clients: { id: '268a12bfa99281fb8566e7917a7f8b8e7', name: 'Clients' },
      projects: { id: '268a12bfa9928105a95fde79cea0f6ff', name: 'Projects' },
      traffic: { id: '268a12bfa99281809af5f6a9d2fccbe3', name: 'Traffic' }
    }
  });
  
  const { toast } = useToast();
  
  useEffect(() => {
    loadConfiguration();
  }, []);
  
  const loadConfiguration = async () => {
    try {
      setLoading(true);
      const data = await notionConfigService.getConfig();
      setConfig(data);
      setFormData({
        notionToken: data.notionToken || '',
        databases: data.databases
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger la configuration',
        variant: 'destructive'
      });
      console.error('Error loading config:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSaveConfiguration = async () => {
    try {
      setSaving(true);
      await notionConfigService.saveConfig(formData);
      toast({
        title: 'Succès',
        description: 'Configuration sauvegardée avec succès',
      });
      await loadConfiguration();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la sauvegarde',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };
  
  const handleTestConnection = async (databaseName: string) => {
    try {
      setTesting(databaseName);
      const result = await notionConfigService.testConnection(databaseName);
      
      toast({
        title: 'Test réussi',
        description: `Connexion établie avec ${result.data.entryCount} entrées trouvées`,
      });
      
      await loadConfiguration();
    } catch (error: any) {
      toast({
        title: 'Test échoué',
        description: error.response?.data?.details || 'Impossible de se connecter à la base',
        variant: 'destructive'
      });
    } finally {
      setTesting(null);
    }
  };
  
  const handleAutoDetect = async (databaseName: string) => {
    try {
      setTesting(databaseName);
      const result = await notionMappingService.autoDetect(databaseName);
      
      toast({
        title: 'Détection réussie',
        description: `${result.data.detectedFields.length} champs détectés pour ${databaseName}`,
      });
      
      await loadConfiguration();
    } catch (error: any) {
      toast({
        title: 'Détection échouée',
        description: error.response?.data?.details || 'Erreur lors de la détection',
        variant: 'destructive'
      });
    } finally {
      setTesting(null);
    }
  };
  
  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };
  
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500">Connecté</Badge>;
      case 'error':
        return <Badge variant="destructive">Erreur</Badge>;
      default:
        return <Badge variant="secondary">Non testé</Badge>;
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Configuration Notion</h1>
          <p className="text-muted-foreground">
            Gérez les connexions aux bases de données Notion
          </p>
        </div>
        {config && (
          <div className="flex items-center gap-2">
            <Badge variant="outline">Version {config.version}</Badge>
            <Badge variant="outline">{config.environment}</Badge>
          </div>
        )}
      </div>
      
      <Tabs defaultValue="configuration" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="configuration" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="mapping" className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            Mapping
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="configuration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Token d'authentification</CardTitle>
              <CardDescription>
                Token d'intégration Notion pour accéder aux bases de données
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token">Token Notion</Label>
                <Input
                  id="token"
                  type="password"
                  placeholder="secret_..."
                  value={formData.notionToken}
                  onChange={(e) => setFormData({
                    ...formData,
                    notionToken: e.target.value
                  })}
                />
              </div>
              
              <Button
                onClick={handleSaveConfiguration}
                disabled={saving}
                className="w-full"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sauvegarde en cours...
                  </>
                ) : (
                  'Sauvegarder le token'
                )}
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Bases de données</CardTitle>
              <CardDescription>
                Configuration et test des 5 bases de données Notion
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(formData.databases).map(([key, db]) => (
                <div key={key} className="space-y-4 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Database className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <h3 className="font-semibold capitalize">{db.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          ID: {db.id}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {config?.databases[key as keyof typeof config.databases] && (
                        <>
                          {getStatusIcon(config.databases[key as keyof typeof config.databases].lastTestStatus)}
                          {getStatusBadge(config.databases[key as keyof typeof config.databases].lastTestStatus)}
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`db-${key}`}>ID de la base</Label>
                    <Input
                      id={`db-${key}`}
                      value={db.id}
                      onChange={(e) => setFormData({
                        ...formData,
                        databases: {
                          ...formData.databases,
                          [key]: { ...db, id: e.target.value }
                        }
                      })}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleTestConnection(key)}
                      disabled={testing === key}
                      className="flex-1"
                    >
                      {testing === key ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Test en cours...
                        </>
                      ) : (
                        'Tester la connexion'
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => handleAutoDetect(key)}
                      disabled={testing === key}
                      className="flex-1"
                    >
                      Détecter les champs
                    </Button>
                  </div>
                  
                  {config?.databases[key as keyof typeof config.databases]?.lastTestMessage && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Dernier test</AlertTitle>
                      <AlertDescription>
                        {config.databases[key as keyof typeof config.databases].lastTestMessage}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}
              
              <Button
                onClick={handleSaveConfiguration}
                disabled={saving}
                className="w-full"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sauvegarde en cours...
                  </>
                ) : (
                  'Sauvegarder la configuration'
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="mapping">
          <Card>
            <CardHeader>
              <CardTitle>Mapping des champs</CardTitle>
              <CardDescription>
                Configuration du mapping entre Notion et l'application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Le mapping des champs sera implémenté dans la prochaine étape.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NotionConfigPage;