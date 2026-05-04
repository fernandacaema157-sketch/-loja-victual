import { useEffect, useRef } from "react";
import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import {
  ClerkProvider, SignIn, SignUp,
  SignedIn, SignedOut,
  useClerk, useAuth,
} from "@clerk/react";
import { shadcn } from "@clerk/themes";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import Home from "@/pages/Home";
import Shop from "@/pages/Shop";
import ProductDetail from "@/pages/ProductDetail";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import Orders from "@/pages/Orders";
import OrderDetail from "@/pages/OrderDetail";
import Admin from "@/pages/Admin";
import AdminProducts from "@/pages/AdminProducts";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000 },
  },
});

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL as string | undefined;

const clerkAppearance = {
  baseTheme: shadcn,
  cssLayerName: "clerk",
  variables: {
    colorPrimary: "#00FF87",
    colorBackground: "#0f0f0f",
    colorInput: "#1a1a1a",
    colorInputForeground: "#fafafa",
    colorNeutral: "#404040",
    fontFamily: "'Outfit', sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "rounded-2xl w-[440px] max-w-full overflow-hidden border border-zinc-800",
    card: "!shadow-none !border-0 !bg-zinc-950",
    footer: "!bg-zinc-900 !border-0",
    formButtonPrimary: "bg-primary text-black font-bold hover:bg-primary/90",
    formFieldInput: "bg-zinc-900 border border-zinc-700 text-white placeholder:text-zinc-500 focus:border-primary",
    socialButtonsBlockButton: "border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-white",
    footerActionLink: "text-primary font-semibold",
    dividerLine: "bg-zinc-700",
    dividerText: "text-zinc-500",
    headerTitle: "text-white font-bold",
    formFieldLabel: "text-zinc-300",
    footerActionText: "text-zinc-400",
    identityPreviewEditButton: "text-primary",
    alertText: "text-red-400",
  },
};

function AuthTokenBridge() {
  const { getToken } = useAuth();
  useEffect(() => {
    setAuthTokenGetter(() => getToken());
    return () => setAuthTokenGetter(null);
  }, [getToken]);
  return null;
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);
  return null;
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <>
      <SignedIn><Component /></SignedIn>
      <SignedOut><Redirect to="/sign-in" /></SignedOut>
    </>
  );
}

function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        appearance={clerkAppearance}
      />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        appearance={clerkAppearance}
      />
    </div>
  );
}

function HomeRedirect() {
  return (
    <>
      <SignedIn><Redirect to="/shop" /></SignedIn>
      <SignedOut><Home /></SignedOut>
    </>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeRedirect} />
      <Route path="/shop" component={Shop} />
      <Route path="/products/:id" component={ProductDetail} />
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route path="/cart"><ProtectedRoute component={Cart} /></Route>
      <Route path="/checkout"><ProtectedRoute component={Checkout} /></Route>
      <Route path="/orders"><ProtectedRoute component={Orders} /></Route>
      <Route path="/orders/:id"><ProtectedRoute component={OrderDetail} /></Route>
      <Route path="/admin"><ProtectedRoute component={Admin} /></Route>
      <Route path="/admin/products"><ProtectedRoute component={AdminProducts} /></Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function InnerApp() {
  const [, setLocation] = useLocation();
  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to: string) => {
        const stripped = basePath && to.startsWith(basePath) ? to.slice(basePath.length) || "/" : to;
        setLocation(stripped);
      }}
      routerReplace={(to: string) => {
        const stripped = basePath && to.startsWith(basePath) ? to.slice(basePath.length) || "/" : to;
        setLocation(stripped, { replace: true });
      }}
    >
      <QueryClientProvider client={queryClient}>
        <AuthTokenBridge />
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
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
