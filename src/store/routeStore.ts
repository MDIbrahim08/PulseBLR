import { create } from 'zustand';

interface RouteState {
  origin: string;
  destination: string;
  arrivalTime: string;
  setOrigin: (val: string) => void;
  setDestination: (val: string) => void;
  setArrivalTime: (val: string) => void;
}

export const useRouteStore = create<RouteState>((set) => ({
  origin: '',
  destination: '',
  arrivalTime: '09:00 AM',
  setOrigin: (val) => set({ origin: val }),
  setDestination: (val) => set({ destination: val }),
  setArrivalTime: (val) => set({ arrivalTime: val }),
}));
