import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shuffle, Check } from 'lucide-react';
import { generateRandomPastelColor, getContrastColor, isValidHexColor } from '@/utils/colorUtils';
import type { Client } from '@/types/client.types';

interface ClientColorEditorProps {
  client: Client;
  color: string;
  onColorChange: (clientId: string, color: string) => void;
}

export const ClientColorEditor = ({ client, color, onColorChange }: ClientColorEditorProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localColor, setLocalColor] = useState(color);
  const [isValid, setIsValid] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync local color with prop
  useEffect(() => {
    setLocalColor(color);
    setIsValid(true);
  }, [color]);

  // Handle click outside to cancel editing
  useEffect(() => {
    if (!isEditing) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        handleCancel();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditing, color]); // Include color to reset properly

  const handleStartEdit = () => {
    setIsEditing(true);
  };

  const handleValidate = () => {
    if (isValid) {
      onColorChange(client.id, localColor);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setLocalColor(color); // Reset to original
    setIsValid(true);
    setIsEditing(false);
  };

  const handleRandomColor = () => {
    const randomColor = generateRandomPastelColor();
    setLocalColor(randomColor);
    setIsValid(true);
    inputRef.current?.focus();
  };

  const handleColorChange = (value: string) => {
    setLocalColor(value);
    setIsValid(isValidHexColor(value));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleValidate();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const textColor = getContrastColor(localColor);

  return (
    <div ref={containerRef} className='flex items-center gap-3 p-3 rounded-lg border'>
      <div
        className='w-12 h-12 rounded-md border cursor-pointer transition-transform hover:scale-110'
        style={{
          backgroundColor: isValid ? localColor : '#E5E7EB',
          color: textColor,
        }}
        onClick={handleStartEdit}
        title='Cliquer pour modifier'
      >
        <div className='w-full h-full flex items-center justify-center text-xs font-medium'>
          {client.name.substring(0, 2).toUpperCase()}
        </div>
      </div>

      <div className='flex-1 min-w-0'>
        <p className='text-sm font-medium truncate'>{client.name}</p>
        {isEditing ? (
          <div className='space-y-1'>
            <div className='flex gap-1 mt-1'>
              <Input
                ref={inputRef}
                type='text'
                value={localColor}
                onChange={e => handleColorChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder='#RRGGBB'
                className={`h-7 text-xs ${!isValid ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                autoFocus
              />
              <Button
                size='sm'
                variant='outline'
                className='h-7 px-2'
                onClick={handleRandomColor}
                type='button'
                title='Générer une couleur aléatoire'
              >
                <Shuffle className='h-3 w-3' />
              </Button>
              <Button
                size='sm'
                variant='outline'
                className='h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-50'
                onClick={handleValidate}
                disabled={!isValid}
                type='button'
                title='Valider'
              >
                <Check className='h-3 w-3' />
              </Button>
            </div>
            {!isValid && (
              <p className='text-xs text-red-600'>
                Format invalide. Utilisez #RRGGBB (ex: #FF5733)
              </p>
            )}
          </div>
        ) : (
          <p className='text-xs text-muted-foreground'>{localColor}</p>
        )}
      </div>
    </div>
  );
};
