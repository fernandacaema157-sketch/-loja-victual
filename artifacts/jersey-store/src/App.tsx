import {
  Switch,
  Route,
  Router as WouterRouter,
  Redirect,
} from "wouter";
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Home from "@/pages/Home";
import Shop from "@/pages/Shop";
import ProductDetail from "@/pages/ProductDetail";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import Orders from "@/pages/Orders";
import OrderDetail from "@/pages/OrderDetail";
import Admin from "@/pages/Admin";
import AdminProducts from "@/pages/AdminProducts";
import AdminOrderDetail from "@/pages/AdminOrderDetail";
import SignIn from "@/pages/SignIn";
import SignUp from "@/pages/SignUp";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000 },
  },
});

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect to="/sign-in" />;
  return <Component />;
}

function HomeRedirect() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return null;
  if (isSignedIn) return <Redirect to="/shop" />;
  return <Home />;
}

function AuthCacheReset({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="~/" component={HomeRedirect} />
      <Route path="/shop" component={Shop} />
      <Route path="/products/:id" component={ProductDetail} />
      <Route path="/sign-in" component={SignIn} />
      <Route path="/sign-up" component={SignUp} />
      <Route path="/cart">
        <ProtectedRoute component={Cart} />
      </Route>
      <Route path="/checkout">
        <ProtectedRoute component={Checkout} />
      </Route>
      <Route path="/orders/:id">
        <ProtectedRoute component={OrderDetail} />
      </Route>
      <Route path="/orders">
        <ProtectedRoute component={Orders} />
      </Route>
      <Route path="/admin/orders/:id">
        <ProtectedRoute component={AdminOrderDetail} />
      </Route>
      <Route path="/admin/products">
        <ProtectedRoute component={AdminProducts} />
      </Route>
      <Route path="/admin">
        <ProtectedRoute component={Admin} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function InnerApp() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <InnerApp />
    </WouterRouter>
  );
}

export default App;
