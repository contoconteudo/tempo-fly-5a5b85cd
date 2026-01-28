import { useState, useEffect, useCallback } from "react";
import { MOCK_USERS, MockUser, MOCK_STORAGE_KEYS } from "@/data/mockData";

// Tipo simplificado do usuário para a interface
export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carrega usuário do localStorage na inicialização
  useEffect(() => {
    const savedUser = localStorage.getItem(MOCK_STORAGE_KEYS.CURRENT_USER);
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
      } catch {
        localStorage.removeItem(MOCK_STORAGE_KEYS.CURRENT_USER);
      }
    }
    setIsLoading(false);
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<void> => {
    // Busca usuário mockado
    const foundUser = MOCK_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (!foundUser) {
      throw new Error("Email ou senha incorretos");
    }

    const authUser: AuthUser = {
      id: foundUser.id,
      email: foundUser.email,
      full_name: foundUser.full_name,
    };

    setUser(authUser);
    localStorage.setItem(MOCK_STORAGE_KEYS.CURRENT_USER, JSON.stringify(authUser));
  }, []);

  const signUp = useCallback(async (email: string, password: string): Promise<void> => {
    // Verifica se email já existe
    const exists = MOCK_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    if (exists) {
      throw new Error("Este email já está cadastrado");
    }

    // Cria novo usuário (apenas em memória - não persiste no mock)
    const newUser: AuthUser = {
      id: `user-new-${Date.now()}`,
      email: email,
      full_name: email.split("@")[0],
    };

    // Em um sistema real, salvaria no backend
    // Por agora, apenas loga o usuário
    setUser(newUser);
    localStorage.setItem(MOCK_STORAGE_KEYS.CURRENT_USER, JSON.stringify(newUser));
  }, []);

  const signOut = useCallback(async () => {
    setUser(null);
    localStorage.removeItem(MOCK_STORAGE_KEYS.CURRENT_USER);
  }, []);

  return {
    user,
    session: user ? { user } : null, // Compatibilidade com interface anterior
    isLoading,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!user,
  };
}
