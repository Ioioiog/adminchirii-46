
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AppRoutes } from "@/components/routing/AppRoutes";
import { useAuthState } from "@/hooks/useAuthState";
import { InstallPWA } from "@/components/pwa/InstallPWA";
import { FloatingSettingsBox } from "@/components/settings/FloatingSettingsBox";
import { UserProfileModal } from "@/components/auth/UserProfileModal";
import "./App.css";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

function App() {
  // Get auth state without using toast here since we're at the root level
  const { isLoading, isAuthenticated, setIsAuthenticated } = useAuthState();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes isAuthenticated={isAuthenticated} />
        <InstallPWA />
        {isAuthenticated && (
          <>
            <FloatingSettingsBox />
            <UserProfileModal />
          </>
        )}
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
