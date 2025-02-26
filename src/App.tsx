
import { Routes, Route } from "react-router-dom";
import { AppRoutes } from "@/components/routing/AppRoutes";
import { MissingInfoModal } from "@/components/auth/MissingInfoModal";
import { Toaster } from "@/components/ui/toaster";
import { useAuthState } from "@/hooks/useAuthState";

export default function App() {
  const { isAuthenticated } = useAuthState();
  
  return (
    <>
      <AppRoutes isAuthenticated={isAuthenticated} />
      <MissingInfoModal />
      <Toaster />
    </>
  );
}
