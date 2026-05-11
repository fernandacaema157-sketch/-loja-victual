import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Pencil, Trash2, Check, X, Package, Search } from "lucide-react";
import {
  useListProducts, useCreateProduct, useUpdateProduct, useDeleteProduct,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";

type ProductForm = {
  name: string;
  team: string;
  description: string;
  price: string;
  stock: string;
  sizes: string[];
  isFeatured: boolean;
  allowCustomization: boolean;
};

const SIZES = ["P", "M", "G", "GG"];
const defaultForm: ProductForm = {
  name: "", team: "", description: "", price: "", stock: "",
  sizes: ["P", "M", "G", "GG"], isFeatured: false, allowCustomization: true,
};

export default function AdminProducts() {
  const { data: products, isLoading } = useListProducts({});
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductForm>(defaultForm);

  const filtered = (products ?? []).filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.team.toLowerCase().includes(search.toLowerCase()),
  );

  const handleOpenCreate = () => {
    setForm(defaultForm);
    setEditId(null);
    setShowForm(true);
  };

  const handleOpenEdit = (p: (typeof products)[0]) => {
    setForm({
      name: p.name, team: p.team, description: p.description ?? "",
      price: String(p.price), stock: String(p.stock),
      sizes: p.sizes, isFeatured: p.isFeatured, allowCustomization: p.allowCustomization,
    });
    setEditId(p.id);
    setShowForm(true);
  };

  const handleSave = () => {
    const data = {
      name: form.name, team: form.team, description: form.description,
      price: Number(form.price), stock: Number(form.stock),
      sizes: form.sizes, isFeatured: form.isFeatured, allowCustomization: form.allowCustomization,
      imageUrl: null,
    };
    if (editId) {
      updateProduct.mutate({ id: editId, data }, {
        onSuccess: () => { queryClient.invalidateQueries(); toast({ title: "Produto atualizado!" }); setShowForm(false); },
        onError: () => toast({ title: "Erro ao atualizar", variant: "destructive" }),
      });
    } else {
      createProduct.mutate({ data }, {
        onSuccess: () => { queryClient.invalidateQueries(); toast({ title: "Produto criado!" }); setShowForm(false); },
        onError: () => toast({ title: "Erro ao criar", variant: "destructive" }),
      });
    }
  };

  const handleDelete = (id: number, name: string) => {
    if (!confirm(`Excluir "${name}"?`)) return;
    deleteProduct.mutate({ id }, {
      onSuccess: () => { queryClient.invalidateQueries(); toast({ title: "Produto removido" }); },
      onError: () => toast({ title: "Erro ao remover", variant: "destructive" }),
    });
  };

  return (
    <div className="min-h-screen bg-background"><Navbar />
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-black">GERENCIAR PRODUTOS</h1>
              <p className="text-muted-foreground text-sm mt-0.5">{products?.length ?? 0} produtos no catálogo</p>
            </div>
            <button onClick={handleOpenCreate} className="flex items-center gap-2 bg-primary text-black font-bold px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors text-sm" data-testid="button-add-product">
              <Plus className="h-4 w-4" /> Novo Produto
            </button>
          </div>

          {/* Form Modal */}
          {showForm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-border flex items-center justify-between">
                  <h2 className="font-black text-lg">{editId ? "Editar Produto" : "Novo Produto"}</h2>
                  <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Nome *</label>
                      <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome da camiseta" className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" data-testid="input-product-name" />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Time *</label>
                      <input value={form.team} onChange={(e) => setForm({ ...form, team: e.target.value })} placeholder="Ex: Real Madrid" className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" data-testid="input-product-team" />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Preço (R$) *</label>
                      <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="249.90" className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" data-testid="input-product-price" />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Descrição</label>
                      <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descrição do produto..." rows={3} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none" data-testid="input-product-description" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Estoque *</label>
                      <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="50" className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" data-testid="input-product-stock" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Tamanhos</label>
                      <div className="flex gap-2">
                        {SIZES.map((s) => (
                          <button
                            key={s} type="button"
                            onClick={() => setForm({ ...form, sizes: form.sizes.includes(s) ? form.sizes.filter((x) => x !== s) : [...form.sizes, s] })}
                            className={`px-2.5 py-1 rounded text-xs font-bold border transition-colors ${form.sizes.includes(s) ? "bg-primary text-black border-primary" : "bg-secondary border-border"}`}
                          >{s}</button>
                        ))}
                      </div>
                    </div>
                    <div className="col-span-2 flex gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} className="hidden" />
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${form.isFeatured ? "bg-primary border-primary" : "border-border"}`}>
                          {form.isFeatured && <Check className="h-3 w-3 text-black" />}
                        </div>
                        <span className="text-sm font-semibold">Destacado</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={form.allowCustomization} onChange={(e) => setForm({ ...form, allowCustomization: e.target.checked })} className="hidden" />
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${form.allowCustomization ? "bg-primary border-primary" : "border-border"}`}>
                          {form.allowCustomization && <Check className="h-3 w-3 text-black" />}
                        </div>
                        <span className="text-sm font-semibold">Personalizável</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setShowForm(false)} className="flex-1 border border-border py-3 rounded-xl font-bold text-sm hover:bg-secondary transition-colors">Cancelar</button>
                    <button onClick={handleSave} disabled={createProduct.isPending || updateProduct.isPending} className="flex-1 bg-primary text-black py-3 rounded-xl font-black text-sm hover:bg-primary/90 transition-colors disabled:opacity-50" data-testid="button-save-product">
                      {createProduct.isPending || updateProduct.isPending ? "Salvando..." : "Salvar"}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Buscar produto ou time..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-secondary border border-border rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:border-primary"
              data-testid="input-search-products"
            />
          </div>

          {/* Products table */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Produto</th>
                    <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Time</th>
                    <th className="text-right px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Preço</th>
                    <th className="text-right px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Estoque</th>
                    <th className="text-center px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Destaque</th>
                    <th className="text-right px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i}>
                        <td className="px-5 py-4"><div className="h-4 bg-secondary rounded animate-pulse w-40" /></td>
                        <td className="px-5 py-4 hidden md:table-cell"><div className="h-4 bg-secondary rounded animate-pulse w-24" /></td>
                        <td className="px-5 py-4"><div className="h-4 bg-secondary rounded animate-pulse w-16 ml-auto" /></td>
                        <td className="px-5 py-4 hidden sm:table-cell"><div className="h-4 bg-secondary rounded animate-pulse w-8 ml-auto" /></td>
                        <td className="px-5 py-4 hidden lg:table-cell"><div className="h-4 bg-secondary rounded animate-pulse w-8 mx-auto" /></td>
                        <td className="px-5 py-4"><div className="h-4 bg-secondary rounded animate-pulse w-20 ml-auto" /></td>
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center">
                        <Package className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground text-sm">Nenhum produto encontrado</p>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((p) => (
                      <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-secondary/20 transition-colors" data-testid={`product-row-${p.id}`}>
                        <td className="px-5 py-4">
                          <p className="font-semibold truncate max-w-[200px]">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.sizes.join(", ")}</p>
                        </td>
                        <td className="px-5 py-4 text-muted-foreground hidden md:table-cell">{p.team}</td>
                        <td className="px-5 py-4 text-right font-black text-primary">R$ {p.price.toFixed(2).replace(".", ",")}</td>
                        <td className={`px-5 py-4 text-right font-bold hidden sm:table-cell ${p.stock < 10 ? "text-orange-400" : "text-foreground"}`}>
                          {p.stock}
                        </td>
                        <td className="px-5 py-4 text-center hidden lg:table-cell">
                          {p.isFeatured ? <Check className="h-4 w-4 text-primary mx-auto" /> : <X className="h-4 w-4 text-muted-foreground mx-auto" />}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 justify-end">
                            <button onClick={() => handleOpenEdit(p)} className="p-1.5 hover:text-primary transition-colors" data-testid={`button-edit-${p.id}`}>
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDelete(p.id, p.name)} className="p-1.5 hover:text-destructive transition-colors" data-testid={`button-delete-${p.id}`}>
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
