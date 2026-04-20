import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type MutableRefObject } from "react";
import { searchOccupations } from "../lib/api";
import type { OccupationSearchHit, OccupationSearchPayload } from "../lib/types";
import {
  beginComposition,
  createSearchImeState,
  endComposition,
  hasFreshSearchPayload,
  shouldBlockSubmitOnEnter,
  shouldPropagateQueryChange
} from "./search-combobox-ime";

interface UseOccupationSearchComboboxOptions {
  value?: string;
  onSelect: (selection: OccupationSearchHit) => void;
  onCommit?: (query: string, selection?: OccupationSearchHit | null, payload?: OccupationSearchPayload | null) => void;
  onQueryChange?: (query: string) => void;
  searchDelayMs?: number;
  queryChangeDelayMs?: number;
  suggestionLimit?: number;
}

export function useOccupationSearchCombobox({
  value = "",
  onSelect,
  onCommit,
  onQueryChange,
  searchDelayMs = 80,
  queryChangeDelayMs = 90,
  suggestionLimit = 6
}: UseOccupationSearchComboboxOptions) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [searchPayload, setSearchPayload] = useState<OccupationSearchPayload | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const imeStateRef = useRef(createSearchImeState());
  const queryRef = useRef(query);
  const payloadRef = useRef<OccupationSearchPayload | null>(null);
  const queryChangeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  useEffect(() => {
    payloadRef.current = searchPayload;
  }, [searchPayload]);

  useEffect(() => {
    if (imeStateRef.current.isComposing) return;
    if (value === queryRef.current) return;
    clearPendingQueryChange(queryChangeTimerRef);
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (isComposing) return;

    if (!open && !query.trim()) {
      setSearchPayload(null);
      return;
    }

    let cancelled = false;
    const activeQuery = query;
    const timer = window.setTimeout(async () => {
      try {
        const payload = await searchOccupations(activeQuery);
        if (cancelled || queryRef.current !== activeQuery) return;
        setSearchPayload(payload);
      } catch {
        if (cancelled || queryRef.current !== activeQuery) return;
        setSearchPayload(null);
      }
    }, searchDelayMs);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [isComposing, open, query, searchDelayMs]);

  useEffect(() => {
    return () => clearPendingQueryChange(queryChangeTimerRef);
  }, []);

  const suggestions = useMemo(
    () => (searchPayload ? (searchPayload.suggestions.length ? searchPayload.suggestions : searchPayload.popularSearches).slice(0, suggestionLimit) : []),
    [searchPayload, suggestionLimit]
  );

  const scheduleQueryChange = (nextQuery: string) => {
    if (!onQueryChange) return;
    clearPendingQueryChange(queryChangeTimerRef);
    queryChangeTimerRef.current = window.setTimeout(() => {
      queryChangeTimerRef.current = null;
      onQueryChange(nextQuery);
    }, queryChangeDelayMs);
  };

  const handleInputChange = (nextQuery: string) => {
    setQuery(nextQuery);
    if (shouldPropagateQueryChange(imeStateRef.current.isComposing)) {
      scheduleQueryChange(nextQuery);
    }
    setOpen(true);
  };

  const handleCompositionStart = () => {
    imeStateRef.current = beginComposition(imeStateRef.current);
    setIsComposing(true);
  };

  const handleCompositionUpdate = (nextQuery: string) => {
    setQuery(nextQuery);
    setOpen(true);
  };

  const handleCompositionEnd = (nextQuery: string) => {
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    imeStateRef.current = endComposition(imeStateRef.current, now);
    setIsComposing(false);
    setQuery(nextQuery);
    scheduleQueryChange(nextQuery);
    setOpen(true);
  };

  const resolveLatestPayload = async () => {
    const activeQuery = queryRef.current;
    if (hasFreshSearchPayload(activeQuery, payloadRef.current)) {
      return payloadRef.current;
    }

    const payload = await searchOccupations(activeQuery);
    if (queryRef.current !== activeQuery) return null;
    setSearchPayload(payload);
    return payload;
  };

  const submitFirstMatch = async () => {
    const activeQuery = queryRef.current;
    clearPendingQueryChange(queryChangeTimerRef);
    const payload = await resolveLatestPayload();
    if (!payload || queryRef.current !== activeQuery) return;

    if (!payload.primaryResult) {
      onCommit?.(activeQuery, null, payload);
      return;
    }

    const committedQuery = activeQuery.trim() || payload.primaryResult.label;
    onCommit?.(committedQuery, payload.primaryResult, payload);
    onSelect(payload.primaryResult);
    setOpen(false);
  };

  const handleSuggestionSelect = (suggestion: OccupationSearchHit) => {
    clearPendingQueryChange(queryChangeTimerRef);
    const committedQuery = queryRef.current.trim() || suggestion.label;
    onCommit?.(committedQuery, suggestion, payloadRef.current);
    onSelect(suggestion);
    setOpen(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const nativeEvent = event.nativeEvent as unknown as { isComposing?: boolean; keyCode?: number };
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    if (shouldBlockSubmitOnEnter({
      key: event.key,
      isComposing: imeStateRef.current.isComposing,
      nativeIsComposing: nativeEvent.isComposing,
      keyCode: nativeEvent.keyCode,
      now,
      lastCompositionEndAt: imeStateRef.current.lastCompositionEndAt
    })) {
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      void submitFirstMatch();
    }
  };

  return {
    query,
    suggestions,
    open,
    searchPayload,
    isComposing,
    canSubmit: Boolean(query.trim()) && !isComposing,
    setOpen,
    handleInputChange,
    handleCompositionStart,
    handleCompositionUpdate,
    handleCompositionEnd,
    handleKeyDown,
    handleSuggestionSelect,
    submitFirstMatch
  };
}

function clearPendingQueryChange(timerRef: MutableRefObject<number | null>) {
  if (timerRef.current === null) return;
  window.clearTimeout(timerRef.current);
  timerRef.current = null;
}
