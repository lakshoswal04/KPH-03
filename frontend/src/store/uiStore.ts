import { create } from "zustand";

interface UiState {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  showcaseTab: string;
  setShowcaseTab: (tab: string) => void;
  canColour: string;
  setCanColour: (hex: string) => void;
  wallColour: string;
  setWallColour: (hex: string) => void;
  adminToken: string | null;
  setAdminToken: (token: string | null) => void;
}

export const useUiStore = create<UiState>()((set) => ({
  mobileMenuOpen: false,
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  showcaseTab: "interior",
  setShowcaseTab: (tab) => set({ showcaseTab: tab }),
  canColour: "#E8590C",
  setCanColour: (hex) => set({ canColour: hex }),
  wallColour: "#A8C8A0",
  setWallColour: (hex) => set({ wallColour: hex }),
  adminToken: null,
  setAdminToken: (token) => set({ adminToken: token }),
}));
