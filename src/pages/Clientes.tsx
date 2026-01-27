import { AppLayout } from "@/components/layout/AppLayout";
import { Search, Filter, Plus, Building2, Mail, Phone, MoreHorizontal, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useClients } from "@/hooks/useClients";

const statusConfig = {
  active: { label: "Ativo", class: "bg-success/10 text-success border-success/20" },
  inactive: { label: "Inativo", class: "bg-warning/10 text-warning border-warning/20" },
  churn: { label: "Churn", class: "bg-destructive/10 text-destructive border-destructive/20" },
};

function NPSBadge({ score }: { score: number }) {
  const getColor = () => {
    if (score >= 9) return "text-success";
    if (score >= 7) return "text-warning";
    return "text-destructive";
  };

  return (
    <div className="flex items-center gap-1">
      <Star className={cn("h-3.5 w-3.5 fill-current", getColor())} />
      <span className={cn("text-sm font-semibold", getColor())}>{score}</span>
    </div>
  );
}

// Calculate LTV based on months since start date
function calculateLTV(monthlyValue: number, startDate: string): number {
  const start = new Date(startDate);
  const now = new Date();
  const months = Math.max(1, Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  return monthlyValue * months;
}

export default function Clientes() {
  const { clients, getStats } = useClients();
  const stats = getStats();

  return (
    <AppLayout title="Clientes" subtitle="Gestão de carteira de clientes">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <p className="stat-label">Clientes Ativos</p>
          <p className="stat-value">{stats.activeCount}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">MRR Total</p>
          <p className="stat-value">R$ {stats.totalMRR.toLocaleString('pt-BR')}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Ticket Médio</p>
          <p className="stat-value">R$ {stats.avgTicket.toLocaleString('pt-BR')}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">NPS Médio</p>
          <p className="stat-value text-success">{stats.avgNPS}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente..."
              className="w-80 pl-9 bg-muted/50 border-border/60"
            />
          </div>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Filter className="h-4 w-4" />
            Filtros
          </Button>
        </div>
        <Button className="gradient-primary text-primary-foreground gap-1.5">
          <Plus className="h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      {/* Clients Table */}
      <div className="stat-card overflow-hidden p-0">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left text-xs font-semibold text-muted-foreground p-4">Empresa</th>
              <th className="text-left text-xs font-semibold text-muted-foreground p-4">Contato</th>
              <th className="text-left text-xs font-semibold text-muted-foreground p-4">Pacote</th>
              <th className="text-left text-xs font-semibold text-muted-foreground p-4">Valor/Mês</th>
              <th className="text-left text-xs font-semibold text-muted-foreground p-4">Status</th>
              <th className="text-left text-xs font-semibold text-muted-foreground p-4">NPS</th>
              <th className="text-left text-xs font-semibold text-muted-foreground p-4">LTV</th>
              <th className="text-right text-xs font-semibold text-muted-foreground p-4">Ações</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors group">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{client.company}</p>
                      <p className="text-xs text-muted-foreground">{client.segment}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">{client.contact}</p>
                    <p className="text-xs text-muted-foreground">{client.email}</p>
                  </div>
                </td>
                <td className="p-4">
                  <Badge variant="secondary" className="font-medium">{client.package}</Badge>
                </td>
                <td className="p-4">
                  <p className="text-sm font-semibold text-foreground">R$ {client.monthlyValue.toLocaleString('pt-BR')}</p>
                </td>
                <td className="p-4">
                  <Badge className={statusConfig[client.status].class}>
                    {statusConfig[client.status].label}
                  </Badge>
                </td>
                <td className="p-4">
                  <NPSBadge score={client.nps} />
                </td>
                <td className="p-4">
                  <p className="text-sm font-medium text-muted-foreground">R$ {calculateLTV(client.monthlyValue, client.startDate).toLocaleString('pt-BR')}</p>
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 rounded hover:bg-muted transition-colors">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <button className="p-2 rounded hover:bg-muted transition-colors">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <button className="p-2 rounded hover:bg-muted transition-colors">
                      <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}
