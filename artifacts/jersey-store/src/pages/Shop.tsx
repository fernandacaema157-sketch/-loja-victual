import { useState, useEffect } from "react";
import { Link, useSearch } from "wouter";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, X, Star, ChevronDown } from "lucide-react";
import { useListProducts, useListTeams } from "@workspace/api-client-react";
import Navbar from "@/components/Navbar";

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

const SIZES = ["P", "M", "G", "GG"];

export default function Shop() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const initialTeam = params.get("team") ?? "";

  const [search, setSearch] = useState("");
  const [selectedTeam, setSelectedTeam] = useState(initialTeam);
  const [selectedSize, setSelectedSize] = useState("");
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState("default");

  useEffect(() => {
    setSelectedTeam(initialTeam);
  }, [initialTeam]);

  const { data: products, isLoading } = useListProducts({
    team: selectedTeam || undefined,
    size: selectedSize || undefined,
    search: search || undefined,
    minPrice,
    maxPrice,
  });

  const { data: teams } = useListTeams();

  const sortedProducts = [...(products ?? [])].sort((a, b) => {
    if (sortBy === "price-asc") return a.price - b.price;
    if (sortBy === "price-desc") return b.price - a.price;
    if (sortBy === "name") return a.name.localeCompare(b.name);
    return 0;
  });

  const clearFilters = () => {
    setSearch("");
    setSelectedTeam("");
    setSelectedSize("");
    setMinPrice(undefined);
    setMaxPrice(undefined);
  };

  const hasFilters = search || selectedTeam || selectedSize || minPrice || maxPrice;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        {/* Header */}
        <div className="border-b border-border py-8 bg-card/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black">CATÁLOGO</h1>
                <p className="text-muted-foreground text-sm mt-1">
                  {isLoading ? "Carregando..." : `${sortedProducts.length} camisetas disponíveis`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="search"
                    placeholder="Buscar camiseta..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                    data-testid="input-search"
                  />
                </div>
                {/* Sort */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary appearance-none pr-8 cursor-pointer"
                    data-testid="select-sort"
                  >
                    <option value="default">Relevância</option>
                    <option value="price-asc">Menor preço</option>
                    <option value="price-desc">Maior preço</option>
                    <option value="name">Nome A-Z</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
                {/* Filter toggle */}
                <button
                  onClick={() => setFilterOpen(!filterOpen)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
                    filterOpen || hasFilters
                      ? "bg-primary text-black border-primary"
                      : "bg-secondary border-border hover:border-primary/50"
                  }`}
                  data-testid="button-filters"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filtros
                  {hasFilters && <span className="bg-black text-primary text-xs rounded-full w-4 h-4 flex items-center justify-center font-black">!</span>}
                </button>
              </div>
            </div>

            {/* Filters panel */}
            {filterOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-4 p-4 bg-card border border-border rounded-xl"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Team */}
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Time</label>
                    <select
                      value={selectedTeam}
                      onChange={(e) => setSelectedTeam(e.target.value)}
                      className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                      data-testid="select-team"
                    >
                      <option value="">Todos os times</option>
                      {teams?.map((t) => (
                        <option key={t.name} value={t.name}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  {/* Size */}
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Tamanho</label>
                    <div className="flex gap-2 flex-wrap">
                      {SIZES.map((size) => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(selectedSize === size ? "" : size)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-bold border transition-colors ${
                            selectedSize === size
                              ? "bg-primary text-black border-primary"
                              : "bg-secondary border-border hover:border-primary/50"
                          }`}
                          data-testid={`button-size-${size}`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Price range */}
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Preço mín (R$)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={minPrice ?? ""}
                      onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                      data-testid="input-min-price"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Preço máx (R$)</label>
                    <input
                      type="number"
                      placeholder="999"
                      value={maxPrice ?? ""}
                      onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                      data-testid="input-max-price"
                    />
                  </div>
                </div>
                {hasFilters && (
                  <button onClick={clearFilters} className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <X className="h-3 w-3" /> Limpar filtros
                  </button>
                )}
              </motion.div>
            )}
          </div>
        </div>

        {/* Products grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-card rounded-2xl h-80 animate-pulse border border-border" />
              ))}
            </div>
          ) : sortedProducts.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-4xl mb-4 text-muted-foreground">Nenhum resultado</p>
              <p className="text-muted-foreground mb-6">Tente outros filtros ou busca</p>
              <button onClick={clearFilters} className="bg-primary text-black font-bold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors">
                Limpar filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {sortedProducts.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link href={`/products/${product.id}`} data-testid={`card-product-${product.id}`}>
                    <div className="group bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_25px_rgba(0,255,135,0.08)] hover:-translate-y-1 h-full">
                      <div className="relative h-48 bg-secondary overflow-hidden">
                        <img
                          src={teamImages[product.team] ?? "/images/real-madrid.png"}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute top-2 left-2">
                          <span className="bg-black/70 backdrop-blur-sm text-xs font-bold px-2 py-0.5 rounded-full text-foreground border border-border/50">
                            {product.team}
                          </span>
                        </div>
                        {product.stock < 10 && product.stock > 0 && (
                          <div className="absolute bottom-2 right-2">
                            <span className="bg-orange-500/90 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                              Últimas unidades
                            </span>
                          </div>
                        )}
                        {product.stock === 0 && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">Esgotado</span>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-sm text-foreground mb-1 line-clamp-2">{product.name}</h3>
                        <div className="flex items-center gap-0.5 mb-2">
                          {[...Array(5)].map((_, i) => <Star key={i} className="h-3 w-3 fill-primary text-primary" />)}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-black text-primary">
                            R$ {product.price.toFixed(2).replace(".", ",")}
                          </span>
                          {product.allowCustomization && (
                            <span className="text-xs bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full border border-primary/20">CUSTOM</span>
                          )}
                        </div>
                        <div className="flex gap-1 mt-2">
                          {product.sizes.map((s) => (
                            <span key={s} className="text-xs bg-secondary text-muted-foreground px-1.5 py-0.5 rounded font-mono">{s}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
