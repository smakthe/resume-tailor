import { create } from "zustand";

export interface Suggestion {
  original: string;
  suggested: string;
  reason: string;
}

export interface WizardState {
  currentStep: number;
  extractedResumeText: string;
  originalFileName: string;
  originalPdfBytes: Uint8Array | null;
  jobDescription: string;
  aiSuggestions: Suggestion[];
  acceptedSuggestions: Suggestion[];
  finalApprovedText: string;

  setStep: (step: number) => void;
  setResumeText: (text: string) => void;
  setOriginalFileName: (name: string) => void;
  setOriginalPdfBytes: (bytes: Uint8Array) => void;
  setJobDescription: (text: string) => void;
  setAiSuggestions: (suggestions: Suggestion[]) => void;
  setAcceptedSuggestions: (suggestions: Suggestion[]) => void;
  setFinalApprovedText: (text: string) => void;
  reset: () => void;
}

export const useWizardStore = create<WizardState>((set) => ({
  currentStep: 1,
  extractedResumeText: "",
  originalFileName: "",
  originalPdfBytes: null,
  jobDescription: "",
  aiSuggestions: [],
  acceptedSuggestions: [],
  finalApprovedText: "",

  setStep: (step: number) => set({ currentStep: step }),
  setResumeText: (text: string) => set({ extractedResumeText: text }),
  setOriginalFileName: (name: string) => set({ originalFileName: name }),
  setOriginalPdfBytes: (bytes: Uint8Array) =>
    set({ originalPdfBytes: bytes }),
  setJobDescription: (text: string) => set({ jobDescription: text }),
  setAiSuggestions: (suggestions: Suggestion[]) =>
    set({ aiSuggestions: suggestions }),
  setAcceptedSuggestions: (suggestions: Suggestion[]) =>
    set({ acceptedSuggestions: suggestions }),
  setFinalApprovedText: (text: string) => set({ finalApprovedText: text }),
  reset: () =>
    set({
      currentStep: 1,
      extractedResumeText: "",
      originalFileName: "",
      originalPdfBytes: null,
      jobDescription: "",
      aiSuggestions: [],
      acceptedSuggestions: [],
      finalApprovedText: "",
    }),
}));
