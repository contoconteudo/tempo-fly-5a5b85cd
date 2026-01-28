import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Company = "conto" | "amplia";

interface CompanyContextType {
  currentCompany: Company;
  setCurrentCompany: (company: Company) => void;
  allowedCompanies: Company[];
  isAdmin: boolean;
  setUserPermissions: (permissions: { allowedCompanies: Company[]; isAdmin: boolean }) => void;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

const STORAGE_KEY = "conto-company-selection";
const PERMISSIONS_KEY = "conto-user-permissions";

interface CompanyProviderProps {
  children: ReactNode;
}

export function CompanyProvider({ children }: CompanyProviderProps) {
  const [currentCompany, setCurrentCompanyState] = useState<Company>("conto");
  const [allowedCompanies, setAllowedCompanies] = useState<Company[]>(["conto", "amplia"]);
  const [isAdmin, setIsAdmin] = useState(true); // Default to admin for now

  // Load from localStorage on mount
  useEffect(() => {
    const savedCompany = localStorage.getItem(STORAGE_KEY) as Company | null;
    const savedPermissions = localStorage.getItem(PERMISSIONS_KEY);

    if (savedPermissions) {
      try {
        const permissions = JSON.parse(savedPermissions);
        setAllowedCompanies(permissions.allowedCompanies || ["conto", "amplia"]);
        setIsAdmin(permissions.isAdmin ?? true);
      } catch {
        // Use defaults if parsing fails
      }
    }

    if (savedCompany && ["conto", "amplia"].includes(savedCompany)) {
      setCurrentCompanyState(savedCompany);
    }
  }, []);

  const setCurrentCompany = (company: Company) => {
    setCurrentCompanyState(company);
    localStorage.setItem(STORAGE_KEY, company);
  };

  const setUserPermissions = (permissions: { allowedCompanies: Company[]; isAdmin: boolean }) => {
    setAllowedCompanies(permissions.allowedCompanies);
    setIsAdmin(permissions.isAdmin);
    localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(permissions));
  };

  return (
    <CompanyContext.Provider
      value={{
        currentCompany,
        setCurrentCompany,
        allowedCompanies,
        isAdmin,
        setUserPermissions,
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
