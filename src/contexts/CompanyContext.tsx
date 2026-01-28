/**
 * Contexto para gerenciar a empresa/espaço selecionado.
 * Usa useUserSession para evitar queries duplicadas.
 */

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useUserSession } from "@/hooks/useUserSession";

export type Company = string;

interface Space {
  id: string;
  label: string;
  description: string;
  color: string;
}

interface CompanyContextType {
  currentCompany: Company;
  setCurrentCompany: (company: Company) => void;
  allowedCompanies: Company[];
  availableSpaces: Space[];
  isAdmin: boolean;
  isLoading: boolean;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

const STORAGE_KEY = "conto-company-selection";

interface CompanyProviderProps {
  children: ReactNode;
}

export function CompanyProvider({ children }: CompanyProviderProps) {
  const session = useUserSession();
  const [currentCompany, setCurrentCompanyState] = useState<Company>(() => {
    return localStorage.getItem(STORAGE_KEY) || "";
  });

  // Mapear espaços disponíveis
  const availableSpaces: Space[] = session.availableSpaces.map(s => ({
    id: s.id,
    label: s.label,
    description: s.description || "",
    color: s.color || "bg-primary",
  }));

  // Atualizar empresa selecionada quando dados carregarem
  useEffect(() => {
    if (session.isLoading || session.spacesLoading) return;

    const spaceIds = availableSpaces.map(s => s.id);
    const savedCompany = localStorage.getItem(STORAGE_KEY);
    
    // Se a empresa salva é válida, mantém
    if (savedCompany && spaceIds.includes(savedCompany)) {
      if (currentCompany !== savedCompany) {
        setCurrentCompanyState(savedCompany);
      }
      return;
    }
    
    // Senão, seleciona a primeira disponível
    if (spaceIds.length > 0 && !spaceIds.includes(currentCompany)) {
      setCurrentCompanyState(spaceIds[0]);
      localStorage.setItem(STORAGE_KEY, spaceIds[0]);
    }
  }, [session.isLoading, session.spacesLoading, availableSpaces, currentCompany]);

  const setCurrentCompany = (company: Company) => {
    // Verificar se o usuário tem acesso
    if (!session.isAdmin && !session.allowedSpaces.includes(company)) {
      console.warn(`Usuário não tem acesso ao espaço ${company}`);
      return;
    }
    
    setCurrentCompanyState(company);
    localStorage.setItem(STORAGE_KEY, company);
  };

  return (
    <CompanyContext.Provider
      value={{
        currentCompany,
        setCurrentCompany,
        allowedCompanies: session.allowedSpaces,
        availableSpaces,
        isAdmin: session.isAdmin,
        isLoading: session.isLoading || session.spacesLoading,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error("useCompany must be used within a CompanyProvider");
  }
  return context;
}
