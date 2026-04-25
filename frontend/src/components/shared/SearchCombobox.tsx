import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { SearchEventSource } from "../../lib/analytics";
import type { AppLanguage } from "../../lib/i18n";
import type { OccupationSearchHit, OccupationSearchPayload } from "../../lib/types";
import { OccupationSearchFeedback } from "../../shared/OccupationSearchFeedback";
import { useOccupationSearchCombobox } from "../../shared/useOccupationSearchCombobox";

interface SearchComboboxProps {
  language: AppLanguage;
  placeholder: string;
  analyticsSource: SearchEventSource;
  buttonPlacement?: "outside" | "inline";
  buttonLabel?: string;
  buttonLabelClassName?: string;
  suggestionsPlacement?: "bottom" | "top";
  value?: string;
  onSelect: (selection: OccupationSearchHit) => void;
  onCommit?: (query: string, selection?: OccupationSearchHit | null, payload?: OccupationSearchPayload | null) => void;
  onQueryChange?: (query: string) => void;
  className?: string;
}

interface SuggestionPanelPosition {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  maxHeight: number;
}

export function SearchCombobox({
  language,
  placeholder,
  analyticsSource,
  buttonPlacement = "outside",
  buttonLabel,
  buttonLabelClassName = "",
  suggestionsPlacement = "bottom",
  value = "",
  onSelect,
  onCommit,
  onQueryChange,
  className = ""
}: SearchComboboxProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [suggestionPanelPosition, setSuggestionPanelPosition] = useState<SuggestionPanelPosition | null>(null);
  const {
    query,
    suggestions,
    open,
    searchPayload,
    canSubmit,
    setOpen,
    handleInputChange,
    handleCompositionStart,
    handleCompositionUpdate,
    handleCompositionEnd,
    handleKeyDown,
    handleSuggestionSelect,
    submitFirstMatch
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

  const inlineButton = buttonPlacement === "inline";
  const shouldRenderSuggestions = open && (suggestions.length > 0 || (searchPayload?.matchType === "no_result" && query.trim()));

  useLayoutEffect(() => {
    if (!shouldRenderSuggestions) {
      setSuggestionPanelPosition(null);
      return;
    }

    let frame = 0;
    const updatePosition = () => {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) return;

      const availableBelow = window.innerHeight - rect.bottom - 24;
      const availableAbove = rect.top - 24;
      const nextPosition = {
        top: suggestionsPlacement === "bottom" ? rect.bottom + 12 : undefined,
        bottom: suggestionsPlacement === "top" ? window.innerHeight - rect.top + 12 : undefined,
        left: rect.left,
        width: rect.width,
        maxHeight: Math.max(180, Math.min(380, suggestionsPlacement === "top" ? availableAbove : availableBelow))
      };

      setSuggestionPanelPosition((current) =>
        current
        && current.top === nextPosition.top
        && current.bottom === nextPosition.bottom
        && current.left === nextPosition.left
        && current.width === nextPosition.width
        && current.maxHeight === nextPosition.maxHeight
          ? current
          : nextPosition
      );
    };

    const scheduleUpdate = () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }

      frame = window.requestAnimationFrame(() => {
        frame = 0;
        updatePosition();
      });
    };

    scheduleUpdate();
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("scroll", scheduleUpdate, true);

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("scroll", scheduleUpdate, true);
    };
  }, [shouldRenderSuggestions, suggestions.length, searchPayload?.matchType, query, suggestionsPlacement]);

  const suggestionPanel = shouldRenderSuggestions && suggestionPanelPosition
    ? createPortal(
      <div
        className="airs-suggestions overflow-hidden rounded-[24px] shadow-2xl backdrop-blur-xl"
        style={{
          position: "fixed",
          top: suggestionPanelPosition.top,
          bottom: suggestionPanelPosition.bottom,
          left: suggestionPanelPosition.left,
          width: suggestionPanelPosition.width,
          maxHeight: suggestionPanelPosition.maxHeight,
          overflowY: "auto",
          zIndex: 1200
        }}
      >
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
      </div>,
      document.body
    )
    : null;

  return (
    <div ref={rootRef} className={`relative ${className}`.trim()}>
      <div className={inlineButton ? "relative" : "flex items-center gap-3"}>
        <input
          value={query}
          aria-label={placeholder}
          onFocus={() => setOpen(true)}
          onBlur={closeIfFocusLeft}
          onChange={(event) => handleInputChange(event.target.value)}
          onCompositionStart={handleCompositionStart}
          onCompositionUpdate={(event) => handleCompositionUpdate(event.currentTarget.value)}
          onCompositionEnd={(event) => handleCompositionEnd(event.currentTarget.value)}
          onKeyDown={handleKeyDown}
          className={`airs-input ${inlineButton ? "pr-32" : "flex-1"}`}
          placeholder={placeholder}
        />
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => void submitFirstMatch()}
          disabled={!canSubmit}
          className={`airs-button-primary disabled:cursor-not-allowed disabled:opacity-50 ${
            inlineButton ? "airs-input-inline-button" : "shrink-0 px-5 py-3"
          }`}
        >
          <span className={buttonLabelClassName}>{buttonLabel || (language === "zh" ? "搜索" : "Search")}</span>
        </button>
      </div>
      {suggestionPanel}
    </div>
  );
}
