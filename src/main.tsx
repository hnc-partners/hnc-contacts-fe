import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { Toaster } from 'sonner';
import { AuthProvider, MockAuthProvider } from '@hnc-partners/auth-context';
import { routeTree } from './routeTree.gen';
import './index.css';

// Standalone dev mode: load shell theme vars so hsl(var(--background)) etc. resolve.
// In production, shell owns :root theming via index.css — this import is dead-code eliminated.
if (import.meta.env.DEV) {
  await import('@hnc-partners/ui-components/styles/dev-theme.css');
}

// Standalone mode detection - shell provides AuthProvider in federated mode
const isStandalone = !window.__SHELL__;

// Mock auth mode for local development without login
const isMockAuth = import.meta.env.VITE_MOCK_AUTH === 'true';

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

// Auth wrapper based on mode
const AuthWrapper = ({ children }: { children: React.ReactNode }) => {
  if (!isStandalone) {
    // Running in shell - shell provides auth
    return <>{children}</>;
  }
  if (isMockAuth) {
    // Local dev with mock auth - no login required
    return <MockAuthProvider>{children}</MockAuthProvider>;
  }
  // Standalone with real auth
  return (
    <AuthProvider authApiUrl={authApiUrl} storageKeyPrefix="hnc_">
      {children}
    </AuthProvider>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthWrapper>
        <AppContent />
      </AuthWrapper>
    </QueryClientProvider>
  </StrictMode>
);
