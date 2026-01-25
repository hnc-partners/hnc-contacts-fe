import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { Toaster } from 'sonner';
import { AuthProvider } from '@hnc-partners/auth-context';
import { routeTree } from './routeTree.gen';
import './index.css';

// Standalone mode detection - shell provides AuthProvider in federated mode
const isStandalone = !window.__SHELL__;

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// Create the router instance
const router = createRouter({ routeTree });

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

// Auth API URL - defaults to production
const authApiUrl = import.meta.env.VITE_AUTH_URL || 'https://hncms-auth.scarif-0.duckdns.org';

// App content with router and toaster
const AppContent = () => (
  <>
    <RouterProvider router={router} />
    <Toaster
      position="bottom-right"
      theme="system"
      className="toaster group"
      toastOptions={{
        duration: 4000,
        classNames: {
          // Base toast styles
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',

          // Semantic toast type colors (subtle bg with colored border/icon)
          success:
            'group-[.toaster]:border-success group-[.toaster]:bg-success/10 group-[.toaster]:text-foreground [&>svg]:text-success [&>[data-description]]:text-muted-foreground',
          error:
            'group-[.toaster]:border-destructive group-[.toaster]:bg-destructive/10 group-[.toaster]:text-foreground [&>svg]:text-destructive [&>[data-description]]:text-muted-foreground',
          warning:
            'group-[.toaster]:border-warning group-[.toaster]:bg-warning/10 group-[.toaster]:text-foreground [&>svg]:text-warning [&>[data-description]]:text-muted-foreground',
          info: 'group-[.toaster]:border-info group-[.toaster]:bg-info/10 group-[.toaster]:text-foreground [&>svg]:text-info [&>[data-description]]:text-muted-foreground',
        },
      }}
    />
  </>
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      {isStandalone ? (
        <AuthProvider authApiUrl={authApiUrl} storageKeyPrefix="hnc_">
          <AppContent />
        </AuthProvider>
      ) : (
        <AppContent />
      )}
    </QueryClientProvider>
  </StrictMode>
);
