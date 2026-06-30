import { create } from 'zustand';

interface RouteState {
  origin: string;
  destination: string;
  arrivalTime: string;
  avoidTollsOrTraffic: boolean;
  setOrigin: (val: string) => void;
  setDestination: (val: string) => void;
  setArrivalTime: (val: string) => void;
  setAvoidTollsOrTraffic: (val: boolean) => void;
}

export const useRouteStore = create<RouteState>((set) => ({
  origin: '',
  destination: '',
  arrivalTime: '09:00 AM',
  avoidTollsOrTraffic: false,
  setOrigin: (val) => set({ origin: val }),
  setDestination: (val) => set({ destination: val }),
  setArrivalTime: (val) => set({ arrivalTime: val }),
  setAvoidTollsOrTraffic: (val) => set({ avoidTollsOrTraffic: val }),
}));
