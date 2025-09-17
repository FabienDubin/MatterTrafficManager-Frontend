import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, AlertCircle, Database, Link, Settings, Webhook, Copy, Wifi, Trash2, Download } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { notionConfigService } from '@/services/notion-config.service';
import { notionMappingService } from '@/services/notion-mapping.service';
import { useToast } from '@/hooks/use-toast';
import NotionMappingTab from '@/components/admin/NotionMappingTab';

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
  integrationToken: string;
  webhookVerificationToken?: string;
  webhookCaptureMode?: {
    enabled: boolean;
    enabledAt?: Date;
    capturedEvent?: {
      type: string;
      databaseId?: string;
      timestamp: Date;
      hasSignature: boolean;
    };
  };
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
  const [captureMode, setCaptureMode] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookToken, setWebhookToken] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    integrationToken: '',
    databases: {
      teams: { id: '268a12bfa99281f886bbd9ffc36be65f', name: 'Teams' },
      users: { id: '268a12bfa99281bf9101ebacbae3e39a', name: 'Users' },
      clients: { id: '268a12bfa99281fb8566e7917a7f8b8e', name: 'Clients' },
      projects: { id: '268a12bfa9928105a95fde79cea0f6ff', name: 'Projects' },
      traffic: { id: '268a12bfa99281809af5f6a9d2fccbe3', name: 'Traffic' }
    }
  });
  
  const { toast } = useToast();
  
  useEffect(() => {
    loadConfiguration();
    // Construire l'URL du webhook
    const baseUrl = window.location.origin.replace(':5173', ':5005');
    setWebhookUrl(`${baseUrl}/api/webhooks/notion`);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (captureMode) {
      // Poll pour vérifier si un event a été capturé
      interval = setInterval(async () => {
        const data = await notionConfigService.getConfig();
        if (data.webhookCaptureMode?.capturedEvent) {
          setCaptureMode(false);
          setConfig(data);
          toast({
            title: 'Token capturé !',
            description: 'Le webhook a été configuré avec succès',
          });
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [captureMode]);
  
  const loadConfiguration = async () => {
    try {
      setLoading(true);
      const data = await notionConfigService.getConfig();
      setConfig(data);
      setFormData({
        integrationToken: data.integrationToken || '',
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
      // Pass the current token from formData to test connection
      const result = await notionConfigService.testConnection(databaseName, formData.integrationToken);
      
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="configuration" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="mapping" className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            Mapping
          </TabsTrigger>
          <TabsTrigger value="webhook" className="flex items-center gap-2">
            <Webhook className="h-4 w-4" />
            Webhook
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
                  value={formData.integrationToken}
                  onChange={(e) => setFormData({
                    ...formData,
                    integrationToken: e.target.value
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
          <NotionMappingTab onRefresh={loadConfiguration} />
        </TabsContent>
        
        <TabsContent value="webhook" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuration du Webhook</CardTitle>
              <CardDescription>
                Configurez le webhook pour recevoir les mises à jour en temps réel depuis Notion
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Statut du webhook */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {config?.webhookVerificationToken ? (
                    <>
                      <Wifi className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium">Webhook configuré</p>
                        <p className="text-sm text-muted-foreground">Le webhook est prêt à recevoir des événements</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                      <div>
                        <p className="font-medium">Webhook non configuré</p>
                        <p className="text-sm text-muted-foreground">Activez le mode capture pour configurer</p>
                      </div>
                    </>
                  )}
                </div>
                {config?.webhookVerificationToken && (
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        const response = await notionConfigService.testWebhook();
                        toast({
                          title: 'Test réussi',
                          description: 'Le webhook fonctionne correctement',
                        });
                      } catch (error) {
                        toast({
                          title: 'Test échoué',
                          description: 'Le webhook ne répond pas',
                          variant: 'destructive',
                        });
                      }
                    }}
                  >
                    Tester le Webhook
                  </Button>
                )}
              </div>

              {/* URL du webhook */}
              <div className="space-y-2">
                <Label>URL du Webhook</Label>
                <div className="flex gap-2">
                  <Input
                    value={webhookUrl}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(webhookUrl);
                      toast({
                        title: 'Copié !',
                        description: 'L\'URL a été copiée dans le presse-papier',
                      });
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Copiez cette URL dans la configuration de votre intégration Notion
                </p>
              </div>

              {/* Webhook Verification Token - NOUVEAU */}
              <div className="space-y-2 p-4 border rounded-lg bg-muted/30">
                <Label htmlFor="webhook-token">Token de Vérification du Webhook</Label>
                <div className="flex gap-2">
                  <Input
                    id="webhook-token"
                    type="password"
                    placeholder="Collez le token capturé ici..."
                    value={webhookToken}
                    onChange={(e) => setWebhookToken(e.target.value)}
                    className="font-mono"
                  />
                  <Button
                    onClick={async () => {
                      if (!webhookToken.trim()) {
                        toast({
                          title: 'Erreur',
                          description: 'Veuillez entrer un token',
                          variant: 'destructive',
                        });
                        return;
                      }
                      
                      try {
                        setIsSaving(true);
                        await notionConfigService.updateWebhookToken(webhookToken);
                        toast({
                          title: 'Token sauvegardé',
                          description: 'Le token de vérification a été enregistré avec succès',
                        });
                        // Recharger la config pour voir le statut mis à jour
                        const updatedConfig = await notionConfigService.getConfig();
                        setConfig(updatedConfig);
                        setWebhookToken(''); // Clear the input after saving
                      } catch (error) {
                        toast({
                          title: 'Erreur',
                          description: 'Impossible de sauvegarder le token',
                          variant: 'destructive',
                        });
                      } finally {
                        setIsSaving(false);
                      }
                    }}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Sauvegarder'
                    )}
                  </Button>
                  {config?.webhookVerificationToken && (
                    <Button
                      variant="destructive"
                      onClick={async () => {
                        try {
                          await notionConfigService.removeWebhookToken();
                          toast({
                            title: 'Token supprimé',
                            description: 'Le token de vérification a été supprimé',
                          });
                          // Recharger la config
                          const updatedConfig = await notionConfigService.getConfig();
                          setConfig(updatedConfig);
                        } catch (error) {
                          toast({
                            title: 'Erreur',
                            description: 'Impossible de supprimer le token',
                            variant: 'destructive',
                          });
                        }
                      }}
                    >
                      Supprimer
                    </Button>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Entrez le token de vérification obtenu avec le script de capture (npm run capture-webhook)
                </p>
              </div>

              {/* Mode capture */}
              <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="capture-mode" className="text-base">Mode Capture</Label>
                    <p className="text-sm text-muted-foreground">
                      Active temporairement une route pour capturer le token de vérification
                    </p>
                  </div>
                  <Switch
                    id="capture-mode"
                    checked={captureMode}
                    onCheckedChange={async (checked) => {
                      setCaptureMode(checked);
                      if (checked) {
                        try {
                          await notionConfigService.enableCaptureMode();
                          toast({
                            title: 'Mode capture activé',
                            description: 'Modifiez une page dans Notion pour capturer le token',
                          });
                        } catch (error) {
                          setCaptureMode(false);
                          toast({
                            title: 'Erreur',
                            description: 'Impossible d\'activer le mode capture',
                            variant: 'destructive',
                          });
                        }
                      } else {
                        await notionConfigService.disableCaptureMode();
                      }
                    }}
                  />
                </div>

                {captureMode && (
                  <Alert>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <AlertTitle>En attente d'un événement...</AlertTitle>
                    <AlertDescription>
                      1. Allez dans Notion<br />
                      2. Modifiez n'importe quelle page dans une de vos bases<br />
                      3. Le token sera capturé automatiquement<br />
                      <span className="text-xs text-muted-foreground mt-2 block">
                        Timeout dans 5 minutes
                      </span>
                    </AlertDescription>
                  </Alert>
                )}

                {(config?.webhookCaptureMode?.capturedEvent || config?.webhookCaptureMode?.capturedRequest) && (
                  <div className="space-y-4">
                    <Alert className="border-green-500 bg-green-50 dark:bg-green-900/20">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <AlertTitle>Webhook capturé !</AlertTitle>
                      <AlertDescription>
                        {config.webhookCaptureMode.capturedRequest ? (
                          <>Timestamp: {new Date(config.webhookCaptureMode.capturedRequest.timestamp).toLocaleString()}</>
                        ) : config.webhookCaptureMode.capturedEvent ? (
                          <>
                            Type: {config.webhookCaptureMode.capturedEvent.type}<br />
                            Database: {config.webhookCaptureMode.capturedEvent.databaseId}<br />
                            Timestamp: {new Date(config.webhookCaptureMode.capturedEvent.timestamp).toLocaleString()}
                          </>
                        ) : null}
                      </AlertDescription>
                    </Alert>

                    {/* Captured Request Details */}
                    {config.webhookCaptureMode.capturedRequest && (
                      <Card className="border-2">
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <span>Données capturées</span>
                            <div className="space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const data = JSON.stringify(config.webhookCaptureMode.capturedRequest, null, 2);
                                  const blob = new Blob([data], { type: 'application/json' });
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = `webhook-capture-${Date.now()}.json`;
                                  a.click();
                                  URL.revokeObjectURL(url);
                                  toast({ title: 'Données exportées' });
                                }}
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Export
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  await notionConfigService.clearCapturedData();
                                  loadConfiguration();
                                  toast({ title: 'Données effacées' });
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Effacer
                              </Button>
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Secret Detection */}
                          {config.webhookCaptureMode.capturedRequest.detectedSecret && (
                            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <Label className="text-green-700 dark:text-green-400">✅ Secret détecté</Label>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    navigator.clipboard.writeText(config.webhookCaptureMode.capturedRequest.detectedSecret);
                                    toast({ title: 'Secret copié' });
                                  }}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="font-mono text-sm bg-white dark:bg-gray-800 p-2 rounded">
                                {config.webhookCaptureMode.capturedRequest.detectedSecret.substring(0, 20)}...
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                Trouvé dans: {config.webhookCaptureMode.capturedRequest.secretLocation}
                              </p>
                            </div>
                          )}

                          {/* Request Details */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <Label>Méthode & URL</Label>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const text = `${config.webhookCaptureMode.capturedRequest.method} ${config.webhookCaptureMode.capturedRequest.url}`;
                                  navigator.clipboard.writeText(text);
                                  toast({ title: 'Copié' });
                                }}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="font-mono text-sm bg-muted p-2 rounded">
                              {config.webhookCaptureMode.capturedRequest.method} {config.webhookCaptureMode.capturedRequest.url}
                            </div>
                          </div>

                          {/* Headers */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <Label>Headers</Label>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  navigator.clipboard.writeText(JSON.stringify(config.webhookCaptureMode.capturedRequest.headers, null, 2));
                                  toast({ title: 'Headers copiés' });
                                }}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                            <ScrollArea className="h-48 w-full rounded border bg-muted">
                              <pre className="p-4 text-xs">
                                {JSON.stringify(config.webhookCaptureMode.capturedRequest.headers, null, 2)}
                              </pre>
                            </ScrollArea>
                          </div>

                          {/* Body */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <Label>Body</Label>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  navigator.clipboard.writeText(JSON.stringify(config.webhookCaptureMode.capturedRequest.body, null, 2));
                                  toast({ title: 'Body copié' });
                                }}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                            <ScrollArea className="h-48 w-full rounded border bg-muted">
                              <pre className="p-4 text-xs">
                                {JSON.stringify(config.webhookCaptureMode.capturedRequest.body, null, 2)}
                              </pre>
                            </ScrollArea>
                          </div>

                          {/* Signature */}
                          {config.webhookCaptureMode.capturedRequest.signature && (
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <Label>Signature</Label>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    navigator.clipboard.writeText(config.webhookCaptureMode.capturedRequest.signature);
                                    toast({ title: 'Signature copiée' });
                                  }}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="font-mono text-sm bg-muted p-2 rounded break-all">
                                {config.webhookCaptureMode.capturedRequest.signature}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </div>

              {/* Instructions */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Configuration dans Notion</AlertTitle>
                <AlertDescription className="space-y-2 mt-2">
                  <p>Pour configurer le webhook dans Notion :</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Allez dans Settings & Members → Integrations → Développer vos propres intégrations</li>
                    <li>Sélectionnez votre intégration</li>
                    <li>Dans l'onglet "Webhooks", ajoutez l'URL ci-dessus</li>
                    <li>Sélectionnez les événements à écouter (page.created, page.updated, etc.)</li>
                    <li>Activez le mode capture ci-dessus puis modifiez une page pour capturer le token</li>
                  </ol>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NotionConfigPage;