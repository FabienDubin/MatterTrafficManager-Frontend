import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shuffle, Check } from 'lucide-react';
import { generateRandomPastelColor, getContrastColor, isValidHexColor } from '@/utils/colorUtils';

interface ColorEditorProps {
  id: string;
  name: string;
  subtitle?: string;
  color: string;
  onColorChange: (id: string, color: string) => void;
}

/**
 * ColorEditor - Composant générique pour éditer une couleur
 * Adapté du ClientColorEditor pour être réutilisable
 */
export const ColorEditor = ({ id, name, subtitle, color, onColorChange }: ColorEditorProps) => {
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

  const handleCancel = React.useCallback(() => {
    setLocalColor(color);
    setIsValid(true);
    setIsEditing(false);
  }, [color]);

  // Handle click outside to cancel editing
  useEffect(() => {
    if (!isEditing) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        handleCancel();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isEditing, handleCancel]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleColorClick = () => {
    setIsEditing(true);
  };

  const handleInputChange = (value: string) => {
    setLocalColor(value);
    setIsValid(isValidHexColor(value));
  };

  const handleConfirm = () => {
    if (isValid && localColor !== color) {
      onColorChange(id, localColor);
    }
    setIsEditing(false);
  };

  // handleCancel déjà défini plus haut avec useCallback

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleRandomize = () => {
    const newColor = generateRandomPastelColor();
    setLocalColor(newColor);
    setIsValid(true);
    onColorChange(id, newColor);
  };

  // textColor removed - not used in this layout

  return (
    <div
      ref={containerRef}
      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-center gap-3 flex-1">
        {/* Color Preview */}
        <div
          className="w-10 h-10 rounded-md border-2 border-border cursor-pointer flex-shrink-0 transition-all hover:scale-105"
          style={{ backgroundColor: localColor }}
          onClick={handleColorClick}
          title="Cliquer pour éditer"
        />

        {/* Name and Subtitle */}
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{name}</div>
          {subtitle && (
            <div className="text-sm text-muted-foreground truncate">{subtitle}</div>
          )}
        </div>

        {/* Color Input when editing */}
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              value={localColor}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className={`w-24 h-8 text-xs font-mono ${!isValid ? 'border-destructive' : ''}`}
              placeholder="#RRGGBB"
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={handleConfirm}
              disabled={!isValid}
              className="h-8 w-8 p-0"
            >
              <Check className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {/* Color Value Display */}
            <code className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              {localColor.toUpperCase()}
            </code>
            
            {/* Randomize Button */}
            <Button
              size="sm"
              variant="ghost"
              onClick={handleRandomize}
              className="h-8 w-8 p-0"
              title="Couleur aléatoire"
            >
              <Shuffle className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};