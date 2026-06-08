import { create } from 'zustand';
import { DATA } from '@/db/mockData';

export type Candidate = {
  id: string;
  name: string;
  company: string;
  role: string;
  stage: string;
  score: number | null;
  hasReport: boolean;
  initials: string;
};

export type Mandate = {
  id: number;
  company: string;
  role: string;
  ctc: string;
  exp: string;
  sectors: string[];
  status: string;
  internalStatus: string;
  consultant: string;
  opened: string;
  target: string;
  geography: string;
  workMode: string;
  clientPOC: string;
  pocEmail: string;
  pocPhone: string;
  candidates: Candidate[];
};

interface AppState {
  mandates: Mandate[];
  updateMandateStatus: (id: number, field: 'status' | 'internalStatus', value: string) => void;
  updateCandidateStage: (mandateId: number, candId: string, newStage: string) => void;
  addMandate: (mandate: Mandate) => void;
}

export const useAppStore = create<AppState>((set) => ({
  mandates: DATA.mandates as Mandate[],

  updateMandateStatus: (id, field, value) =>
    set((state) => ({
      mandates: state.mandates.map((m) =>
        m.id === id ? { ...m, [field]: value } : m
      ),
    })),

  updateCandidateStage: (mandateId, candId, newStage) =>
    set((state) => ({
      mandates: state.mandates.map((m) =>
        m.id === mandateId
          ? {
              ...m,
              candidates: m.candidates.map((c) =>
                c.id === candId ? { ...c, stage: newStage } : c
              ),
            }
          : m
      ),
    })),

  addMandate: (mandate) =>
    set((state) => ({ mandates: [...state.mandates, mandate] })),
}));
