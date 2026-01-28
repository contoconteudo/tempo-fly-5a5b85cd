import { ReactNode } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useUserSession, ModulePermission } from "@/hooks/useUserSession";
import { Loader2, ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredModule?: ModulePermission;
}

export function ProtectedRoute({ children, requiredModule }: ProtectedRouteProps) {
  const navigate = useNavigate();
  const session = useUserSession();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  if (session.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Verificar permissão de módulo (se especificado)
  if (requiredModule && !session.canAccessModule(requiredModule)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <div className="text-center max-w-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mb-6">
            <ShieldX className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Acesso Negado</h1>
          <p className="text-muted-foreground mb-6">
            Você não tem permissão para acessar este módulo. 
            Entre em contato com o administrador para solicitar acesso.
          </p>
          <Button onClick={handleLogout} variant="outline">
            Sair e Fazer Login
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
