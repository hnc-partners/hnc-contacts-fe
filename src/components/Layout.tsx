import type { ReactNode } from 'react';
import { AppHeader } from './AppHeader';

interface LayoutProps {
  /**
   * The page content to render inside the layout.
   */
  children: ReactNode;
}

/**
 * Layout
 *
 * Standard page layout with AppHeader and content area.
 * Left margin accounts for future sidebar (w-64 = 256px).
 */
export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      {/* Main Content - ml-64 reserves space for sidebar */}
      <main className="flex-1 lg:ml-64">{children}</main>
    </div>
  );
}
