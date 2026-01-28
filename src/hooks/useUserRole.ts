/**
 * Hook para verificar roles e permissões do usuário.
 * Wrapper sobre useUserSession para compatibilidade com código existente.
 */

import { useCallback } from "react";
import { useUserSession, AppRole, ModulePermission } from "./useUserSession";
import { supabase } from "@/integrations/supabase/client";

export type { AppRole, ModulePermission };
export type CompanyAccess = string;

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: AppRole | null;
  modules: ModulePermission[];
  companies: CompanyAccess[];
}

interface UseUserRoleReturn {
  role: AppRole | null;
  isLoading: boolean;
  isAdmin: boolean;
  isGestor: boolean;
  isComercial: boolean;
  isAnalista: boolean;
  hasRole: (role: AppRole) => boolean;
  canAccessModule: (module: ModulePermission) => boolean;
  canAccessCompany: (company: CompanyAccess) => boolean;
  getUserModules: () => ModulePermission[];
  getUserCompanies: () => CompanyAccess[];
  getAllUsers: () => Promise<UserProfile[]>;
  updateUserPermissions: (userId: string, modules: ModulePermission[], companies: CompanyAccess[]) => Promise<void>;
  updateUserRole: (userId: string, role: AppRole) => Promise<void>;
}

export function useUserRole(): UseUserRoleReturn {
  const session = useUserSession();

  const canAccessCompany = useCallback((company: CompanyAccess): boolean => {
    return session.canAccessSpace(company);
  }, [session]);

  const getUserModules = useCallback((): ModulePermission[] => {
    return session.modules;
  }, [session.modules]);

  const getUserCompanies = useCallback((): CompanyAccess[] => {
    return session.allowedSpaces;
  }, [session.allowedSpaces]);

  // Buscar todos os usuários (para admin)
  const getAllUsers = useCallback(async (): Promise<UserProfile[]> => {
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, email, full_name");

    if (error) {
      console.error("Erro ao buscar usuários:", error);
      return [];
    }

    // Buscar roles e permissões em paralelo para todos os usuários
    const usersWithRoles = await Promise.all(
      (profiles || []).map(async (profile) => {
        const [roleResult, permResult] = await Promise.all([
          supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", profile.id)
            .maybeSingle(),
          supabase
            .from("user_permissions")
            .select("allowed_modules, allowed_spaces")
            .eq("user_id", profile.id)
            .maybeSingle(),
        ]);

        return {
          ...profile,
          role: (roleResult.data?.role as AppRole) || null,
          modules: (permResult.data?.allowed_modules || []) as ModulePermission[],
          companies: permResult.data?.allowed_spaces || [],
        };
      })
    );

    return usersWithRoles;
  }, []);

  const updateUserPermissions = useCallback(async (
    userId: string, 
    modules: ModulePermission[], 
    companies: CompanyAccess[]
  ) => {
    const { data: existing } = await supabase
      .from("user_permissions")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("user_permissions")
        .update({ allowed_modules: modules, allowed_spaces: companies, updated_at: new Date().toISOString() })
        .eq("user_id", userId);
    } else {
      await supabase
        .from("user_permissions")
        .insert({ user_id: userId, allowed_modules: modules, allowed_spaces: companies });
    }

    // Se for o usuário atual, invalidar cache
    if (session.user?.id === userId) {
      await session.refreshSession();
    }
  }, [session]);

  const updateUserRole = useCallback(async (userId: string, newRole: AppRole) => {
    const { data: existing } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("user_roles")
        .update({ role: newRole })
        .eq("user_id", userId);
    } else {
      await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: newRole });
    }

    // Se for o usuário atual, invalidar cache
    if (session.user?.id === userId) {
      await session.refreshSession();
    }
  }, [session]);

  return {
    role: session.role,
    isLoading: session.isLoading,
    isAdmin: session.isAdmin,
    isGestor: session.role === "gestor",
    isComercial: session.role === "comercial",
    isAnalista: session.role === "analista",
    hasRole: session.hasRole,
    canAccessModule: session.canAccessModule,
    canAccessCompany,
    getUserModules,
    getUserCompanies,
    getAllUsers,
    updateUserPermissions,
    updateUserRole,
  };
}
