import { Link } from "wouter";
import { motion } from "framer-motion";
import { Package, ChevronRight, ShoppingBag } from "lucide-react";
import { useListOrders } from "@workspace/api-client-react";
import Navbar from "@/components/Navbar";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Aguardando", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  processing: { label: "Processando", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  shipped: { label: "Enviado", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  delivered: { label: "Entregue", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  cancelled: { label: "Cancelado", color: "bg-red-500/20 text-red-400 border-red-500/30" },
};

export default function Orders() {
  const { data: orders, isLoading } = useListOrders();

  return (
    <div className="min-h-screen bg-background"><Navbar />
      <div className="pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-black mb-8">MEUS PEDIDOS</h1>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => <div key={i} className="bg-card rounded-2xl h-24 animate-pulse border border-border" />)}
            </div>
          ) : !orders || orders.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24">
              <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-black mb-2">Nenhum pedido ainda</h2>
              <p className="text-muted-foreground mb-6">Comece a explorar nosso catálogo</p>
              <Link href="/shop" className="inline-flex items-center gap-2 bg-primary text-black font-bold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors">
                Ver Catálogo
              </Link>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {orders.map((order, i) => {
                const status = STATUS_LABELS[order.status] ?? { label: order.status, color: "bg-secondary text-muted-foreground border-border" };
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <Link href={`/orders/${order.id}`} data-testid={`card-order-${order.id}`}>
                      <div className="group bg-card border border-border rounded-2xl p-5 hover:border-primary/40 transition-all hover:-translate-y-0.5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                              <Package className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-black">Pedido #{order.id}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(order.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${status.color}`}>{status.label}</span>
                            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground">
                            {order.items.length} {order.items.length === 1 ? "item" : "itens"}
                            {order.items.length > 0 && ` • ${order.items[0].productName}${order.items.length > 1 ? ` +${order.items.length - 1}` : ""}`}
                          </p>
                          <p className="font-black text-primary">R$ {order.total.toFixed(2).replace(".", ",")}</p>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
