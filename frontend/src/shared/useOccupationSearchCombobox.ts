import { useEffect, useRef, useState, type KeyboardEvent } from "react";
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
  suggestionLimit?: number;
}

export function useOccupationSearchCombobox({
  value = "",
  onSelect,
  onCommit,
  onQueryChange,
  searchDelayMs = 120,
  suggestionLimit = 6
}: UseOccupationSearchComboboxOptions) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<OccupationSearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [searchPayload, setSearchPayload] = useState<OccupationSearchPayload | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const imeStateRef = useRef(createSearchImeState());
  const queryRef = useRef(query);
  const payloadRef = useRef<OccupationSearchPayload | null>(null);

  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  useEffect(() => {
    payloadRef.current = searchPayload;
  }, [searchPayload]);

  useEffect(() => {
    if (imeStateRef.current.isComposing) return;
    if (value === queryRef.current) return;
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (isComposing) return;

    if (!open && !query.trim()) {
      setSuggestions([]);
      setSearchPayload(null);
      return;
    }

    let cancelled = false;
    const activeQuery = query;
    const timer = window.setTimeout(async () => {
      try {
        const payload = await searchOccupations(activeQuery);
        if (cancelled || queryRef.current !== activeQuery) return;
        syncPayload(payload, suggestionLimit, setSearchPayload, setSuggestions);
      } catch {
        if (cancelled || queryRef.current !== activeQuery) return;
        setSuggestions([]);
        setSearchPayload(null);
      }
    }, searchDelayMs);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [isComposing, open, query, searchDelayMs, suggestionLimit]);

  const handleInputChange = (nextQuery: string) => {
    setQuery(nextQuery);
    if (shouldPropagateQueryChange(imeStateRef.current.isComposing)) {
      onQueryChange?.(nextQuery);
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
    onQueryChange?.(nextQuery);
    setOpen(true);
  };

  const resolveLatestPayload = async () => {
    const activeQuery = queryRef.current;
    if (hasFreshSearchPayload(activeQuery, payloadRef.current)) {
      return payloadRef.current;
    }

    const payload = await searchOccupations(activeQuery);
    if (queryRef.current !== activeQuery) return null;
    syncPayload(payload, suggestionLimit, setSearchPayload, setSuggestions);
    return payload;
  };

  const submitFirstMatch = async () => {
    const activeQuery = queryRef.current;
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

function syncPayload(
  payload: OccupationSearchPayload,
  suggestionLimit: number,
  setSearchPayload: (payload: OccupationSearchPayload | null) => void,
  setSuggestions: (suggestions: OccupationSearchHit[]) => void
) {
  setSearchPayload(payload);
  setSuggestions((payload.suggestions.length ? payload.suggestions : payload.popularSearches).slice(0, suggestionLimit));
}
