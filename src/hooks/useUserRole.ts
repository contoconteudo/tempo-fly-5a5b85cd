import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { MOCK_USERS, MODULE_PERMISSIONS, AppRole, ModulePermission } from "@/data/mockData";

// Re-exportando tipos para uso externo
export type { AppRole, ModulePermission };

interface UseUserRoleReturn {
  role: AppRole | null;
  isLoading: boolean;
  isAdmin: boolean;
  isGestor: boolean;
  isComercial: boolean;
  isAnalista: boolean;
  hasRole: (role: AppRole) => boolean;
  canAccessModule: (module: ModulePermission) => boolean;
}

export function useUserRole(): UseUserRoleReturn {
  const { user, isLoading: authLoading } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setRole(null);
      setIsLoading(false);
      return;
    }

    // Busca role do usuário nos dados mockados
    const mockUser = MOCK_USERS.find((u) => u.id === user.id);
    
    if (mockUser) {
      setRole(mockUser.role);
    } else {
      // Usuário novo criado via signUp - default para analista
      setRole("analista");
    }
    
    setIsLoading(false);
  }, [user, authLoading]);

  const hasRole = (checkRole: AppRole): boolean => role === checkRole;

  const canAccessModule = (module: ModulePermission): boolean => {
    if (!role) return false;
    return MODULE_PERMISSIONS[module]?.includes(role) ?? false;
  };

  return {
    role,
    isLoading: isLoading || authLoading,
    isAdmin: role === "admin",
    isGestor: role === "gestor",
    isComercial: role === "comercial",
    isAnalista: role === "analista",
    hasRole,
    canAccessModule,
  };
}
