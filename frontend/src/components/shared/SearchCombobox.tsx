import { useRef } from "react";
import type { SearchEventSource } from "../../lib/analytics";
import type { AppLanguage } from "../../lib/i18n";
import type { OccupationSearchHit, OccupationSearchPayload } from "../../lib/types";
import { OccupationSearchFeedback } from "../../shared/OccupationSearchFeedback";
import { useOccupationSearchCombobox } from "../../shared/useOccupationSearchCombobox";

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
  const {
    query,
    suggestions,
    open,
    searchPayload,
    setOpen,
    handleInputChange,
    handleCompositionStart,
    handleCompositionUpdate,
    handleCompositionEnd,
    handleKeyDown,
    handleSuggestionSelect
  } = useOccupationSearchCombobox({
    value,
    onSelect,
    onCommit,
    onQueryChange
  });

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
        onChange={(event) => handleInputChange(event.target.value)}
        onCompositionStart={handleCompositionStart}
        onCompositionUpdate={(event) => handleCompositionUpdate(event.currentTarget.value)}
        onCompositionEnd={(event) => handleCompositionEnd(event.currentTarget.value)}
        onKeyDown={handleKeyDown}
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
              onClick={() => handleSuggestionSelect(suggestion)}
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
