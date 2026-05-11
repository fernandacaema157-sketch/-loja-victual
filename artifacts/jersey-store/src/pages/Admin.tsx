import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  TrendingUp, Package, ShoppingCart, DollarSign,
  Users, BarChart3, ChevronRight, AlertTriangle
} from "lucide-react";
import { useGetAdminStats, useListAllOrders, useGetSalesByTeam } from "@workspace/api-client-react";
import Navbar from "@/components/Navbar";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Aguardando", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  processing: { label: "Processando", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  shipped: { label: "Enviado", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  delivered: { label: "Entregue", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  cancelled: { label: "Cancelado", color: "bg-red-500/20 text-red-400 border-red-500/30" },
};

export default function Admin() {
  const { data: stats, isLoading: loadingStats } = useGetAdminStats();
  const { data: orders, isLoading: loadingOrders } = useListAllOrders({ limit: 10 });
  const { data: salesByTeam } = useGetSalesByTeam();

  const statCards = [
    {
      icon: DollarSign,
      label: "Receita Total",
      value: stats ? `R$ ${stats.totalRevenue.toFixed(2).replace(".", ",")}` : "—",
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      icon: ShoppingCart,
      label: "Total de Pedidos",
      value: stats?.totalOrders ?? "—",
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      icon: Package,
      label: "Produtos Ativos",
      value: stats?.totalProducts ?? "—",
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
    {
      icon: Users,
      label: "Clientes Únicos",
      value: stats?.uniqueCustomers ?? "—",
      color: "text-orange-400",
      bg: "bg-orange-500/10",
    },
  ];

  const maxSales = Math.max(...(salesByTeam?.map((s) => s.revenue) ?? [1]));

  return (
    <div className="min-h-screen bg-background"><Navbar />
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-black">DASHBOARD ADMIN</h1>
              <p className="text-muted-foreground text-sm mt-1">Visão geral da loja</p>
            </div>
            <Link href="/admin/products" className="flex items-center gap-2 bg-primary text-black font-bold px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors text-sm" data-testid="link-admin-products">
              Gerenciar Produtos <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {statCards.map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="bg-card border border-border rounded-2xl p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2.5 ${card.bg} rounded-xl`}>
                    <card.icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  {loadingStats ? (
                    <div className="h-7 bg-secondary rounded animate-pulse w-24 mb-1" />
                  ) : (
                    <p className={`text-2xl font-black ${card.color}`}>{card.value}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent orders */}
            <div className="lg:col-span-2">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-border flex items-center justify-between">
                  <h2 className="font-black flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-primary" /> Pedidos Recentes
                  </h2>
                  <Link href="/admin/products" className="text-xs text-primary hover:underline">Ver todos</Link>
                </div>
                <div className="divide-y divide-border">
                  {loadingOrders ? (
                    [...Array(5)].map((_, i) => (
                      <div key={i} className="p-4 flex items-center gap-3">
                        <div className="h-4 bg-secondary rounded animate-pulse w-20" />
                        <div className="h-4 bg-secondary rounded animate-pulse flex-1" />
                        <div className="h-4 bg-secondary rounded animate-pulse w-16" />
                      </div>
                    ))
                  ) : orders?.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground text-sm">Nenhum pedido ainda</div>
                  ) : (
                    orders?.map((order) => {
                      const status = STATUS_LABELS[order.status] ?? { label: order.status, color: "bg-secondary text-muted-foreground border-border" };
                      return (
                        <Link key={order.id} href={`/orders/${order.id}`}>
                          <div className="p-4 flex items-center justify-between hover:bg-secondary/30 transition-colors cursor-pointer" data-testid={`admin-order-row-${order.id}`}>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-black text-muted-foreground w-10">#{order.id}</span>
                              <div>
                                <p className="text-sm font-semibold truncate max-w-[150px]">{order.customerName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border hidden sm:block ${status.color}`}>{status.label}</span>
                              <span className="text-sm font-black text-primary">R$ {order.total.toFixed(2).replace(".", ",")}</span>
                            </div>
                          </div>
                        </Link>
                      );
                    })
                  )}
                </div>
              </motion.div>
            </div>

            {/* Sales by team */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-border">
                <h2 className="font-black flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" /> Vendas por Time
                </h2>
              </div>
              <div className="p-5 space-y-4">
                {!salesByTeam || salesByTeam.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhuma venda ainda</p>
                ) : (
                  salesByTeam.slice(0, 8).map((item, i) => (
                    <div key={item.team}>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-semibold truncate max-w-[120px]">{item.team}</span>
                        <span className="text-primary font-bold">R$ {item.revenue.toFixed(0)}</span>
                      </div>
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(item.revenue / maxSales) * 100}%` }}
                          transition={{ delay: 0.4 + i * 0.05, duration: 0.6 }}
                          className="h-full bg-primary rounded-full"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>

          {/* Low stock warning */}
          {stats?.lowStockProducts && stats.lowStockProducts.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-6 bg-orange-500/10 border border-orange-500/30 rounded-2xl p-5">
              <h3 className="font-bold text-orange-400 flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4" /> Estoque Baixo
              </h3>
              <div className="flex flex-wrap gap-2">
                {stats.lowStockProducts.map((p) => (
                  <span key={p.id} className="text-xs bg-orange-500/10 border border-orange-500/30 text-orange-300 px-3 py-1 rounded-full font-semibold">
                    {p.name} ({p.stock} restantes)
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
