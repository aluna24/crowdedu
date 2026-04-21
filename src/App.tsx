import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GymProvider } from "@/context/GymContext";
import { AuthProvider } from "@/context/AuthContext";
import { PassProvider } from "@/context/PassContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Header from "@/components/Header";
import Home from "./pages/Home";
import Capacity from "./pages/Capacity";
import GroupFitness from "./pages/GroupFitness";
import Intramurals from "./pages/Intramurals";
import IntramuralAccept from "./pages/IntramuralAccept";
import Events from "./pages/Events";
import FAQ from "./pages/FAQ";
import Login from "./pages/Login";
import Employee from "./pages/Employee";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <GymProvider>
          <PassProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Header />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/capacity" element={<Capacity />} />
              <Route path="/group-fitness" element={<GroupFitness />} />
              <Route path="/intramurals" element={<Intramurals />} />
              <Route path="/events" element={<Events />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/login" element={<Login />} />
              <Route path="/employee" element={<ProtectedRoute allowedRoles={["employee", "admin"]}><Employee /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><Admin /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          </PassProvider>
        </GymProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
