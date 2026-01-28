import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { MOCK_USERS, USER_PERMISSIONS_KEY, CompanyAccess } from "@/data/mockData";
import { getAllSpaces, Space } from "@/hooks/useSpaces";

export type Company = CompanyAccess;

interface CompanyContextType {
  currentCompany: Company;
  setCurrentCompany: (company: Company) => void;
  allowedCompanies: Company[];
  availableSpaces: Space[];
  isAdmin: boolean;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

const STORAGE_KEY = "conto-company-selection";
const CURRENT_USER_KEY = "conto-mock-current-user";

interface CompanyProviderProps {
  children: ReactNode;
}

// Helper para obter permissões salvas
const getSavedPermissions = () => {
  try {
    const saved = localStorage.getItem(USER_PERMISSIONS_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

export function CompanyProvider({ children }: CompanyProviderProps) {
  const [currentCompany, setCurrentCompanyState] = useState<Company>("conto");
  const [allowedCompanies, setAllowedCompanies] = useState<Company[]>([]);
  const [availableSpaces, setAvailableSpaces] = useState<Space[]>(getAllSpaces);
  const [isAdmin, setIsAdmin] = useState(false);

  // Carregar espaços disponíveis
  const loadAvailableSpaces = useCallback(() => {
    setAvailableSpaces(getAllSpaces());
  }, []);

  // Função para carregar permissões do usuário atual
  const loadUserPermissions = useCallback(() => {
    const spaces = getAllSpaces();
    const spaceIds = spaces.map(s => s.id);
    const currentUserJson = localStorage.getItem(CURRENT_USER_KEY);
    
    if (!currentUserJson) {
      // Sem usuário logado, resetar para defaults
      setAllowedCompanies([]);
      setIsAdmin(false);
      return;
    }

    try {
      const currentUser = JSON.parse(currentUserJson);
      const mockUser = MOCK_USERS.find((u) => u.id === currentUser.id);
      
      if (mockUser) {
        // Admin tem acesso a tudo
        if (mockUser.role === "admin") {
          setIsAdmin(true);
          setAllowedCompanies(spaceIds);
        } else {
          setIsAdmin(false);
          
          // Verificar permissões salvas ou usar default do mock
          const savedPermissions = getSavedPermissions();
          const userPerms = savedPermissions[currentUser.id];
          
          if (userPerms?.companies && userPerms.companies.length > 0) {
            // Filtrar apenas espaços que ainda existem
            const validCompanies = userPerms.companies.filter((c: string) => spaceIds.includes(c));
            setAllowedCompanies(validCompanies);
            // Se empresa atual não está nas permitidas, mudar para a primeira permitida
            if (!validCompanies.includes(currentCompany) && validCompanies.length > 0) {
              setCurrentCompanyState(validCompanies[0]);
              localStorage.setItem(STORAGE_KEY, validCompanies[0]);
            }
          } else if (mockUser.companies && mockUser.companies.length > 0) {
            // Filtrar apenas espaços que ainda existem
            const validCompanies = mockUser.companies.filter(c => spaceIds.includes(c));
            setAllowedCompanies(validCompanies);
            // Se empresa atual não está nas permitidas, mudar para a primeira permitida
            if (!validCompanies.includes(currentCompany) && validCompanies.length > 0) {
              setCurrentCompanyState(validCompanies[0]);
              localStorage.setItem(STORAGE_KEY, validCompanies[0]);
            }
          } else {
            setAllowedCompanies([]);
          }
        }
      } else {
        // Usuário não encontrado no mock - sem permissões
        setAllowedCompanies([]);
        setIsAdmin(false);
      }
    } catch {
      setAllowedCompanies([]);
      setIsAdmin(false);
    }
  }, [currentCompany]);

  // Carregar permissões na inicialização
  useEffect(() => {
    const spaces = getAllSpaces();
    const spaceIds = spaces.map(s => s.id);
    
    const savedCompany = localStorage.getItem(STORAGE_KEY) as Company | null;
    if (savedCompany && spaceIds.includes(savedCompany)) {
      setCurrentCompanyState(savedCompany);
    } else if (spaceIds.length > 0) {
      // Se não há empresa salva ou a salva não existe mais, usar a primeira
      setCurrentCompanyState(spaceIds[0]);
    }
    
    loadAvailableSpaces();
    loadUserPermissions();
  }, []);

  // Escutar evento de mudança de usuário (login/logout)
  useEffect(() => {
    const handleAuthChange = () => {
      loadUserPermissions();
    };

    window.addEventListener("auth-user-changed", handleAuthChange);
    return () => window.removeEventListener("auth-user-changed", handleAuthChange);
  }, [loadUserPermissions]);

  // Escutar evento de mudança de espaços
  useEffect(() => {
    const handleSpacesChange = () => {
      loadAvailableSpaces();
      loadUserPermissions();
    };

    window.addEventListener("spaces-changed", handleSpacesChange);
    return () => window.removeEventListener("spaces-changed", handleSpacesChange);
  }, [loadAvailableSpaces, loadUserPermissions]);

  const setCurrentCompany = (company: Company) => {
    // Verificar se o usuário tem acesso a essa empresa
    if (!isAdmin && !allowedCompanies.includes(company)) {
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
        allowedCompanies,
        availableSpaces,
        isAdmin,
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
