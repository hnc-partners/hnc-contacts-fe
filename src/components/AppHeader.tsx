import { Sun, Moon } from 'lucide-react';
import { Button } from '@hnc-partners/ui-components';
import { useTheme } from '@/hooks/useTheme';

/**
 * AppHeader
 *
 * Simple header with theme toggle.
 */
export function AppHeader() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:ml-64">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-end">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </header>
  );
}
