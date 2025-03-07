
import React from "react";
import { Routes, Route } from "react-router-dom";
import AuthPage from "@/pages/Auth";
import Properties from "@/pages/Properties";
import PropertyDetails from "@/pages/PropertyDetails";
import Tenants from "@/pages/Tenants";
import TenantDetails from "@/pages/TenantDetails";
import Documents from "@/pages/Documents";
import Settings from "@/pages/Settings";
import Financial from "@/pages/Financial";
import Utilities from "@/pages/Utilities";
import Chat from "@/pages/Chat";
import Maintenance from "@/pages/Maintenance";
import ServiceProviderProfile from "@/pages/ServiceProviderProfile";
import ServiceAreas from "@/pages/ServiceAreas";
import Services from "@/pages/Services";
import Earnings from "@/pages/Earnings";
import ServiceProviderDashboard from "@/pages/ServiceProviderDashboard";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import TenantRegistration from "@/pages/TenantRegistration";
import { ResetPassword } from "@/components/auth/ResetPassword";
import { UpdatePassword } from "@/components/auth/UpdatePassword";
import Index from "@/pages/Index";
import Info from "@/pages/Info";
import { useUserRole } from "@/hooks/use-user-role";
import PropertyTenants from "@/pages/PropertyTenants";
import GenerateContract from "@/pages/GenerateContract";
import ContractDetails from "@/pages/ContractDetails";
import PropertyTenantInvite from "@/pages/PropertyTenantInvite";
import Learn from "@/pages/Learn";

interface AppRoutesProps {
  isAuthenticated: boolean;
}

export function AppRoutes({ isAuthenticated }: AppRoutesProps) {
  const { userRole } = useUserRole();
  console.log("Current user role:", userRole);

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/update-password" element={<UpdatePassword />} />
      <Route path="/tenant-registration" element={<TenantRegistration />} />
      <Route path="/tenant-registration/:id" element={<TenantRegistration />} />
      <Route path="/info" element={<Info />} />
      
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <Index />
          </ProtectedRoute>
        }
      />
      <Route
        path="/service-provider-profile"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <ServiceProviderProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/service-areas"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <ServiceAreas />
          </ProtectedRoute>
        }
      />
      <Route
        path="/services"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <Services />
          </ProtectedRoute>
        }
      />
      <Route
        path="/earnings"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <Earnings />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/properties"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <Properties />
          </ProtectedRoute>
        }
      />
      <Route
        path="/properties/:id"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <PropertyDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/properties/:id/tenants"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <PropertyTenants />
          </ProtectedRoute>
        }
      />
      <Route
        path="/properties/:id/invite-tenant"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <PropertyTenantInvite />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tenants"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <Tenants />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tenants/:id"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <TenantDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/documents"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <Documents />
          </ProtectedRoute>
        }
      />
      <Route
        path="/documents/contracts/:id"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <ContractDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/generate-contract"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <GenerateContract />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/financial"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <Financial />
          </ProtectedRoute>
        }
      />
      <Route
        path="/utilities"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <Utilities />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <Chat />
          </ProtectedRoute>
        }
      />
      <Route
        path="/maintenance"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <Maintenance />
          </ProtectedRoute>
        }
      />
      <Route
        path="/learn"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <Learn />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default AppRoutes;
