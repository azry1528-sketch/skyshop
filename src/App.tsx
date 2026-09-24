import { Toaster as Sonner } from "@/components/ui/sonner";
import { HelmetProvider } from "react-helmet-async";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "./contexts/CartContext";
import { I18nProvider } from "./contexts/I18nContext";
import ScrollToTop from "./components/ScrollToTop";
import PixelPageView from "./components/PixelPageView";
import ScrollToTopFab from "./components/jangolo/ScrollToTopFab";
import BottomNav from "./components/jangolo/BottomNav";
import ErrorBoundary from "./components/jangolo/ErrorBoundary";
import Promotions from "./pages/Promotions";
import Index from "./pages/Index";
import Category from "./pages/Category";
import Categories from "./pages/Categories";
import Search from "./pages/Search";
import ProductDetail from "./pages/ProductDetail";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import TrackOrder from "./pages/TrackOrder";
import About from "./pages/About";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Auth from "./pages/Auth";
import Account from "./pages/Account";
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import AdminProducts from "./pages/admin/Products";
import AdminOrders from "./pages/admin/Orders";
import AdminUsers from "./pages/admin/Users";
import AdminVisitors from "./pages/admin/Visitors";
import AdminPerformance from "./pages/admin/Performance";
import AdminCategories from "./pages/admin/Categories";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,   // 5 minutes
      gcTime: 1000 * 60 * 30,     // 30 minutes in cache
      refetchOnWindowFocus: false, // ne recharge pas quand on revient sur l'onglet
    },
  },
});

const App = () => (
  <HelmetProvider>
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <I18nProvider>
        <CartProvider>
          <Sonner position="top-center" />
          <BrowserRouter>
            <ScrollToTop />
            <PixelPageView />
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/category/:category" element={<Category />} />
                <Route path="/promotions" element={<Promotions />} />
                <Route path="/search" element={<Search />} />
                <Route path="/product/:slug" element={<ProductDetail />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/order/:reference" element={<OrderConfirmation />} />
                <Route path="/suivi" element={<TrackOrder />} />
                <Route path="/track" element={<TrackOrder />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/account" element={<Account />} />
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="visitors" element={<AdminVisitors />} />
                  <Route path="performance" element={<AdminPerformance />} />
                  <Route path="categories" element={<AdminCategories />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ErrorBoundary>
            <ScrollToTopFab />
            <BottomNav />
          </BrowserRouter>
        </CartProvider>
        </I18nProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
  </HelmetProvider>
);

export default App;
