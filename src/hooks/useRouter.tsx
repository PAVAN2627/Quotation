import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

type Route =
  | { name: 'login' }
  | { name: 'dashboard' }
  | { name: 'new-quotation' }
  | { name: 'view-quotation'; id: string };

interface RouterContextValue {
  route: Route;
  navigate: (route: Route) => void;
}

const RouterContext = createContext<RouterContextValue | undefined>(undefined);

export function RouterProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<Route>(() => parseHash());

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = useCallback((newRoute: Route) => {
    window.location.hash = serializeRoute(newRoute);
    setRoute(newRoute);
  }, []);

  return <RouterContext.Provider value={{ route, navigate }}>{children}</RouterContext.Provider>;
}

function parseHash(): Route {
  const hash = window.location.hash.replace(/^#\/?/, '');
  const parts = hash.split('/').filter(Boolean);
  if (parts.length === 0) return { name: 'login' };
  if (parts[0] === 'dashboard') return { name: 'dashboard' };
  if (parts[0] === 'quotations' && parts[1] === 'new') return { name: 'new-quotation' };
  if (parts[0] === 'quotations' && parts[1] && parts[1] !== 'new') {
    return { name: 'view-quotation', id: parts[1] };
  }
  return { name: 'login' };
}

function serializeRoute(route: Route): string {
  switch (route.name) {
    case 'login':
      return '#/';
    case 'dashboard':
      return '#/dashboard';
    case 'new-quotation':
      return '#/quotations/new';
    case 'view-quotation':
      return `#/quotations/${route.id}`;
  }
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter must be used within RouterProvider');
  return ctx;
}
