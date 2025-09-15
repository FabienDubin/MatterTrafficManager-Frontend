import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  RefreshCw, 
  Trash2,
  Edit,
  Save,
  X
} from 'lucide-react';
import { notionMappingService } from '@/services/notion-mapping.service';
import { useToast } from '@/hooks/use-toast';

interface FieldMapping {
  applicationField: string;
  notionProperty: string;
  notionType: string;
  isRequired: boolean;
}

interface DatabaseMapping {
  databaseName: string;
  fields: FieldMapping[];
  lastMappingDate?: Date;
  mappedFieldsCount: number;
}

interface MappingTabProps {
  onRefresh?: () => void;
}

const NotionMappingTab: React.FC<MappingTabProps> = ({ onRefresh }) => {
  const [mappings, setMappings] = useState<Record<string, DatabaseMapping>>({});
  const [selectedDatabase, setSelectedDatabase] = useState('traffic');
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editedFields, setEditedFields] = useState<FieldMapping[]>([]);
  const [availableProperties, setAvailableProperties] = useState<string[]>([]);
  const { toast } = useToast();
  
  const databases = [
    { key: 'traffic', name: 'Traffic', icon: '📊' },
    { key: 'users', name: 'Users', icon: '👥' },
    { key: 'projects', name: 'Projects', icon: '📁' },
    { key: 'clients', name: 'Clients', icon: '🏢' },
    { key: 'teams', name: 'Teams', icon: '👨‍👩‍👧‍👦' }
  ];
  
  useEffect(() => {
    loadMappings();
  }, []);
  
  const loadMappings = async () => {
    try {
      setLoading(true);
      const response = await notionMappingService.getMapping();
      setMappings(response.data.mappings || {});
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les mappings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleAutoDetect = async (databaseName: string) => {
    try {
      const result = await notionMappingService.autoDetect(databaseName);
      toast({
        title: 'Détection réussie',
        description: `${result.data.detectedFields.length} champs détectés pour ${databaseName}`,
      });
      await loadMappings();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.response?.data?.details || 'Erreur lors de la détection',
        variant: 'destructive'
      });
    }
  };
  
  const handlePreview = async (databaseName: string) => {
    try {
      const result = await notionMappingService.previewMapping(databaseName, 3);
      toast({
        title: 'Preview généré',
        description: `${result.data.sampleCount} exemples récupérés`,
      });
      console.log('Preview data:', result.data.preview);
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.response?.data?.details || 'Erreur lors du preview',
        variant: 'destructive'
      });
    }
  };
  
  const handleEdit = () => {
    const currentMapping = mappings[selectedDatabase];
    if (currentMapping) {
      setEditedFields([...currentMapping.fields]);
      setEditMode(true);
      
      // Extract available properties for dropdown
      const properties = currentMapping.fields.map(f => f.notionProperty);
      setAvailableProperties(properties);
    }
  };
  
  const handleSave = async () => {
    try {
      await notionMappingService.saveMapping(selectedDatabase, editedFields);
      toast({
        title: 'Succès',
        description: 'Mapping sauvegardé avec succès',
      });
      setEditMode(false);
      await loadMappings();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.response?.data?.error || 'Erreur lors de la sauvegarde',
        variant: 'destructive'
      });
    }
  };
  
  const handleCancel = () => {
    setEditMode(false);
    setEditedFields([]);
  };
  
  const handleFieldChange = (index: number, field: string, value: string) => {
    const updated = [...editedFields];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setEditedFields(updated);
  };
  
  const handleReset = async () => {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser le mapping ?')) {
      await handleAutoDetect(selectedDatabase);
    }
  };
  
  const handleDelete = async () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer le mapping ?')) {
      try {
        await notionMappingService.saveMapping(selectedDatabase, []);
        toast({
          title: 'Succès',
          description: 'Mapping supprimé',
        });
        await loadMappings();
      } catch (error) {
        toast({
          title: 'Erreur',
          description: 'Erreur lors de la suppression',
          variant: 'destructive'
        });
      }
    }
  };
  
  const getTabIcon = (databaseKey: string) => {
    const mapping = mappings[databaseKey];
    if (!mapping || !mapping.fields || mapping.fields.length === 0) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
    return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  };
  
  const getTabLabel = (database: any) => {
    const mapping = mappings[database.key];
    const count = mapping?.mappedFieldsCount || 0;
    return (
      <div className="flex items-center gap-2">
        {getTabIcon(database.key)}
        <span>{database.name}</span>
        <Badge variant={count > 0 ? "default" : "secondary"}>
          {count}
        </Badge>
      </div>
    );
  };
  
  const currentMapping = mappings[selectedDatabase];
  const fields = editMode ? editedFields : (currentMapping?.fields || []);
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Mapping des champs</CardTitle>
          <CardDescription>
            Correspondance entre les champs de l'application et ceux de Notion
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedDatabase} onValueChange={setSelectedDatabase}>
            <TabsList className="grid grid-cols-5 w-full">
              {databases.map(db => (
                <TabsTrigger key={db.key} value={db.key}>
                  {getTabLabel(db)}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {databases.map(db => (
              <TabsContent key={db.key} value={db.key} className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">
                    Mapping pour {db.name}
                  </h3>
                  
                  <div className="flex gap-2">
                    {!editMode ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAutoDetect(db.key)}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Auto-détecter
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePreview(db.key)}
                        >
                          Preview
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleEdit}
                          disabled={!currentMapping || fields.length === 0}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={handleSave}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Sauvegarder
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCancel}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Annuler
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                
                {fields.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Champ Application</TableHead>
                        <TableHead className="w-16 text-center">Mapping</TableHead>
                        <TableHead>Champ Notion</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Requis</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.map((field, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono">
                            {field.applicationField}
                          </TableCell>
                          <TableCell className="text-center">
                            <ArrowRight className="h-4 w-4 text-muted-foreground mx-auto" />
                          </TableCell>
                          <TableCell>
                            {editMode ? (
                              <Select
                                value={field.notionProperty}
                                onValueChange={(value) => 
                                  handleFieldChange(index, 'notionProperty', value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableProperties.map(prop => (
                                    <SelectItem key={prop} value={prop}>
                                      {prop}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <span className="font-mono">{field.notionProperty}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {field.notionType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={field.isRequired ? "destructive" : "secondary"}>
                              {field.isRequired ? 'Requis' : 'Optionnel'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Aucun mapping configuré pour cette base. 
                      Cliquez sur "Auto-détecter" pour commencer.
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>
            ))}
          </Tabs>
          
          <div className="mt-6 pt-6 border-t">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-semibold mb-2">Résumé des mappings</h4>
                <div className="flex gap-4">
                  {databases.map(db => {
                    const mapping = mappings[db.key];
                    const count = mapping?.mappedFieldsCount || 0;
                    return (
                      <Card key={db.key} className="p-3">
                        <div className="flex items-center gap-2">
                          {count > 0 ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          )}
                          <span className="font-medium">{db.name}</span>
                          <Badge variant="outline">{count} champs</Badge>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="text-orange-600 hover:text-orange-700"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Réinitialiser
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDelete}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotionMappingTab;