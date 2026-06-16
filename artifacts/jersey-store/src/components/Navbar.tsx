import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ShoppingCart, Menu, X, ChevronDown, LogOut, Package, LayoutDashboard } from "lucide-react";
import { useGetCart, getGetCartQueryKey } from "@workspace/api-client-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import logoUrl from "/logo.svg";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user, isSignedIn, logout } = useAuth();
  const qc = useQueryClient();
  const { data: cart } = useGetCart({ query: { enabled: isSignedIn, queryKey: getGetCartQueryKey() } });
  const isAdmin = useIsAdmin();

  const cartCount = cart?.itemCount ?? 0;

  const handleSignOut = () => {
    logout();
    qc.clear();
    setUserMenuOpen(false);
    setMobileOpen(false);
  };

  const displayName = user?.firstName ?? user?.email?.split("@")[0] ?? "Usuário";
  const initials = (user?.firstName?.[0] ?? user?.email?.[0] ?? "U").toUpperCase();

  const navLinks = [
    { href: "/shop", label: "Catálogo" },
    { href: "/orders", label: "Meus Pedidos" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <img src={logoUrl} alt="Jersey Store" className="h-8 w-8" />
            <span className="font-black text-xl tracking-tight text-foreground group-hover:text-primary transition-colors">
              JERSEY<span className="text-primary">STORE</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-semibold tracking-wide uppercase transition-colors hover:text-primary ${
                  location === link.href ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/admin"
                className={`text-sm font-semibold tracking-wide uppercase transition-colors hover:text-primary ${
                  location.startsWith("/admin") ? "text-primary" : "text-muted-foreground"
                }`}
              >
                Admin
              </Link>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Cart */}
            <Link href="/cart" className="relative p-2 hover:text-primary transition-colors" data-testid="link-cart">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-black text-xs font-black rounded-full h-5 w-5 flex items-center justify-center" data-testid="cart-count">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </Link>

            {/* Auth — signed out */}
            {!isSignedIn && (
              <div className="hidden md:flex items-center gap-2">
                <Link href="/sign-in" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors" data-testid="link-sign-in">
                  Entrar
                </Link>
                <Link href="/sign-up" className="bg-primary text-black text-sm font-bold px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors" data-testid="link-sign-up">
                  Cadastrar
                </Link>
              </div>
            )}

            {/* Auth — signed in */}
            {isSignedIn && (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-secondary transition-colors"
                  data-testid="button-user-menu"
                >
                  <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-black text-xs font-black">
                    {initials}
                  </div>
                  <span className="hidden md:block text-sm font-semibold max-w-24 truncate">
                    {displayName}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden md:block" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50">
                    <Link href="/orders" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-secondary transition-colors">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      Meus Pedidos
                    </Link>
                    {isAdmin && (
                      <Link href="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-secondary transition-colors">
                        <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                        Dashboard Admin
                      </Link>
                    )}
                    <div className="border-t border-border" />
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2 px-4 py-3 text-sm text-destructive hover:bg-secondary transition-colors w-full"
                      data-testid="button-sign-out"
                    >
                      <LogOut className="h-4 w-4" />
                      Sair
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mobile toggle */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileOpen(!mobileOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-2.5 text-sm font-semibold uppercase tracking-wide rounded-lg transition-colors ${
                  location === link.href ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {isAdmin && (
              <Link href="/admin" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 text-sm font-semibold uppercase tracking-wide rounded-lg text-muted-foreground hover:bg-secondary transition-colors">
                Admin
              </Link>
            )}
            {!isSignedIn && (
              <div className="pt-2 flex gap-2 px-4">
                <Link href="/sign-in" onClick={() => setMobileOpen(false)} className="flex-1 text-center py-2 text-sm font-semibold border border-border rounded-lg hover:bg-secondary transition-colors">
                  Entrar
                </Link>
                <Link href="/sign-up" onClick={() => setMobileOpen(false)} className="flex-1 text-center py-2 text-sm font-bold bg-primary text-black rounded-lg hover:bg-primary/90 transition-colors">
                  Cadastrar
                </Link>
              </div>
            )}
            {isSignedIn && (
              <div className="pt-2 px-4">
                <button
                  onClick={handleSignOut}
                  className="w-full py-2 text-sm font-semibold text-destructive border border-destructive/30 rounded-lg hover:bg-destructive/10 transition-colors"
                >
                  Sair da conta
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
