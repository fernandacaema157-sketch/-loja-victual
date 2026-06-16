import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import logoUrl from "/logo.svg";

export default function SignIn() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const qc = useQueryClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email.trim(), password);
      qc.clear();
      navigate("/shop");
    } catch (err: any) {
      setError(err.message ?? "Erro ao entrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <img src={logoUrl} alt="Logo" className="h-8 w-8" />
            <span className="font-black text-xl tracking-tight">
              JERSEY<span className="text-primary">STORE</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Entrar na conta</h1>
          <p className="text-muted-foreground text-sm mt-1">Bem-vindo de volta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="seu@email.com"
              className="w-full bg-zinc-900 border border-zinc-700 text-white placeholder:text-zinc-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Senha</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full bg-zinc-900 border border-zinc-700 text-white placeholder:text-zinc-500 rounded-lg px-4 py-2.5 pr-10 text-sm focus:outline-none focus:border-primary transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-black font-bold py-2.5 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="h-4 w-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              <LogIn className="h-4 w-4" />
            )}
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Não tem conta?{" "}
          <Link href="/sign-up" className="text-primary font-semibold hover:underline">
            Criar conta
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
