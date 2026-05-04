import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Truck } from "lucide-react";
import {
  useGetCart,
  useUpdateCartItem,
  useRemoveCartItem,
  useClearCart,
  useCalculateShipping,
  getGetCartQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
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

export default function Cart() {
  const { data: cart, isLoading } = useGetCart();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const clearCart = useClearCart();
  const calculateShipping = useCalculateShipping();
  const [zipCode, setZipCode] = useState("");
  const [shippingOptions, setShippingOptions] = useState<Array<{ id: string; name: string; price: number; estimatedDays: string }>>([]);
  const [selectedShipping, setSelectedShipping] = useState("");

  const invalidateCart = () => queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });

  const handleUpdateQty = (itemId: number, qty: number) => {
    updateItem.mutate({ itemId, data: { quantity: qty } }, { onSuccess: invalidateCart });
  };

  const handleRemove = (itemId: number) => {
    removeItem.mutate({ itemId }, { onSuccess: () => { invalidateCart(); toast({ title: "Item removido" }); } });
  };

  const handleClear = () => {
    clearCart.mutate(undefined, { onSuccess: () => { invalidateCart(); toast({ title: "Carrinho limpo" }); } });
  };

  const handleCalcShipping = () => {
    if (!zipCode || zipCode.length < 5) { toast({ title: "CEP inválido", variant: "destructive" }); return; }
    calculateShipping.mutate({ data: { zipCode } }, {
      onSuccess: (res) => {
        setShippingOptions(res.options);
        if (res.options.length > 0) setSelectedShipping(res.options[0].id);
      },
    });
  };

  const selectedShippingOption = shippingOptions.find((o) => o.id === selectedShipping);
  const total = (cart?.subtotal ?? 0) + (selectedShippingOption?.price ?? 0);

  const handleCheckout = () => {
    if (!selectedShipping) { toast({ title: "Calcule o frete antes de continuar", variant: "destructive" }); return; }
    setLocation(`/checkout?shipping=${selectedShipping}&shippingCost=${selectedShippingOption?.price ?? 0}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background"><Navbar />
        <div className="pt-16 max-w-7xl mx-auto px-4 py-12">
          <div className="h-8 bg-card rounded animate-pulse w-32 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {[...Array(3)].map((_, i) => <div key={i} className="bg-card h-24 rounded-xl animate-pulse border border-border" />)}
            </div>
            <div className="bg-card h-64 rounded-xl animate-pulse border border-border" />
          </div>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-background"><Navbar />
        <div className="pt-16 flex items-center justify-center min-h-[70vh]">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-black mb-2">Carrinho vazio</h2>
            <p className="text-muted-foreground mb-6">Adicione camisetas do nosso catálogo</p>
            <Link href="/shop" className="inline-flex items-center gap-2 bg-primary text-black font-bold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors">
              Ver Catálogo <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background"><Navbar />
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-black">MEU CARRINHO</h1>
            <button onClick={handleClear} className="text-sm text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1.5" data-testid="button-clear-cart">
              <Trash2 className="h-4 w-4" /> Limpar tudo
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-card border border-border rounded-2xl p-4 flex gap-4"
                  data-testid={`cart-item-${item.id}`}
                >
                  <div className="w-20 h-20 bg-secondary rounded-xl overflow-hidden flex-shrink-0">
                    <img src={teamImages[item.team] ?? "/images/real-madrid.png"} alt={item.productName} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm truncate">{item.productName}</h3>
                    <p className="text-xs text-muted-foreground mb-1">{item.team} • Tam. {item.size}</p>
                    {(item.customName || item.customNumber) && (
                      <p className="text-xs text-primary font-mono mb-1">
                        {item.customName && `${item.customName} `}{item.customNumber && `#${item.customNumber}`}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleUpdateQty(item.id, item.quantity - 1)} className="w-7 h-7 rounded bg-secondary border border-border flex items-center justify-center hover:bg-card transition-colors" data-testid={`button-qty-minus-${item.id}`}>
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                        <button onClick={() => handleUpdateQty(item.id, item.quantity + 1)} className="w-7 h-7 rounded bg-secondary border border-border flex items-center justify-center hover:bg-card transition-colors" data-testid={`button-qty-plus-${item.id}`}>
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-black text-primary">R$ {(item.price * item.quantity).toFixed(2).replace(".", ",")}</span>
                        <button onClick={() => handleRemove(item.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1" data-testid={`button-remove-${item.id}`}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Summary */}
            <div className="space-y-4">
              {/* Shipping calc */}
              <div className="bg-card border border-border rounded-2xl p-5">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <Truck className="h-4 w-4 text-primary" /> Calcular Frete
                </h3>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="CEP (ex: 01310-100)"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
                    className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary font-mono"
                    data-testid="input-zipcode"
                  />
                  <button
                    onClick={handleCalcShipping}
                    disabled={calculateShipping.isPending}
                    className="bg-primary text-black font-bold px-4 py-2 rounded-lg text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                    data-testid="button-calc-shipping"
                  >
                    {calculateShipping.isPending ? "..." : "OK"}
                  </button>
                </div>
                {shippingOptions.length > 0 && (
                  <div className="space-y-2">
                    {shippingOptions.map((opt) => (
                      <label key={opt.id} className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${selectedShipping === opt.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                        <div className="flex items-center gap-2">
                          <input type="radio" name="shipping" value={opt.id} checked={selectedShipping === opt.id} onChange={() => setSelectedShipping(opt.id)} className="text-primary" />
                          <div>
                            <p className="text-xs font-bold">{opt.name}</p>
                            <p className="text-xs text-muted-foreground">{opt.estimatedDays}</p>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-primary">R$ {opt.price.toFixed(2).replace(".", ",")}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Order summary */}
              <div className="bg-card border border-border rounded-2xl p-5">
                <h3 className="font-bold mb-4">Resumo do Pedido</h3>
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal ({cart.itemCount} {cart.itemCount === 1 ? "item" : "itens"})</span>
                    <span className="font-semibold">R$ {cart.subtotal.toFixed(2).replace(".", ",")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Frete</span>
                    <span className="font-semibold">
                      {selectedShippingOption ? `R$ ${selectedShippingOption.price.toFixed(2).replace(".", ",")}` : "—"}
                    </span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between text-base font-black">
                    <span>Total</span>
                    <span className="text-primary">R$ {total.toFixed(2).replace(".", ",")}</span>
                  </div>
                </div>
                <button
                  onClick={handleCheckout}
                  className="w-full bg-primary text-black font-black py-3.5 rounded-xl hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                  data-testid="button-checkout"
                >
                  Finalizar Pedido <ArrowRight className="h-4 w-4" />
                </button>
                <Link href="/shop" className="block text-center text-sm text-muted-foreground hover:text-foreground mt-3 transition-colors">
                  Continuar comprando
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
