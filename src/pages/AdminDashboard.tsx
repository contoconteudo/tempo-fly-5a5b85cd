import { AppLayout } from "@/components/layout/AppLayout";
import { useState, useMemo } from "react";
import { Shield, Edit2, Save, X, Users, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useUserRole, type AppRole, type ModulePermission } from "@/hooks/useUserRole";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MOCK_USERS, DEFAULT_ROLE_PERMISSIONS } from "@/data/mockData";

interface UserWithRole {
  id: string;
  email: string;
  full_name: string;
  role: AppRole;
  created_at: string;
  modules: ModulePermission[];
}

const AVAILABLE_ROLES: { value: AppRole; label: string; description: string }[] = [
  { value: "admin", label: "Admin", description: "Acesso total ao sistema" },
  { value: "gestor", label: "Gestor", description: "Gerencia estratégia, objetivos e equipe" },
  { value: "comercial", label: "Comercial", description: "Acesso ao CRM e clientes" },
  { value: "analista", label: "Analista", description: "Acesso básico ao dashboard" },
];

const AVAILABLE_MODULES: { id: ModulePermission; label: string; description: string }[] = [
  { id: "dashboard", label: "Dashboard", description: "Visão geral do sistema" },
  { id: "strategy", label: "Estratégia", description: "Objetivos e metas estratégicas" },
  { id: "crm", label: "CRM", description: "Gestão de leads e oportunidades" },
  { id: "clients", label: "Clientes", description: "Gestão de clientes ativos" },
  { id: "settings", label: "Configurações", description: "Configurações pessoais" },
];

const getRoleBadgeStyle = (role: AppRole) => {
  switch (role) {
    case "admin":
      return "bg-red-500/10 text-red-600 border-red-500/20";
    case "gestor":
      return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    case "comercial":
      return "bg-green-500/10 text-green-600 border-green-500/20";
    case "analista":
      return "bg-orange-500/10 text-orange-600 border-orange-500/20";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export default function AdminDashboard() {
  const { isAdmin } = useUserRole();
  
  // Usar dados mockados diretamente
  const users: UserWithRole[] = useMemo(() => {
    return MOCK_USERS.map((user) => ({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      created_at: user.created_at,
      modules: DEFAULT_ROLE_PERMISSIONS[user.role],
    }));
  }, []);

  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole>("analista");
  const [selectedModules, setSelectedModules] = useState<ModulePermission[]>([]);
  const [saving, setSaving] = useState(false);

  const handleEditUser = (user: UserWithRole) => {
    setEditingUser(user);
    setSelectedRole(user.role);
    setSelectedModules(user.modules);
  };

  const handleRoleChange = (role: AppRole) => {
    setSelectedRole(role);
    // Aplicar permissões padrão da role
    setSelectedModules(DEFAULT_ROLE_PERMISSIONS[role] || []);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    setSaving(true);
    
    // Simular salvamento (em produção, iria para o backend)
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    toast.success("Permissões atualizadas com sucesso (modo demo)");
    toast.info("Em produção, as alterações seriam salvas no banco de dados.");
    
    setSaving(false);
    setEditingUser(null);
  };

  const toggleModule = (moduleId: ModulePermission) => {
    setSelectedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((m) => m !== moduleId)
        : [...prev, moduleId]
    );
  };

  if (!isAdmin) {
    return (
      <AppLayout title="Acesso Negado" subtitle="Você não tem permissão para acessar esta página">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Esta página é restrita a administradores do sistema.
          </AlertDescription>
        </Alert>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Administração"
      subtitle="Gerencie usuários e permissões do sistema"
    >
      <div className="space-y-6">
        {/* Info Card */}
        <Alert className="bg-primary/5 border-primary/20">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Modo Demonstração:</strong> Os dados são mockados. Em produção, 
            os usuários serão carregados do banco de dados e as alterações serão persistidas.
          </AlertDescription>
        </Alert>

        {/* Users Table */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="section-title">Usuários do Sistema</h3>
            </div>
            <Badge variant="outline" className="text-xs">
              {users.length} usuário(s)
            </Badge>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Módulos</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{user.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(getRoleBadgeStyle(user.role))}
                    >
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.modules.slice(0, 3).map((module) => (
                        <Badge
                          key={module}
                          variant="secondary"
                          className="text-xs"
                        >
                          {module}
                        </Badge>
                      ))}
                      {user.modules.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{user.modules.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditUser(user)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Role Descriptions */}
        <div className="stat-card">
          <h3 className="section-title mb-4">Níveis de Acesso</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {AVAILABLE_ROLES.map((role) => (
              <div
                key={role.value}
                className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
              >
                <Badge
                  variant="outline"
                  className={cn("mb-2", getRoleBadgeStyle(role.value))}
                >
                  {role.label}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  {role.description}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {DEFAULT_ROLE_PERMISSIONS[role.value].map((module) => (
                    <span
                      key={module}
                      className="text-xs text-muted-foreground/70"
                    >
                      {module}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Permissões</DialogTitle>
            <DialogDescription>
              Configure a role e os módulos que o usuário pode acessar
            </DialogDescription>
          </DialogHeader>

          {editingUser && (
            <div className="space-y-6 py-4">
              {/* User Info */}
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium">{editingUser.full_name}</p>
                <p className="text-sm text-muted-foreground">{editingUser.email}</p>
              </div>

              {/* Role Selection */}
              <div className="space-y-2">
                <Label>Role do Usuário</Label>
                <Select
                  value={selectedRole}
                  onValueChange={(v) => handleRoleChange(v as AppRole)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma role" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              getRoleBadgeStyle(role.value)
                            )}
                          >
                            {role.label}
                          </Badge>
                          <span className="text-muted-foreground text-xs">
                            {role.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Module Permissions */}
              <div className="space-y-3">
                <Label>Módulos Permitidos</Label>
                <div className="grid gap-2">
                  {AVAILABLE_MODULES.map((module) => (
                    <div
                      key={module.id}
                      className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-accent/5 transition-colors"
                    >
                      <Checkbox
                        id={module.id}
                        checked={selectedModules.includes(module.id)}
                        onCheckedChange={() => toggleModule(module.id)}
                      />
                      <div className="space-y-0.5">
                        <Label
                          htmlFor={module.id}
                          className="font-medium cursor-pointer"
                        >
                          {module.label}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {module.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  * Alterações serão salvas no banco de dados em produção
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingUser(null)}
              disabled={saving}
            >
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
            <Button onClick={handleSaveUser} disabled={saving}>
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
