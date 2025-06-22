
import { Toaster } from "react-hot-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./components/Index.jsx";
import ProductDetail from "./components/ProductDetail.jsx";
import UserLogin from "./components/UserLogin.jsx";
import UserRegister from "./components/UserRegister.jsx";
import ModeratorLogin from "./components/ModeratorLogin.jsx";
import ModeratorRegister from "./components/ModeratorRegister.jsx";
import ModeratorDashboard from "./components/ModeratorDashboard.jsx";
import NotFound from "./components/NotFound.jsx";
import FlaggedItemDetail from "./components/FlaggedItemDetail.jsx";
import SellerProfile from "./components/SellerProfile.jsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster position="top-right" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/product/:id" element={<ProductDetail />} />
             <Route path="/seller/:id" element={<SellerProfile />} />
          <Route path="/login" element={<UserLogin />} />
          <Route path="/register" element={<UserRegister />} />
          <Route path="/moderator/login" element={<ModeratorLogin />} />
          <Route path="/moderator/register" element={<ModeratorRegister />} />
          <Route path="/moderator/dashboard" element={<ModeratorDashboard />} />
          <Route path="/moderator/flagged/:type/:id" element={<FlaggedItemDetail />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;