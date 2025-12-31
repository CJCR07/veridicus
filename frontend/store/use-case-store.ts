import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Case } from '@/../shared/types/database';

interface CaseState {
  currentCase: Case | null;
  setCurrentCase: (caseItem: Case | null) => void;
}

export const useCaseStore = create<CaseState>()(
  persist(
    (set) => ({
      currentCase: null,
      setCurrentCase: (caseItem) => set({ currentCase: caseItem }),
    }),
    {
      name: 'veridicus-case-storage',
    }
  )
);
