"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import { guideSteps, type GuideStep } from "@/lib/client/guideSteps";

type HighlightBox = {
  top: number;
  left: number;
  width: number;
  height: number;
};

type GuideContextValue = {
  active: boolean;
  index: number;
  step: GuideStep;
  highlight: HighlightBox | null;
  start: () => void;
  next: () => void;
  previous: () => void;
  skip: () => void;
  restart: () => void;
};

const GuideContext = createContext<GuideContextValue | null>(null);

export function GuideProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const autoStarted = useRef(false);
  const [active, setActive] = useState(false);
  const [index, setIndex] = useState(0);
  const [highlight, setHighlight] = useState<HighlightBox | null>(null);
  const step = guideSteps[index];

  const focusStep = useCallback((nextIndex: number) => {
    const nextStep = guideSteps[nextIndex];
    setIndex(nextIndex);
    if (!nextStep) return;
    const targetRoutePath = nextStep.route.split("?")[0];
    const route = new URL(nextStep.route, window.location.origin);
    const currentDataset = new URLSearchParams(window.location.search).get("datasetId");
    if (currentDataset && !route.searchParams.get("datasetId")) route.searchParams.set("datasetId", currentDataset);
    const nextRoute = `${route.pathname}${route.search}`;
    if (pathname !== targetRoutePath) {
      router.push(nextRoute);
    }
    window.setTimeout(() => {
      const target = document.querySelector<HTMLElement>(`[data-tour-id="${nextStep.targetId}"]`);
      if (!target) {
        setHighlight(null);
        return;
      }
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      window.setTimeout(() => {
        const rect = target.getBoundingClientRect();
        setHighlight({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height,
        });
      }, 420);
    }, pathname === targetRoutePath ? 80 : 650);
  }, [pathname, router]);

  const start = useCallback(() => {
    setActive(true);
    focusStep(0);
  }, [focusStep]);

  const next = useCallback(() => {
    const nextIndex = Math.min(index + 1, guideSteps.length - 1);
    focusStep(nextIndex);
  }, [focusStep, index]);

  const previous = useCallback(() => {
    const nextIndex = Math.max(index - 1, 0);
    focusStep(nextIndex);
  }, [focusStep, index]);

  const skip = useCallback(() => {
    setActive(false);
    setHighlight(null);
  }, []);

  const restart = useCallback(() => {
    setActive(true);
    focusStep(0);
  }, [focusStep]);

  useEffect(() => {
    if (autoStarted.current) return;
    autoStarted.current = true;
    const timer = window.setTimeout(() => {
      setActive(true);
      focusStep(0);
    }, 700);
    return () => window.clearTimeout(timer);
  }, [focusStep]);

  const value = useMemo(() => ({ active, index, step, highlight, start, next, previous, skip, restart }), [active, highlight, index, next, previous, restart, skip, start, step]);

  return <GuideContext.Provider value={value}>{children}</GuideContext.Provider>;
}

export function useGuide() {
  const value = useContext(GuideContext);
  if (!value) throw new Error("useGuide must be used inside GuideProvider");
  return value;
}
