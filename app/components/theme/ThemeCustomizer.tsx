import { useState } from 'react';
import { useStore } from '@nanostores/react';
import { IconButton } from '~/components/ui/IconButton';
import { themeStore } from '~/lib/stores/theme';

interface ThemeCustomizerProps {
  onClose: () => void;
}

export function ThemeCustomizer({ onClose }: ThemeCustomizerProps) {
  const currentTheme = useStore(themeStore);
  const [accentColor, setAccentColor] = useState('blue');
  const [fontSize, setFontSize] = useState('medium');
  const [compactMode, setCompactMode] = useState(false);
  const [animations, setAnimations] = useState(true);

  const accentColors = [
    { name: 'Blue', value: 'blue', color: '#3B82F6' },
    { name: 'Purple', value: 'purple', color: '#8B5CF6' },
    { name: 'Green', value: 'green', color: '#10B981' },
    { name: 'Orange', value: 'orange', color: '#F59E0B' },
    { name: 'Red', value: 'red', color: '#EF4444' },
    { name: 'Pink', value: 'pink', color: '#EC4899' },
  ];

  const fontSizes = [
    { name: 'Small', value: 'small' },
    { name: 'Medium', value: 'medium' },
    { name: 'Large', value: 'large' },
  ];

  const handleThemeChange = (theme: 'light' | 'dark') => {
    themeStore.set(theme);
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('flashio_theme', theme);
  };

  const applyCustomizations = () => {
    document.documentElement.setAttribute('data-accent', accentColor);
    document.documentElement.setAttribute('data-font-size', fontSize);
    document.documentElement.setAttribute('data-compact', compactMode.toString());
    document.documentElement.setAttribute('data-animations', animations.toString());
    
    localStorage.setItem('flashio_customizations', JSON.stringify({
      accentColor,
      fontSize,
      compactMode,
      animations
    }));
    
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-flashio-elements-background-depth-1 rounded-lg max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-flashio-elements-borderColor">
          <h2 className="text-xl font-semibold text-flashio-elements-textPrimary">
            Theme Customizer
          </h2>
          <IconButton onClick={onClose} size="md">
            <div className="i-ph:x text-lg" />
          </IconButton>
        </div>

        <div className="p-6 space-y-6">
          {/* Theme Selection */}
          <div>
            <h3 className="text-lg font-medium text-flashio-elements-textPrimary mb-3">
              Theme
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleThemeChange('light')}
                className={`p-4 border-2 rounded-lg transition-colors ${
                  currentTheme === 'light'
                    ? 'border-flashio-elements-borderColorActive bg-flashio-elements-button-primary-background'
                    : 'border-flashio-elements-borderColor bg-flashio-elements-background-depth-2 hover:border-flashio-elements-borderColorActive'
                }`}
              >
                <div className="i-ph:sun text-2xl text-flashio-elements-textPrimary mb-2" />
                <div className="text-sm font-medium text-flashio-elements-textPrimary">Light</div>
              </button>
              <button
                onClick={() => handleThemeChange('dark')}
                className={`p-4 border-2 rounded-lg transition-colors ${
                  currentTheme === 'dark'
                    ? 'border-flashio-elements-borderColorActive bg-flashio-elements-button-primary-background'
                    : 'border-flashio-elements-borderColor bg-flashio-elements-background-depth-2 hover:border-flashio-elements-borderColorActive'
                }`}
              >
                <div className="i-ph:moon text-2xl text-flashio-elements-textPrimary mb-2" />
                <div className="text-sm font-medium text-flashio-elements-textPrimary">Dark</div>
              </button>
            </div>
          </div>

          {/* Accent Color */}
          <div>
            <h3 className="text-lg font-medium text-flashio-elements-textPrimary mb-3">
              Accent Color
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {accentColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setAccentColor(color.value)}
                  className={`p-3 border rounded-lg flex items-center gap-2 transition-colors ${
                    accentColor === color.value
                      ? 'border-flashio-elements-borderColorActive bg-flashio-elements-button-primary-background'
                      : 'border-flashio-elements-borderColor bg-flashio-elements-background-depth-2 hover:border-flashio-elements-borderColorActive'
                  }`}
                >
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: color.color }}
                  />
                  <span className="text-sm text-flashio-elements-textPrimary">{color.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div>
            <h3 className="text-lg font-medium text-flashio-elements-textPrimary mb-3">
              Font Size
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {fontSizes.map((size) => (
                <button
                  key={size.value}
                  onClick={() => setFontSize(size.value)}
                  className={`p-3 border rounded-lg text-center transition-colors ${
                    fontSize === size.value
                      ? 'border-flashio-elements-borderColorActive bg-flashio-elements-button-primary-background'
                      : 'border-flashio-elements-borderColor bg-flashio-elements-background-depth-2 hover:border-flashio-elements-borderColorActive'
                  }`}
                >
                  <div className="text-sm text-flashio-elements-textPrimary">{size.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-flashio-elements-textPrimary">
              Options
            </h3>
            
            <label className="flex items-center justify-between p-3 bg-flashio-elements-background-depth-2 rounded-lg">
              <div>
                <div className="text-sm font-medium text-flashio-elements-textPrimary">Compact Mode</div>
                <div className="text-xs text-flashio-elements-textSecondary">Reduce spacing and padding</div>
              </div>
              <input
                type="checkbox"
                checked={compactMode}
                onChange={(e) => setCompactMode(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
            </label>
            
            <label className="flex items-center justify-between p-3 bg-flashio-elements-background-depth-2 rounded-lg">
              <div>
                <div className="text-sm font-medium text-flashio-elements-textPrimary">Animations</div>
                <div className="text-xs text-flashio-elements-textSecondary">Enable smooth transitions</div>
              </div>
              <input
                type="checkbox"
                checked={animations}
                onChange={(e) => setAnimations(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
            </label>
          </div>

          {/* Apply Button */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={applyCustomizations}
              className="flex-1 p-3 bg-flashio-elements-button-primary-background text-flashio-elements-button-primary-text rounded hover:bg-flashio-elements-button-primary-backgroundHover transition-colors"
            >
              Apply Changes
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-flashio-elements-button-secondary-background text-flashio-elements-button-secondary-text rounded hover:bg-flashio-elements-button-secondary-backgroundHover transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
