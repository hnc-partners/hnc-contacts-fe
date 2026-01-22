import { createRootRoute, Outlet } from '@tanstack/react-router';

/**
 * Root Route
 *
 * The root layout for all routes in the application.
 * Wraps all child routes with common layout elements.
 */
export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <div className="min-h-screen bg-background">
      <Outlet />
    </div>
  );
}
