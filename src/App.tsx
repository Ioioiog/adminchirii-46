import { Routes, Route } from "react-router-dom";
import { AppRoutes } from "@/components/routing/AppRoutes";
import { MissingInfoModal } from "@/components/auth/MissingInfoModal";
import { Toaster } from "@/components/ui/toaster";

export default function App() {
  return (
    <>
      <AppRoutes />
      <MissingInfoModal />
      <Toaster />
    </>
  );
}
