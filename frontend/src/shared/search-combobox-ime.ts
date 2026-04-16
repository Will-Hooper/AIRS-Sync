import type { OccupationSearchPayload } from "../lib/types";

export const SEARCH_IME_ENTER_COOLDOWN_MS = 24;

export interface SearchImeState {
  isComposing: boolean;
  lastCompositionEndAt: number;
}

export function createSearchImeState(): SearchImeState {
  return {
    isComposing: false,
    lastCompositionEndAt: Number.NEGATIVE_INFINITY
  };
}

export function beginComposition(state: SearchImeState): SearchImeState {
  return {
    ...state,
    isComposing: true
  };
}

export function endComposition(state: SearchImeState, now: number): SearchImeState {
  return {
    isComposing: false,
    lastCompositionEndAt: now
  };
}

export function shouldBlockSubmitOnEnter(options: {
  key: string;
  isComposing: boolean;
  nativeIsComposing?: boolean;
  keyCode?: number;
  now: number;
  lastCompositionEndAt: number;
  cooldownMs?: number;
}) {
  if (options.key !== "Enter") return false;
  if (options.isComposing || options.nativeIsComposing || options.keyCode === 229) {
    return true;
  }

  return options.now - options.lastCompositionEndAt < (options.cooldownMs ?? SEARCH_IME_ENTER_COOLDOWN_MS);
}

export function shouldPropagateQueryChange(isComposing: boolean) {
  return !isComposing;
}

export function hasFreshSearchPayload(query: string, payload?: OccupationSearchPayload | null) {
  return Boolean(payload && payload.queryRaw === query);
}
