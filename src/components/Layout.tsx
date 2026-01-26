import type { ReactNode } from 'react';

interface LayoutProps {
  /**
   * The page content to render inside the layout.
   */
  children: ReactNode;
}

/**
 * Layout
 *
 * Simple layout wrapper for shell integration.
 * Shell provides header and sidebar; we just wrap content.
 */
export function Layout({ children }: LayoutProps) {
  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      <main className="flex-1">{children}</main>
    </div>
  );
}
