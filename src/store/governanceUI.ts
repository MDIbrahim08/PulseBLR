import { create } from 'zustand';

interface HoldAction {
  id: string;
  type: string;
  description: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  resolve: (value: boolean) => void;
}

interface GovernanceUIState {
  holdAction: HoldAction | null;
  triggerHold: (action: Omit<HoldAction, 'id' | 'resolve'>) => Promise<boolean>;
  approveHold: () => void;
  rejectHold: () => void;
}

export const useGovernanceUIStore = create<GovernanceUIState>((set, get) => ({
  holdAction: null,
  
  triggerHold: (action) => {
    return new Promise((resolve) => {
      set({
        holdAction: {
          ...action,
          id: Math.random().toString(36).substring(7),
          resolve,
        },
      });
    });
  },
  
  approveHold: () => {
    const { holdAction } = get();
    if (holdAction) {
      holdAction.resolve(true);
      set({ holdAction: null });
    }
  },
  
  rejectHold: () => {
    const { holdAction } = get();
    if (holdAction) {
      holdAction.resolve(false);
      set({ holdAction: null });
    }
  },
}));
