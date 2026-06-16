import { Link } from "wouter";
import Navbar from "@/components/Navbar";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 pt-16">
        <p className="text-8xl font-black text-primary mb-4">404</p>
        <h1 className="text-2xl font-bold text-foreground mb-2">Página não encontrada</h1>
        <p className="text-muted-foreground mb-8">O link que você acessou não existe.</p>
        <Link href="/shop" className="bg-primary text-black font-bold px-6 py-2.5 rounded-lg hover:bg-primary/90 transition-colors">
          Ir para o Catálogo
        </Link>
      </div>
    </>
  );
}
