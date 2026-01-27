import { useLocalStorage } from "./useLocalStorage";
import { Lead, LeadStage } from "@/types";
import { useCallback, useEffect } from "react";
import { STORAGE_KEYS, AUTOMATION_CONFIG } from "@/lib/constants";

const initialLeads: Lead[] = [
  { id: "1", name: "Maria Silva", company: "Tech Startup", email: "maria@tech.com", phone: "(11) 99999-1111", value: 3500, temperature: "hot", origin: "Tráfego Pago", stage: "new", lastContact: "2026-01-26", notes: "", createdAt: "2026-01-20", stageChangedAt: "2026-01-20" },
  { id: "2", name: "Pedro Costa", company: "E-commerce X", email: "pedro@ecomm.com", phone: "(11) 99999-2222", value: 2800, temperature: "warm", origin: "Indicação", stage: "new", lastContact: "2026-01-25", notes: "", createdAt: "2026-01-18", stageChangedAt: "2026-01-18" },
  { id: "3", name: "Carla Mendes", company: "Clínica Saúde", email: "carla@clinica.com", phone: "(11) 99999-3333", value: 5500, temperature: "hot", origin: "Orgânico", stage: "new", lastContact: "2026-01-26", notes: "", createdAt: "2026-01-22", stageChangedAt: "2026-01-22" },
  { id: "4", name: "João Santos", company: "Corp Inc", email: "joao@corp.com", phone: "(11) 99999-4444", value: 4500, temperature: "warm", origin: "LinkedIn", stage: "contact", lastContact: "2026-01-24", notes: "", createdAt: "2026-01-15", stageChangedAt: "2026-01-15" },
  { id: "5", name: "Ana Lima", company: "Agency Pro", email: "ana@agency.com", phone: "(11) 99999-5555", value: 5500, temperature: "hot", origin: "Evento", stage: "contact", lastContact: "2026-01-26", notes: "", createdAt: "2026-01-10", stageChangedAt: "2026-01-10" },
  { id: "6", name: "Roberto Alves", company: "Startup Y", email: "roberto@startup.com", phone: "(11) 99999-6666", value: 5500, temperature: "hot", origin: "Outbound", stage: "proposal", lastContact: "2026-01-23", notes: "", createdAt: "2026-01-08", stageChangedAt: "2026-01-08" },
  { id: "7", name: "Fernanda Dias", company: "Loja Virtual", email: "fernanda@loja.com", phone: "(11) 99999-7777", value: 3000, temperature: "cold", origin: "Indicação", stage: "negotiation", lastContact: "2026-01-19", notes: "", createdAt: "2026-01-05", stageChangedAt: "2026-01-05" },
  { id: "8", name: "Lucas Pereira", company: "Tech Solutions", email: "lucas@tech.com", phone: "(11) 99999-8888", value: 5500, temperature: "hot", origin: "Tráfego Pago", stage: "won", lastContact: "2026-01-25", notes: "Fechou contrato Completão", createdAt: "2026-01-02", stageChangedAt: "2026-01-02" },
];

export function useLeads() {
  const [leads, setLeads] = useLocalStorage<Lead[]>(STORAGE_KEYS.LEADS, initialLeads);

  const addLead = useCallback(
    (data: Omit<Lead, "id" | "createdAt" | "stageChangedAt">) => {
      const now = new Date().toISOString();
      const newLead: Lead = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: now.split("T")[0],
        stageChangedAt: now,
      };
      setLeads((prev) => [...prev, newLead]);
      return newLead;
    },
    [setLeads]
  );

  const updateLead = useCallback(
    (id: string, data: Partial<Omit<Lead, "id" | "createdAt">>) => {
      setLeads((prev) =>
        prev.map((lead) => (lead.id === id ? { ...lead, ...data } : lead))
      );
    },
    [setLeads]
  );

  const deleteLead = useCallback(
    (id: string) => {
      setLeads((prev) => prev.filter((lead) => lead.id !== id));
    },
    [setLeads]
  );

  const moveLeadToStage = useCallback(
    (id: string, stage: LeadStage) => {
      const now = new Date().toISOString();
      setLeads((prev) =>
        prev.map((lead) =>
          lead.id === id
            ? { ...lead, stage, lastContact: now.split("T")[0], stageChangedAt: now }
            : lead
        )
      );
    },
    [setLeads]
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

      setLeads((prevLeads) => {
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
  }, [setLeads]);

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
