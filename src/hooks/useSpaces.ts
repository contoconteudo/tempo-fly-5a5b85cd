/**
 * Hook para gerenciar espaços (empresas) do sistema.
 * Usa useUserSession para evitar queries duplicadas.
 */

import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserSession } from "./useUserSession";

export interface Space {
  id: string;
  label: string;
  description: string;
  color: string;
  createdAt: string;
}

// Cores disponíveis para novos espaços
export const SPACE_COLORS = [
  { value: "bg-primary", label: "Magenta" },
  { value: "bg-blue-600", label: "Azul" },
  { value: "bg-green-600", label: "Verde" },
  { value: "bg-purple-600", label: "Roxo" },
  { value: "bg-orange-600", label: "Laranja" },
  { value: "bg-cyan-600", label: "Ciano" },
  { value: "bg-rose-600", label: "Rosa" },
  { value: "bg-amber-600", label: "Âmbar" },
];

// Função para gerar ID único baseado no nome
const generateSpaceId = (name: string): string => {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

export function useSpaces() {
  const session = useUserSession();

  // Mapear espaços do formato do banco para o formato do hook
  const spaces: Space[] = session.availableSpaces.map(s => ({
    id: s.id,
    label: s.label,
    description: s.description || "",
    color: s.color || "bg-primary",
    createdAt: s.created_at,
  }));

  // Criar novo espaço
  const createSpace = useCallback(async (
    label: string, 
    description: string, 
    color: string
  ): Promise<{ success: boolean; error?: string; space?: Space }> => {
    if (!session.user?.id) {
      return { success: false, error: "Usuário não autenticado" };
    }

    const id = generateSpaceId(label);
    
    // Validações
    if (!label.trim()) {
      return { success: false, error: "Nome é obrigatório" };
    }
    
    if (label.length > 50) {
      return { success: false, error: "Nome deve ter no máximo 50 caracteres" };
    }
    
    if (spaces.some(s => s.id === id)) {
      return { success: false, error: "Já existe um espaço com nome similar" };
    }

    const { data, error } = await supabase
      .from("spaces")
      .insert({
        id,
        label: label.trim(),
        description: description.trim() || `Espaço ${label.trim()}`,
        color,
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar espaço:", error);
      return { success: false, error: error.message };
    }

    const newSpace: Space = {
      id: data.id,
      label: data.label,
      description: data.description,
      color: data.color,
      createdAt: data.created_at,
    };

    // Disparar evento para atualizar cache
    window.dispatchEvent(new CustomEvent("spaces-changed"));
    await session.refreshSpaces();
    
    return { success: true, space: newSpace };
  }, [session, spaces]);

  // Atualizar espaço existente
  const updateSpace = useCallback(async (
    id: string, 
    updates: Partial<Omit<Space, "id" | "createdAt">>
  ): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase
      .from("spaces")
      .update(updates)
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    window.dispatchEvent(new CustomEvent("spaces-changed"));
    await session.refreshSpaces();
    
    return { success: true };
  }, [session]);

  // Excluir espaço
  const deleteSpace = useCallback(async (
    id: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (spaces.length <= 1) {
      return { success: false, error: "Não é possível excluir o último espaço" };
    }

    const { error } = await supabase
      .from("spaces")
      .delete()
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    window.dispatchEvent(new CustomEvent("spaces-changed"));
    await session.refreshSpaces();
    
    return { success: true };
  }, [session, spaces.length]);

  // Obter IDs de todos os espaços
  const getSpaceIds = useCallback((): string[] => {
    return spaces.map(s => s.id);
  }, [spaces]);

  return {
    spaces,
    isLoading: session.spacesLoading,
    createSpace,
    updateSpace,
    deleteSpace,
    getSpaceIds,
    refreshSpaces: session.refreshSpaces,
    SPACE_COLORS,
  };
}

// Função helper para uso fora de componentes React
export async function getAllSpaces(): Promise<Space[]> {
  const { data, error } = await supabase
    .from("spaces")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Erro ao carregar espaços:", error);
    return [];
  }

  return (data || []).map(s => ({
    id: s.id,
    label: s.label,
    description: s.description || "",
    color: s.color || "bg-primary",
    createdAt: s.created_at,
  }));
}
