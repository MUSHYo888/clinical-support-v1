
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MedicalProvider } from "@/context/MedicalContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import WelcomeSandbox from "./pages/WelcomeSandbox";
import Intake from "./pages/Intake";
import NewMedicalDashboard from "./pages/Dashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <MedicalProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<WelcomeSandbox />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <NewMedicalDashboard />
                </ProtectedRoute>
              } />
              <Route path="/intake" element={
                <ProtectedRoute>
                  <Intake />
                </ProtectedRoute>
              } />
              <Route path="/workflow" element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          <footer className="app-footer">Clinical Decision Support - v1.0</footer>
        </MedicalProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
