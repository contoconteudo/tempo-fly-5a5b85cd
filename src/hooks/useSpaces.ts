/**
 * Hook para gerenciar espaços (empresas) do sistema.
 * Apenas admins podem criar e excluir espaços.
 */

import { useState, useEffect, useCallback } from "react";

export interface Space {
  id: string;
  label: string;
  description: string;
  color: string;
  createdAt: string;
}

const SPACES_STORAGE_KEY = "conto-spaces";

// Espaços padrão do sistema
const DEFAULT_SPACES: Space[] = [
  { 
    id: "conto", 
    label: "Conto", 
    description: "Agência Conto", 
    color: "bg-primary",
    createdAt: "2024-01-01T00:00:00Z"
  },
  { 
    id: "amplia", 
    label: "Amplia", 
    description: "Agência Amplia", 
    color: "bg-blue-600",
    createdAt: "2024-01-01T00:00:00Z"
  },
];

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

// Função para obter espaços do localStorage
const getStoredSpaces = (): Space[] => {
  try {
    const stored = localStorage.getItem(SPACES_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    // Inicializar com espaços padrão
    localStorage.setItem(SPACES_STORAGE_KEY, JSON.stringify(DEFAULT_SPACES));
    return DEFAULT_SPACES;
  } catch {
    return DEFAULT_SPACES;
  }
};

// Função para gerar ID único baseado no nome
const generateSpaceId = (name: string): string => {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-z0-9]/g, "-") // Substitui caracteres especiais por hífen
    .replace(/-+/g, "-") // Remove hífens duplicados
    .replace(/^-|-$/g, ""); // Remove hífens no início/fim
};

export function useSpaces() {
  const [spaces, setSpaces] = useState<Space[]>(getStoredSpaces);

  // Recarregar espaços quando houver mudança em outra aba
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SPACES_STORAGE_KEY) {
        setSpaces(getStoredSpaces());
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Salvar espaços no localStorage
  const saveSpaces = useCallback((newSpaces: Space[]) => {
    localStorage.setItem(SPACES_STORAGE_KEY, JSON.stringify(newSpaces));
    setSpaces(newSpaces);
    // Disparar evento para notificar outros componentes
    window.dispatchEvent(new CustomEvent("spaces-changed"));
  }, []);

  // Criar novo espaço
  const createSpace = useCallback((label: string, description: string, color: string): { success: boolean; error?: string; space?: Space } => {
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

    const newSpace: Space = {
      id,
      label: label.trim(),
      description: description.trim() || `Espaço ${label.trim()}`,
      color,
      createdAt: new Date().toISOString(),
    };

    const newSpaces = [...spaces, newSpace];
    saveSpaces(newSpaces);
    
    return { success: true, space: newSpace };
  }, [spaces, saveSpaces]);

  // Atualizar espaço existente
  const updateSpace = useCallback((id: string, updates: Partial<Omit<Space, "id" | "createdAt">>): { success: boolean; error?: string } => {
    const spaceIndex = spaces.findIndex(s => s.id === id);
    
    if (spaceIndex === -1) {
      return { success: false, error: "Espaço não encontrado" };
    }

    const updatedSpaces = [...spaces];
    updatedSpaces[spaceIndex] = {
      ...updatedSpaces[spaceIndex],
      ...updates,
    };
    
    saveSpaces(updatedSpaces);
    return { success: true };
  }, [spaces, saveSpaces]);

  // Excluir espaço
  const deleteSpace = useCallback((id: string): { success: boolean; error?: string } => {
    const space = spaces.find(s => s.id === id);
    
    if (!space) {
      return { success: false, error: "Espaço não encontrado" };
    }

    // Não permitir excluir se for o último espaço
    if (spaces.length <= 1) {
      return { success: false, error: "Não é possível excluir o último espaço" };
    }

    const newSpaces = spaces.filter(s => s.id !== id);
    saveSpaces(newSpaces);
    
    return { success: true };
  }, [spaces, saveSpaces]);

  // Obter IDs de todos os espaços (para tipagem dinâmica)
  const getSpaceIds = useCallback((): string[] => {
    return spaces.map(s => s.id);
  }, [spaces]);

  return {
    spaces,
    createSpace,
    updateSpace,
    deleteSpace,
    getSpaceIds,
    SPACE_COLORS,
  };
}

// Exportar função para uso em contextos sem hook
export const getAllSpaces = getStoredSpaces;
