import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Zap, Shield, Truck, Star } from "lucide-react";
import { useGetFeaturedProducts, useListTeams } from "@workspace/api-client-react";
import Navbar from "@/components/Navbar";
import heroBannerUrl from "/images/hero-banner.png";

const teamImages: Record<string, string> = {
  "Real Madrid": "/images/real-madrid.png",
  "Barcelona": "/images/barcelona.png",
  "PSG": "/images/psg.png",
  "Manchester United": "/images/man-united.png",
  "Brasil": "/images/brasil.png",
  "Argentina": "/images/argentina.png",
  "Bayern Munich": "/images/bayern.png",
  "Liverpool": "/images/liverpool.png",
};

export default function Home() {
  const { data: featured, isLoading: loadingFeatured } = useGetFeaturedProducts();
  const { data: teams } = useListTeams();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-16 min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBannerUrl} alt="Jersey Store" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 mb-6">
              <Zap className="h-3.5 w-3.5 text-primary" />
              <span className="text-primary text-xs font-bold uppercase tracking-wider">Camisetas Premium</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black leading-none tracking-tight mb-6">
              VESTE O<br />
              <span className="text-primary">SEU TIME</span>
              <br />COM ESTILO
            </h1>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-lg">
              Camisetas esportivas oficiais dos maiores times do mundo. Personalize com seu nome e número.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/shop" data-testid="link-shop-hero" className="inline-flex items-center gap-2 bg-primary text-black font-black px-8 py-4 rounded-xl text-lg hover:bg-primary/90 transition-all hover:scale-105 active:scale-95">
                Ver Catálogo
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link href="/sign-up" className="inline-flex items-center gap-2 border border-border text-foreground font-bold px-8 py-4 rounded-xl text-lg hover:bg-secondary transition-colors">
                Criar Conta
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 border-y border-border bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: "Qualidade Garantida", desc: "Materiais premium que duram temporadas" },
              { icon: Zap, title: "Personalização", desc: "Seu nome e número em qualquer camisa" },
              { icon: Truck, title: "Entrega Rápida", desc: "Receba em até 10 dias úteis" },
            ].map(({ icon: Icon, title, desc }) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="flex items-start gap-4"
              >
                <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground mb-1">{title}</h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex items-end justify-between mb-12"
          >
            <div>
              <p className="text-primary text-xs font-bold uppercase tracking-widest mb-2">Destaque</p>
              <h2 className="text-4xl font-black">MAIS VENDIDOS</h2>
            </div>
            <Link href="/shop" className="text-sm font-bold text-primary hover:underline flex items-center gap-1">
              Ver todos <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>

          {loadingFeatured ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card rounded-2xl h-80 animate-pulse border border-border" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured?.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Link href={`/products/${product.id}`} data-testid={`card-product-${product.id}`}>
                    <div className="group bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,135,0.1)] hover:-translate-y-1">
                      <div className="relative h-56 bg-secondary overflow-hidden">
                        <img
                          src={teamImages[product.team] ?? "/images/real-madrid.png"}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute top-3 left-3">
                          <span className="bg-black/60 backdrop-blur-sm text-xs font-bold px-2.5 py-1 rounded-full text-foreground border border-border">
                            {product.team}
                          </span>
                        </div>
                        {product.allowCustomization && (
                          <div className="absolute top-3 right-3">
                            <span className="bg-primary text-black text-xs font-bold px-2 py-1 rounded-full">
                              CUSTOM
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <h3 className="font-bold text-foreground mb-1 truncate">{product.name}</h3>
                        <div className="flex items-center gap-1 mb-3">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-primary text-primary" />
                          ))}
                          <span className="text-xs text-muted-foreground ml-1">(4.9)</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xl font-black text-primary">
                            R$ {product.price.toFixed(2).replace(".", ",")}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {product.stock} em estoque
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Teams */}
      <section className="py-24 bg-card/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="text-primary text-xs font-bold uppercase tracking-widest mb-2">Categorias</p>
            <h2 className="text-4xl font-black">SEUS TIMES FAVORITOS</h2>
          </motion.div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {teams?.slice(0, 8).map((team, i) => (
              <motion.div
                key={team.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
              >
                <Link href={`/shop?team=${encodeURIComponent(team.name)}`} data-testid={`link-team-${i}`}>
                  <div className="group relative bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,135,0.08)] cursor-pointer">
                    <img
                      src={teamImages[team.name] ?? "/images/real-madrid.png"}
                      alt={team.name}
                      className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-500 opacity-70 group-hover:opacity-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-3">
                      <div>
                        <p className="font-bold text-white text-sm leading-tight">{team.name}</p>
                        <p className="text-primary text-xs">{team.count} modelos</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <img src="/logo.svg" alt="Jersey Store" className="h-6 w-6" />
            <span className="font-black text-lg">JERSEY<span className="text-primary">STORE</span></span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} JerseyStore. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
