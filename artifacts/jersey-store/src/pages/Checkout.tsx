import { useState } from "react";
import { useSearch, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, CreditCard, MapPin, Package } from "lucide-react";
import { useGetCart, useCreateOrder, useProcessPayment, getGetCartQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";

const addressSchema = z.object({
  addressLine1: z.string().min(5, "Endereço obrigatório"),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "Cidade obrigatória"),
  state: z.string().min(2, "Estado obrigatório"),
  zipCode: z.string().min(5, "CEP obrigatório"),
  country: z.string().default("BR"),
});

const paymentSchema = z.object({
  cardHolder: z.string().min(3, "Nome do titular obrigatório"),
  cardNumber: z.string().min(16, "Número do cartão inválido").max(19),
  expiryMonth: z.string().length(2, "Mês inválido"),
  expiryYear: z.string().length(2, "Ano inválido"),
  cvv: z.string().min(3, "CVV inválido").max(4),
  paymentMethod: z.string().default("credit_card"),
});

const STEPS = [
  { id: 1, label: "Endereço", icon: MapPin },
  { id: 2, label: "Pagamento", icon: CreditCard },
  { id: 3, label: "Confirmação", icon: Package },
];

export default function Checkout() {
  const [step, setStep] = useState(1);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const searchStr = useSearch();
  const params = new URLSearchParams(searchStr);
  const shippingMethod = params.get("shipping") ?? "standard";
  const shippingCost = Number(params.get("shippingCost") ?? "19.90");
  const [orderId, setOrderId] = useState<number | null>(null);

  const { data: cart } = useGetCart();
  const createOrder = useCreateOrder();
  const processPayment = useProcessPayment();

  const addressForm = useForm<z.infer<typeof addressSchema>>({
    resolver: zodResolver(addressSchema),
    defaultValues: { country: "BR" },
  });

  const paymentForm = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { paymentMethod: "credit_card" },
  });

  const handleAddressSubmit = addressForm.handleSubmit((data) => {
    createOrder.mutate(
      {
        data: {
          ...data,
          addressLine2: data.addressLine2 ?? null,
          shippingMethod,
          shippingCost,
        },
      },
      {
        onSuccess: (order) => {
          setOrderId(order.id);
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
          setStep(2);
        },
        onError: () => toast({ title: "Erro ao criar pedido", variant: "destructive" }),
      },
    );
  });

  const handlePaymentSubmit = paymentForm.handleSubmit((data) => {
    if (!orderId) return;
    processPayment.mutate(
      { id: orderId, data },
      {
        onSuccess: () => setStep(3),
        onError: () => toast({ title: "Erro no pagamento", variant: "destructive" }),
      },
    );
  });

  const total = (cart?.subtotal ?? 0) + shippingCost;

  return (
    <div className="min-h-screen bg-background"><Navbar />
      <div className="pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-black mb-8">CHECKOUT</h1>

          {/* Steps */}
          <div className="flex items-center mb-10">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center flex-1">
                <div className={`flex items-center gap-2 ${step >= s.id ? "text-primary" : "text-muted-foreground"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm border-2 transition-all ${step > s.id ? "bg-primary border-primary text-black" : step === s.id ? "border-primary text-primary" : "border-border"}`}>
                    {step > s.id ? <Check className="h-4 w-4" /> : s.id}
                  </div>
                  <span className="text-sm font-bold hidden sm:block">{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-3 transition-colors ${step > s.id ? "bg-primary" : "bg-border"}`} />
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {/* Step 1: Address */}
              {step === 1 && (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                  <div className="bg-card border border-border rounded-2xl p-6">
                    <h2 className="text-lg font-black mb-5 flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" /> Endereço de Entrega
                    </h2>
                    <form onSubmit={handleAddressSubmit} className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Endereço *</label>
                        <input {...addressForm.register("addressLine1")} placeholder="Rua, número" className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary" data-testid="input-address" />
                        {addressForm.formState.errors.addressLine1 && <p className="text-xs text-destructive mt-1">{addressForm.formState.errors.addressLine1.message}</p>}
                      </div>
                      <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Complemento</label>
                        <input {...addressForm.register("addressLine2")} placeholder="Apto, bloco (opcional)" className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary" data-testid="input-address2" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Cidade *</label>
                          <input {...addressForm.register("city")} placeholder="São Paulo" className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary" data-testid="input-city" />
                          {addressForm.formState.errors.city && <p className="text-xs text-destructive mt-1">{addressForm.formState.errors.city.message}</p>}
                        </div>
                        <div>
                          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Estado *</label>
                          <input {...addressForm.register("state")} placeholder="SP" className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary" data-testid="input-state" />
                          {addressForm.formState.errors.state && <p className="text-xs text-destructive mt-1">{addressForm.formState.errors.state.message}</p>}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">CEP *</label>
                        <input {...addressForm.register("zipCode")} placeholder="01310-100" className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary font-mono" data-testid="input-zip" />
                        {addressForm.formState.errors.zipCode && <p className="text-xs text-destructive mt-1">{addressForm.formState.errors.zipCode.message}</p>}
                      </div>
                      <button type="submit" disabled={createOrder.isPending} className="w-full bg-primary text-black font-black py-3.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 mt-2" data-testid="button-next-step">
                        {createOrder.isPending ? "Criando pedido..." : "Continuar para Pagamento"}
                      </button>
                    </form>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Payment */}
              {step === 2 && (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                  <div className="bg-card border border-border rounded-2xl p-6">
                    <h2 className="text-lg font-black mb-5 flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-primary" /> Pagamento
                    </h2>
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 mb-5">
                      <p className="text-xs text-yellow-400 font-bold">Ambiente de demonstracao — use qualquer numero de cartao</p>
                    </div>
                    <form onSubmit={handlePaymentSubmit} className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Nome do Titular *</label>
                        <input {...paymentForm.register("cardHolder")} placeholder="FULANO DE TAL" className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary uppercase font-mono tracking-wider" data-testid="input-card-holder" />
                        {paymentForm.formState.errors.cardHolder && <p className="text-xs text-destructive mt-1">{paymentForm.formState.errors.cardHolder.message}</p>}
                      </div>
                      <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Numero do Cartao *</label>
                        <input {...paymentForm.register("cardNumber")} placeholder="1234 5678 9012 3456" maxLength={19} className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary font-mono tracking-widest" data-testid="input-card-number" />
                        {paymentForm.formState.errors.cardNumber && <p className="text-xs text-destructive mt-1">{paymentForm.formState.errors.cardNumber.message}</p>}
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Mes *</label>
                          <input {...paymentForm.register("expiryMonth")} placeholder="MM" maxLength={2} className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary font-mono text-center" data-testid="input-expiry-month" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Ano *</label>
                          <input {...paymentForm.register("expiryYear")} placeholder="AA" maxLength={2} className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary font-mono text-center" data-testid="input-expiry-year" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">CVV *</label>
                          <input {...paymentForm.register("cvv")} placeholder="123" maxLength={4} className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary font-mono text-center" data-testid="input-cvv" />
                        </div>
                      </div>
                      <button type="submit" disabled={processPayment.isPending} className="w-full bg-primary text-black font-black py-3.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50" data-testid="button-pay">
                        {processPayment.isPending ? "Processando..." : `Pagar R$ ${total.toFixed(2).replace(".", ",")}`}
                      </button>
                    </form>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Confirmation */}
              {step === 3 && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                  <div className="bg-card border border-primary/30 rounded-2xl p-8 text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-black mb-2">Pedido Confirmado!</h2>
                    <p className="text-muted-foreground mb-2">Pedido #{orderId} realizado com sucesso</p>
                    <p className="text-sm text-muted-foreground mb-6">Voce receberá atualizações por email</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <button onClick={() => setLocation(`/orders/${orderId}`)} className="bg-primary text-black font-bold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors" data-testid="button-view-order">
                        Ver Pedido
                      </button>
                      <button onClick={() => setLocation("/shop")} className="border border-border font-bold px-6 py-3 rounded-xl hover:bg-secondary transition-colors">
                        Continuar Comprando
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Order summary */}
            {step < 3 && (
              <div className="bg-card border border-border rounded-2xl p-5 h-fit">
                <h3 className="font-bold mb-4">Resumo</h3>
                <div className="space-y-3 mb-4">
                  {cart?.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground truncate max-w-[150px]">{item.productName} x{item.quantity}</span>
                      <span className="font-semibold ml-2">R$ {(item.price * item.quantity).toFixed(2).replace(".", ",")}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border pt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>R$ {cart?.subtotal.toFixed(2).replace(".", ",")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Frete</span>
                    <span>R$ {shippingCost.toFixed(2).replace(".", ",")}</span>
                  </div>
                  <div className="flex justify-between font-black text-base pt-1 border-t border-border">
                    <span>Total</span>
                    <span className="text-primary">R$ {total.toFixed(2).replace(".", ",")}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
