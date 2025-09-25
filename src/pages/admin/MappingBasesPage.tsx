import React from 'react';
import NotionMappingTab from '@/components/admin/NotionMappingTab';

const MappingBasesPage: React.FC = () => {
  const handleRefresh = () => {
    // Refresh logic if needed
    console.log('Refreshing mapping configuration...');
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mapping des Bases Notion</h1>
        <p className="text-muted-foreground">
          Gérez le mapping entre les champs Notion et votre application
        </p>
      </div>
      
      <NotionMappingTab onRefresh={handleRefresh} />
    </div>
  );
};

export default MappingBasesPage;