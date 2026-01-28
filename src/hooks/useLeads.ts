import { useLocalStorage } from "./useLocalStorage";
import { Lead, LeadStage } from "@/types";
import { useCallback, useEffect, useMemo } from "react";
import { STORAGE_KEYS, AUTOMATION_CONFIG } from "@/lib/constants";
import { MOCK_LEADS } from "@/data/mockData";
import { useCompany } from "@/contexts/CompanyContext";

export function useLeads() {
  const [allLeads, setAllLeads] = useLocalStorage<Lead[]>(STORAGE_KEYS.LEADS, MOCK_LEADS);
  const { currentCompany } = useCompany();

  // Filtrar leads pelo espaço atual
  const leads = useMemo(() => {
    return allLeads.filter((lead) => lead.company_id === currentCompany);
  }, [allLeads, currentCompany]);

  const addLead = useCallback(
    (data: Omit<Lead, "id" | "createdAt" | "stageChangedAt" | "project_id" | "user_id" | "company_id">) => {
      const now = new Date().toISOString();
      const newLead: Lead = {
        ...data,
        id: crypto.randomUUID(),
        project_id: "default",
        user_id: "current-user",
        company_id: currentCompany,
        createdAt: now.split("T")[0],
        stageChangedAt: now,
      };
      setAllLeads((prev) => [...prev, newLead]);
      return newLead;
    },
    [setAllLeads, currentCompany]
  );

  const updateLead = useCallback(
    (id: string, data: Partial<Omit<Lead, "id" | "createdAt" | "project_id" | "user_id" | "company_id">>) => {
      setAllLeads((prev) =>
        prev.map((lead) => (lead.id === id ? { ...lead, ...data } : lead))
      );
    },
    [setAllLeads]
  );

  const deleteLead = useCallback(
    (id: string) => {
      setAllLeads((prev) => prev.filter((lead) => lead.id !== id));
    },
    [setAllLeads]
  );

  const moveLeadToStage = useCallback(
    (id: string, stage: LeadStage) => {
      const now = new Date().toISOString();
      setAllLeads((prev) =>
        prev.map((lead) =>
          lead.id === id
            ? { ...lead, stage, lastContact: now.split("T")[0], stageChangedAt: now }
            : lead
        )
      );
    },
    [setAllLeads]
  );

  const getLeadsByStage = useCallback(
    (stage: LeadStage) => {
      return leads.filter((lead) => lead.stage === stage);
    },
    [leads]
  );

  const getPipelineStats = useCallback(() => {
    const activeLeads = leads.filter((l) => l.stage !== "lost");
    const totalValue = activeLeads.reduce((sum, l) => sum + l.value, 0);
    const proposalsSent = leads.filter((l) => ["proposal", "negotiation", "won"].includes(l.stage)).length;
    const won = leads.filter((l) => l.stage === "won");
    const conversionRate = leads.length > 0 ? Math.round((won.length / leads.length) * 100) : 0;
    const inNegotiation = leads.filter((l) => l.stage !== "won" && l.stage !== "lost").length;

    return {
      totalLeads: activeLeads.length,
      totalValue,
      proposalsSent,
      conversionRate,
      inNegotiation,
      wonCount: won.length,
      wonValue: won.reduce((sum, l) => sum + l.value, 0),
    };
  }, [leads]);

  // Automação: mover leads de "proposal" para "followup" após período configurado
  useEffect(() => {
    const checkAndMoveLeads = () => {
      const now = new Date().getTime();
      const thresholdMs = AUTOMATION_CONFIG.PROPOSAL_TO_FOLLOWUP_HOURS * 60 * 60 * 1000;

      setAllLeads((prevLeads) => {
        let changed = false;
        const updatedLeads = prevLeads.map((lead) => {
          if (lead.stage === "proposal") {
            const stageTime = new Date(lead.stageChangedAt).getTime();
            if (now - stageTime >= thresholdMs) {
              changed = true;
              return { 
                ...lead, 
                stage: "followup" as LeadStage, 
                stageChangedAt: new Date().toISOString() 
              };
            }
          }
          return lead;
        });
        return changed ? updatedLeads : prevLeads;
      });
    };

    // Verificar imediatamente ao carregar
    checkAndMoveLeads();

    // Verificar no intervalo configurado
    const interval = setInterval(checkAndMoveLeads, AUTOMATION_CONFIG.AUTOMATION_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [setAllLeads]);

  return {
    leads,
    addLead,
    updateLead,
    deleteLead,
    moveLeadToStage,
    getLeadsByStage,
    getPipelineStats,
  };
}
