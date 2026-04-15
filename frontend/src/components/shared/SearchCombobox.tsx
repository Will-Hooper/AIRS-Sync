import { useEffect, useRef, useState } from "react";
import { searchOccupations } from "../../lib/api";
import type { SearchEventSource } from "../../lib/analytics";
import type { AppLanguage } from "../../lib/i18n";
import type { OccupationSearchHit, OccupationSearchPayload } from "../../lib/types";
import { OccupationSearchFeedback } from "../../shared/OccupationSearchFeedback";

interface SearchComboboxProps {
  language: AppLanguage;
  placeholder: string;
  analyticsSource: SearchEventSource;
  value?: string;
  onSelect: (selection: OccupationSearchHit) => void;
  onCommit?: (query: string, selection?: OccupationSearchHit | null, payload?: OccupationSearchPayload | null) => void;
  onQueryChange?: (query: string) => void;
  className?: string;
}

export function SearchCombobox({
  language,
  placeholder,
  analyticsSource,
  value = "",
  onSelect,
  onCommit,
  onQueryChange,
  className = ""
}: SearchComboboxProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<OccupationSearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [searchPayload, setSearchPayload] = useState<OccupationSearchPayload | null>(null);
  const [isComposing, setIsComposing] = useState(false);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (!open && !query.trim()) {
      setSuggestions([]);
      setSearchPayload(null);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const payload = await searchOccupations(query);
        if (cancelled) return;
        setSearchPayload(payload);
        setSuggestions((payload.suggestions.length ? payload.suggestions : payload.popularSearches).slice(0, 6));
      } catch {
        if (cancelled) return;
        setSuggestions([]);
        setSearchPayload(null);
      }
    }, 120);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, query]);

  const submitFirstMatch = () => {
    if (!searchPayload?.primaryResult) {
      onCommit?.(query, null, searchPayload);
      return;
    }

    const committedQuery = query.trim() || searchPayload.primaryResult.label;
    onCommit?.(committedQuery, searchPayload.primaryResult, searchPayload);
    onSelect(searchPayload.primaryResult);
    setOpen(false);
  };

  const closeIfFocusLeft = () => {
    window.setTimeout(() => {
      const activeElement = document.activeElement;
      if (rootRef.current && activeElement instanceof Node && rootRef.current.contains(activeElement)) {
        return;
      }
      setOpen(false);
    }, 0);
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <input
        value={query}
        onFocus={() => setOpen(true)}
        onBlur={closeIfFocusLeft}
        onChange={(event) => {
          setQuery(event.target.value);
          onQueryChange?.(event.target.value);
          setOpen(true);
        }}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={(event) => {
          setIsComposing(false);
          setQuery(event.currentTarget.value);
          onQueryChange?.(event.currentTarget.value);
          setOpen(true);
        }}
        onKeyDown={(event) => {
          const nativeEvent = event.nativeEvent as KeyboardEvent & { isComposing?: boolean };
          if (isComposing || nativeEvent.isComposing || nativeEvent.keyCode === 229) {
            return;
          }

          if (event.key === "Enter") {
            event.preventDefault();
            submitFirstMatch();
          }
        }}
        className="airs-input"
        placeholder={placeholder}
      />
      {open && (suggestions.length > 0 || (searchPayload?.matchType === "no_result" && query.trim())) && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.75rem)] z-40 overflow-hidden rounded-[24px] border border-white/10 bg-slate-950/95 shadow-2xl backdrop-blur-xl">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                const committedQuery = query.trim() || suggestion.label;
                onCommit?.(committedQuery, suggestion, searchPayload);
                onSelect(suggestion);
                setOpen(false);
              }}
              className="flex w-full flex-col gap-1 border-b border-white/6 px-4 py-3 text-left transition hover:bg-white/5 last:border-b-0"
            >
              <span className="text-sm font-medium text-white">
                {language === "zh" ? suggestion.label : suggestion.labelEn || suggestion.occupation.title}
              </span>
              <span className="text-xs text-white/45">
                {suggestion.matchReason || `${suggestion.categoryLv1 || "职业"} · ${suggestion.occupation.socCode}`}
              </span>
            </button>
          ))}
          {searchPayload?.matchType === "no_result" && query.trim() && (
            <OccupationSearchFeedback
              source={analyticsSource}
              language={language}
              query={searchPayload.queryRaw || query}
              matchType={searchPayload.matchType}
              resultCount={searchPayload.resultCount}
            />
          )}
        </div>
      )}
    </div>
  );
}
