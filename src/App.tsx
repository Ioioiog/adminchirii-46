import React from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import ServiceProviderProfile from "./pages/ServiceProviderProfile";
import Properties from "./pages/Properties";
import Tenants from "./pages/Tenants";
import Maintenance from "./pages/Maintenance";
import Documents from "./pages/Documents";
import Financial from "./pages/Financial";
import Utilities from "./pages/Utilities";
import Chat from "./pages/Chat";
import Settings from "./pages/Settings";
import Info from "./pages/Info";
import Earnings from "./pages/Earnings";
import ServiceAreas from "./pages/ServiceAreas";
import Contracts from "./pages/documents/Contracts";
import Leases from "./pages/documents/Leases";
import Payments from "./pages/financial/Payments";
import RentEstimator from "./pages/properties/RentEstimator";
import { useAuthState } from './hooks/useAuthState';
import { createClient } from '@supabase/supabase-js'
import { ThemeProvider } from "@/components/theme-provider"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "@/components/ui/toaster"

// Add the Documentation page import
import Documentation from "./pages/Documentation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuthState();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <Info />,
  },
  {
    path: "/auth",
    element: <Auth />,
  },
  {
    path: "/dashboard",
    element: <ProtectedRoute><Index /></ProtectedRoute>,
  },
  {
    path: "/profile",
    element: <ProtectedRoute><Profile /></ProtectedRoute>,
  },
  {
    path: "/service-provider-profile",
    element: <ProtectedRoute><ServiceProviderProfile /></ProtectedRoute>,
  },
  {
    path: "/properties",
    element: <ProtectedRoute><Properties /></ProtectedRoute>,
  },
  {
    path: "/properties/rent-estimator",
    element: <ProtectedRoute><RentEstimator /></ProtectedRoute>,
  },
  {
    path: "/tenants",
    element: <ProtectedRoute><Tenants /></ProtectedRoute>,
  },
  {
    path: "/maintenance",
    element: <ProtectedRoute><Maintenance /></ProtectedRoute>,
  },
  {
    path: "/documents",
    element: <ProtectedRoute><Documents /></ProtectedRoute>,
  },
  {
    path: "/documents/contracts",
    element: <ProtectedRoute><Contracts /></ProtectedRoute>,
  },
  {
    path: "/documents/leases",
    element: <ProtectedRoute><Leases /></ProtectedRoute>,
  },
  {
    path: "/financial",
    element: <ProtectedRoute><Financial /></ProtectedRoute>,
  },
  {
    path: "/financial/payments",
    element: <ProtectedRoute><Payments /></ProtectedRoute>,
  },
  {
    path: "/utilities",
    element: <ProtectedRoute><Utilities /></ProtectedRoute>,
  },
  {
    path: "/chat",
    element: <ProtectedRoute><Chat /></ProtectedRoute>,
  },
  {
    path: "/settings",
    element: <ProtectedRoute><Settings /></ProtectedRoute>,
  },
  {
    path: "/earnings",
    element: <ProtectedRoute><Earnings /></ProtectedRoute>,
  },
  {
    path: "/service-areas",
    element: <ProtectedRoute><ServiceAreas /></ProtectedRoute>,
  },
  // Add the Documentation route to the router
  {
    path: "/documentation",
    element: <ProtectedRoute><Documentation /></ProtectedRoute>,
  },
]);

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-react-theme">
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
