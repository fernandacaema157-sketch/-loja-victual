import { useRoute, Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Package, MapPin, CreditCard, Check, Clock, Truck, Home, User } from "lucide-react";
import { useGetAdminOrder, getGetAdminOrderQueryKey, useUpdateOrderStatus } from "@workspace/api-client-react";
import Navbar from "@/components/Navbar";
import { useQueryClient } from "@tanstack/react-query";

const STATUS_STEPS = ["pending", "processing", "shipped", "delivered"];
const STATUS_LABELS: Record<string, { label: string; icon: typeof Check }> = {
  pending: { label: "Pedido Recebido", icon: Clock },
  processing: { label: "Em Processamento", icon: Package },
  shipped: { label: "Enviado", icon: Truck },
  delivered: { label: "Entregue", icon: Home },
};

const STATUS_OPTIONS = [
  { value: "pending", label: "Aguardando" },
  { value: "processing", label: "Processando" },
  { value: "shipped", label: "Enviado" },
  { value: "delivered", label: "Entregue" },
  { value: "cancelled", label: "Cancelado" },
];

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

export default function AdminOrderDetail() {
  const [, params] = useRoute("/admin/orders/:id");
  const id = Number(params?.id);
  const queryClient = useQueryClient();
  const { data: order, isLoading } = useGetAdminOrder(id, {
    query: { enabled: !!id && !isNaN(id), queryKey: getGetAdminOrderQueryKey(id) },
  });
  const { mutate: updateStatus, isPending: updatingStatus } = useUpdateOrderStatus();

  const handleStatusChange = (newStatus: string) => {
    if (!order) return;
    updateStatus(
      { id: order.id, data: { status: newStatus } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetAdminOrderQueryKey(order.id) });
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-16 max-w-3xl mx-auto px-4 py-8 space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card h-24 rounded-xl animate-pulse border border-border" />
          ))}
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-16 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-xl font-bold mb-2">Pedido não encontrado</p>
            <Link href="/admin" className="text-primary hover:underline">Voltar ao admin</Link>
          </div>
        </div>
      </div>
    );
  }

  const currentStep = STATUS_STEPS.indexOf(order.status);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" /> Painel Admin
          </Link>

          <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-black">Pedido #{order.id}</h1>
              <p className="text-muted-foreground text-sm mt-1">
                {new Date(order.createdAt).toLocaleDateString("pt-BR", {
                  day: "2-digit", month: "long", year: "numeric",
                  hour: "2-digit", minute: "2-digit",
                })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={order.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={updatingStatus}
                className="bg-card border border-border text-foreground text-sm font-bold px-3 py-2 rounded-xl focus:outline-none focus:border-primary disabled:opacity-50 cursor-pointer"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {updatingStatus && <span className="text-xs text-muted-foreground">Salvando...</span>}
            </div>
          </div>

          {/* Customer info */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-5 mb-6 flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-bold">{(order as any).customerName ?? order.userId}</p>
              <p className="text-xs text-muted-foreground">Cliente</p>
            </div>
          </motion.div>

          {/* Tracking */}
          {order.status !== "cancelled" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-card border border-border rounded-2xl p-6 mb-6">
              <h2 className="font-bold mb-5">Rastreamento</h2>
              <div className="relative">
                <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-border" />
                <div className="space-y-6">
                  {STATUS_STEPS.map((status, i) => {
                    const info = STATUS_LABELS[status];
                    const Icon = info?.icon ?? Check;
                    const isDone = i <= currentStep;
                    const isCurrent = i === currentStep;
                    return (
                      <div key={status} className="flex items-center gap-4 relative">
                        <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${isDone ? "bg-primary border-primary" : "bg-background border-border"}`}>
                          <Icon className={`h-4 w-4 ${isDone ? "text-black" : "text-muted-foreground"}`} />
                        </div>
                        <div>
                          <p className={`text-sm font-bold ${isDone ? "text-foreground" : "text-muted-foreground"}`}>
                            {info?.label}
                            {isCurrent && <span className="ml-2 text-xs text-primary font-bold">• Atual</span>}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* Items */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border rounded-2xl p-6 mb-6">
            <h2 className="font-bold mb-4 flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" /> Itens do Pedido
            </h2>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-secondary rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={teamImages[item.team] ?? "/images/real-madrid.png"}
                      alt={item.productName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{item.productName}</p>
                    <p className="text-xs text-muted-foreground">{item.team} • Tam. {item.size} • Qtd: {item.quantity}</p>
                    {(item.customName || item.customNumber) && (
                      <p className="text-xs text-primary font-mono">
                        {item.customName} {item.customNumber && `#${item.customNumber}`}
                      </p>
                    )}
                  </div>
                  <p className="font-black text-primary">
                    R$ {(item.price * item.quantity).toFixed(2).replace(".", ",")}
                  </p>
                </div>
              ))}
            </div>
            <div className="border-t border-border mt-4 pt-4 space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>R$ {order.subtotal.toFixed(2).replace(".", ",")}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Frete ({order.shippingMethod})</span>
                <span>R$ {order.shippingCost.toFixed(2).replace(".", ",")}</span>
              </div>
              <div className="flex justify-between font-black text-base pt-1 border-t border-border">
                <span>Total</span>
                <span className="text-primary">R$ {order.total.toFixed(2).replace(".", ",")}</span>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Shipping */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card border border-border rounded-2xl p-5">
              <h2 className="font-bold mb-3 flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-primary" /> Endereço de Entrega
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {order.addressLine1}{order.addressLine2 && `, ${order.addressLine2}`}<br />
                {order.city}, {order.state} — {order.zipCode}<br />
                {order.country}
              </p>
            </motion.div>

            {/* Payment */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card border border-border rounded-2xl p-5">
              <h2 className="font-bold mb-3 flex items-center gap-2 text-sm">
                <CreditCard className="h-4 w-4 text-primary" /> Pagamento
              </h2>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Método</span>
                  <span className="font-semibold">{order.paymentMethod ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className={`font-bold ${order.paymentStatus === "paid" ? "text-green-400" : "text-yellow-400"}`}>
                    {order.paymentStatus === "paid" ? "Pago" : "Pendente"}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
