import { create } from 'zustand';

export interface CommuteSession {
  origin: string;
  destination: string;
  hardDeadline?: string | null;
  confirmedDeparture?: string | null;
  lastRecommendation?: any | null;
}

interface RouteState {
  origin: string;
  destination: string;
  arrivalTime: string;
  avoidTollsOrTraffic: boolean;
  commuteSession: CommuteSession | null;
  setOrigin: (val: string) => void;
  setDestination: (val: string) => void;
  setArrivalTime: (val: string) => void;
  setAvoidTollsOrTraffic: (val: boolean) => void;
  setCommuteSession: (session: CommuteSession | null) => void;
  updateCommuteSession: (updates: Partial<CommuteSession>) => void;
}

export const useRouteStore = create<RouteState>((set) => ({
  origin: '',
  destination: '',
  arrivalTime: '09:00 AM',
  avoidTollsOrTraffic: false,
  commuteSession: null,
  setOrigin: (val) => set({ origin: val }),
  setDestination: (val) => set({ destination: val }),
  setArrivalTime: (val) => set({ arrivalTime: val }),
  setAvoidTollsOrTraffic: (val) => set({ avoidTollsOrTraffic: val }),
  setCommuteSession: (session) => set({ commuteSession: session }),
  updateCommuteSession: (updates) => set((state) => ({
    commuteSession: state.commuteSession ? { ...state.commuteSession, ...updates } : null
  })),
}));
