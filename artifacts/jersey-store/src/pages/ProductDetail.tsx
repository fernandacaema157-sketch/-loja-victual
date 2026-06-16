import { useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { ShoppingCart, ArrowLeft, Star, Check, AlertCircle } from "lucide-react";
import { useGetProduct, useAddCartItem, getGetCartQueryKey, getGetProductQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";

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

export default function ProductDetail() {
  const [, params] = useRoute("/products/:id");
  const id = Number(params?.id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [customName, setCustomName] = useState("");
  const [customNumber, setCustomNumber] = useState("");
  const [added, setAdded] = useState(false);

  const { isSignedIn } = useAuth();

  const { data: product, isLoading } = useGetProduct(id, {
    query: { enabled: !!id, queryKey: getGetProductQueryKey(id) },
  });

  const addCartItem = useAddCartItem();

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast({ title: "Selecione um tamanho", variant: "destructive" });
      return;
    }
    addCartItem.mutate(
      {
        data: {
          productId: id,
          size: selectedSize,
          quantity,
          customName: customName || null,
          customNumber: customNumber || null,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
          setAdded(true);
          toast({ title: "Adicionado ao carrinho!", description: `${product?.name} - Tam. ${selectedSize}` });
          setTimeout(() => setAdded(false), 2000);
        },
        onError: () => {
          toast({ title: "Erro ao adicionar", description: "Faça login para adicionar ao carrinho", variant: "destructive" });
          setLocation("/sign-in");
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-16 max-w-7xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="bg-card rounded-2xl h-96 animate-pulse border border-border" />
            <div className="space-y-4">
              <div className="h-8 bg-card rounded animate-pulse" />
              <div className="h-4 bg-card rounded animate-pulse w-2/3" />
              <div className="h-12 bg-card rounded animate-pulse w-1/3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-16 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Produto não encontrado</h2>
            <Link href="/shop" className="text-primary hover:underline">Voltar ao catálogo</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/shop" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" /> Voltar ao catálogo
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Image */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative"
            >
              <div className="bg-card border border-border rounded-3xl overflow-hidden aspect-square">
                <img
                  src={teamImages[product.team] ?? "/images/real-madrid.png"}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {product.allowCustomization && (
                <div className="absolute top-4 right-4 bg-primary text-black text-xs font-black px-3 py-1.5 rounded-full">
                  PERSONALIZAVEL
                </div>
              )}
            </motion.div>

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col"
            >
              <div className="mb-2">
                <span className="text-xs font-bold text-primary uppercase tracking-widest">{product.team}</span>
              </div>
              <h1 className="text-3xl font-black mb-2">{product.name}</h1>

              <div className="flex items-center gap-2 mb-4">
                <div className="flex">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-primary text-primary" />)}
                </div>
                <span className="text-sm text-muted-foreground">4.9 (128 avaliações)</span>
              </div>

              <div className="text-4xl font-black text-primary mb-6">
                R$ {product.price.toFixed(2).replace(".", ",")}
              </div>

              <p className="text-muted-foreground mb-6 leading-relaxed">{product.description}</p>

              {/* Size selector */}
              <div className="mb-6">
                <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 block">
                  Tamanho <span className="text-destructive">*</span>
                </label>
                <div className="flex gap-3 flex-wrap">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`w-14 h-14 rounded-xl font-black text-sm border-2 transition-all ${
                        selectedSize === size
                          ? "bg-primary text-black border-primary shadow-[0_0_20px_rgba(0,255,135,0.3)]"
                          : "bg-secondary border-border hover:border-primary/50 text-foreground"
                      }`}
                      data-testid={`button-size-${size}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div className="mb-6">
                <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 block">Quantidade</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-lg bg-secondary border border-border font-bold hover:bg-card transition-colors"
                    data-testid="button-qty-minus"
                  >-</button>
                  <span className="w-10 text-center font-bold text-lg">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="w-10 h-10 rounded-lg bg-secondary border border-border font-bold hover:bg-card transition-colors"
                    data-testid="button-qty-plus"
                  >+</button>
                  <span className="text-xs text-muted-foreground ml-2">{product.stock} em estoque</span>
                </div>
              </div>

              {/* Customization */}
              {product.allowCustomization && (
                <div className="mb-6 p-4 bg-card border border-primary/20 rounded-xl">
                  <p className="text-sm font-bold mb-3 text-primary uppercase tracking-wider">Personalizacao</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Nome no dorso</label>
                      <input
                        type="text"
                        placeholder="Ex: RONALDO"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value.toUpperCase())}
                        maxLength={20}
                        className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary uppercase font-mono tracking-wider"
                        data-testid="input-custom-name"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Numero</label>
                      <input
                        type="text"
                        placeholder="Ex: 7"
                        value={customNumber}
                        onChange={(e) => setCustomNumber(e.target.value.replace(/\D/g, "").slice(0, 2))}
                        className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary font-mono"
                        data-testid="input-custom-number"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Add to cart */}
              {isSignedIn ? (
                <button
                  onClick={handleAddToCart}
                  disabled={addCartItem.isPending || product.stock === 0}
                  className={`flex items-center justify-center gap-3 w-full py-4 rounded-xl font-black text-lg transition-all ${
                    added
                      ? "bg-green-500 text-white"
                      : "bg-primary text-black hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]"
                  } disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100`}
                  data-testid="button-add-to-cart"
                >
                  {added ? (
                    <><Check className="h-5 w-5" /> Adicionado!</>
                  ) : addCartItem.isPending ? (
                    "Adicionando..."
                  ) : product.stock === 0 ? (
                    "Esgotado"
                  ) : (
                    <><ShoppingCart className="h-5 w-5" /> Adicionar ao Carrinho</>
                  )}
                </button>
              ) : (
                <Link
                  href="/sign-in"
                  className="flex items-center justify-center gap-3 w-full py-4 rounded-xl font-black text-lg bg-primary text-black hover:bg-primary/90 transition-colors"
                  data-testid="link-sign-in-to-buy"
                >
                  <ShoppingCart className="h-5 w-5" /> Entre para Comprar
                </Link>
              )}

              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-primary" />
                Frete calculado no checkout
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
