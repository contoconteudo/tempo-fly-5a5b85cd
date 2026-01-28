/**
 * Hook para gerenciar espaços (empresas) do sistema.
 * Integrado diretamente ao Supabase.
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";

export interface Space {
  id: string;
  label: string;
  description: string;
  color: string;
  createdAt: string;
  user_id?: string;
}

// Cores disponíveis para novos espaços
export const SPACE_COLORS = [
  { value: "#c4378f", label: "Magenta" },
  { value: "#2563eb", label: "Azul" },
  { value: "#16a34a", label: "Verde" },
  { value: "#9333ea", label: "Roxo" },
  { value: "#ea580c", label: "Laranja" },
  { value: "#0891b2", label: "Ciano" },
  { value: "#e11d48", label: "Rosa" },
  { value: "#d97706", label: "Âmbar" },
];

interface SpaceRow {
  id: string;
  label: string;
  description: string | null;
  color: string | null;
  created_at: string;
  user_id: string;
}

export function useSpaces() {
  const { user } = useAuth();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Verificar se é admin
  const checkAdminRole = useCallback(async () => {
    if (!user?.id) return false;
    try {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();
      return (data as any)?.role === "admin";
    } catch {
      return false;
    }
  }, [user?.id]);

  // Carregar espaços do Supabase
  const fetchSpaces = useCallback(async () => {
    if (!user?.id) {
      setSpaces([]);
      setIsLoading(false);
      return;
    }

    try {
      const adminStatus = await checkAdminRole();
      setIsAdmin(adminStatus);

      // Admin vê todos os espaços, usuário normal apenas os próprios
      let query = supabase.from("spaces").select("*").order("created_at", { ascending: true });
      
      if (!adminStatus) {
        query = query.eq("user_id", user.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Erro ao carregar espaços:", error);
        setSpaces([]);
      } else if (data) {
        setSpaces(
          (data as SpaceRow[]).map((s) => ({
            id: s.id,
            label: s.label,
            description: s.description || "",
            color: s.color || "#c4378f",
            createdAt: s.created_at,
            user_id: s.user_id,
          }))
        );
      }
    } catch (err) {
      console.error("Erro ao carregar espaços:", err);
      setSpaces([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, checkAdminRole]);

  useEffect(() => {
    fetchSpaces();
  }, [fetchSpaces]);

  // Criar novo espaço
  const createSpace = useCallback(
    async (
      label: string,
      description: string,
      color: string
    ): Promise<{ success: boolean; error?: string; space?: Space }> => {
      if (!user?.id) {
        return { success: false, error: "Usuário não autenticado" };
      }

      if (!label.trim()) {
        return { success: false, error: "Nome é obrigatório" };
      }

      if (label.length > 50) {
        return { success: false, error: "Nome deve ter no máximo 50 caracteres" };
      }

      try {
        const { data, error } = await supabase
          .from("spaces")
          .insert({
            user_id: user.id,
            label: label.trim(),
            description: description.trim() || `Espaço ${label.trim()}`,
            color,
          } as any)
          .select()
          .single();

        if (error) {
          console.error("Erro ao criar espaço:", error);
          return { success: false, error: error.message };
        }

        if (data) {
          const d = data as any;
          const newSpace: Space = {
            id: d.id,
            label: d.label,
            description: d.description || "",
            color: d.color || "#c4378f",
            createdAt: d.created_at,
            user_id: d.user_id,
          };

          setSpaces((prev) => [...prev, newSpace]);
          window.dispatchEvent(new CustomEvent("spaces-changed"));
          return { success: true, space: newSpace };
        }

        return { success: false, error: "Erro desconhecido ao criar espaço" };
      } catch (err: any) {
        console.error("Erro ao criar espaço:", err);
        return { success: false, error: err.message || "Erro ao criar espaço" };
      }
    },
    [user?.id]
  );

  // Atualizar espaço
  const updateSpace = useCallback(
    async (
      id: string,
      updates: Partial<Omit<Space, "id" | "createdAt">>
    ): Promise<{ success: boolean; error?: string }> => {
      if (!user?.id) {
        return { success: false, error: "Usuário não autenticado" };
      }

      const space = spaces.find(s => s.id === id);
      if (!space) {
        return { success: false, error: "Espaço não encontrado" };
      }

      try {
        const { error } = await (supabase
          .from("spaces") as any)
          .update({
            label: updates.label,
            description: updates.description,
            color: updates.color,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id);

        if (error) {
          console.error("Erro ao atualizar espaço:", error);
          return { success: false, error: error.message };
        }

        setSpaces((prev) =>
          prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
        );
        window.dispatchEvent(new CustomEvent("spaces-changed"));
        return { success: true };
      } catch (err: any) {
        console.error("Erro ao atualizar espaço:", err);
        return { success: false, error: err.message || "Erro ao atualizar espaço" };
      }
    },
    [spaces, user?.id]
  );

  // Excluir espaço
  const deleteSpace = useCallback(
    async (id: string): Promise<{ success: boolean; error?: string }> => {
      if (!user?.id) {
        return { success: false, error: "Usuário não autenticado" };
      }

      const space = spaces.find(s => s.id === id);
      if (!space) {
        return { success: false, error: "Espaço não encontrado" };
      }

      if (spaces.length <= 1) {
        return { success: false, error: "Não é possível excluir o último espaço" };
      }

      try {
        const { error } = await supabase
          .from("spaces")
          .delete()
          .eq("id", id);

        if (error) {
          console.error("Erro ao excluir espaço:", error);
          return { success: false, error: error.message };
        }

        setSpaces((prev) => prev.filter((s) => s.id !== id));
        window.dispatchEvent(new CustomEvent("spaces-changed"));
        return { success: true };
      } catch (err: any) {
        console.error("Erro ao excluir espaço:", err);
        return { success: false, error: err.message || "Erro ao excluir espaço" };
      }
    },
    [spaces, user?.id]
  );

  // Obter IDs de todos os espaços
  const getSpaceIds = useCallback((): string[] => {
    return spaces.map(s => s.id);
  }, [spaces]);

  return {
    spaces,
    isLoading,
    isAdmin,
    createSpace,
    updateSpace,
    deleteSpace,
    getSpaceIds,
    refetch: fetchSpaces,
    SPACE_COLORS,
  };
}
