import { useEffect, useMemo, useRef, useState } from "react";
import type { AppTheme } from "../../shared/theme";
import { getMoatThemeTokens, getMoatTypeColor, withAlpha } from "../../lib/moat-color";
import {
  getMoatTypeLabel,
  getOccupationMoatDisplayName,
  searchMoatNodes,
  type MoatLanguage,
  type MoatSearchMatch,
  type OccupationMoatNode
} from "../../lib/moat";

export interface MoatSearchSelection extends MoatSearchMatch {}

interface MoatSearchFieldProps {
  language: MoatLanguage;
  theme: AppTheme;
  nodes: OccupationMoatNode[];
  value: string;
  placeholder: string;
  noResultText: string;
  compact?: boolean;
  onQueryChange: (value: string) => void;
  onSelect: (selection: MoatSearchSelection) => void;
  onNoResultChange?: (value: string | null) => void;
}

export function MoatSearchField({
  language,
  theme,
  nodes,
  value,
  placeholder,
  noResultText,
  compact = false,
  onQueryChange,
  onSelect,
  onNoResultChange
}: MoatSearchFieldProps) {
  const tokens = getMoatThemeTokens(theme);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const hasQuery = Boolean(value.trim());

  const payload = useMemo(() => searchMoatNodes(nodes, value), [nodes, value]);
  const suggestions = hasQuery ? payload.suggestions.slice(0, 6) : [];
  const showNoResult = hasQuery && suggestions.length === 0;
  const dropdownVisible = isOpen && hasQuery && (showNoResult || suggestions.length > 0);

  useEffect(() => {
    setActiveIndex(0);
  }, [payload.queryNormalized, payload.resultCount]);

  useEffect(() => {
    onNoResultChange?.(showNoResult ? noResultText : null);
  }, [noResultText, onNoResultChange, showNoResult]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      setIsOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    return () => document.removeEventListener("pointerdown", handlePointerDown, true);
  }, []);

  const commitSelection = (selection: MoatSearchSelection | null) => {
    if (!selection) return;
    onSelect(selection);
    setIsOpen(false);
  };

  const activeSuggestion = suggestions[Math.min(activeIndex, Math.max(suggestions.length - 1, 0))] || payload.primaryResult;

  return (
    <div ref={rootRef} className={`relative z-40 ${compact ? "w-full" : ""}`.trim()}>
      <div
        className="flex items-center gap-3 rounded-[20px] border px-4 py-3 shadow-lg backdrop-blur-xl"
        style={{
          borderColor: tokens.border,
          background: tokens.surfaceStrong,
          boxShadow: theme === "dark" ? "0 18px 48px rgba(2, 8, 15, 0.22)" : "0 16px 40px rgba(52, 72, 98, 0.12)"
        }}
      >
        <span className="inline-flex h-5 w-5 items-center justify-center" style={{ color: tokens.textSecondary }}>
          <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
            <circle cx="8.5" cy="8.5" r="5.25" stroke="currentColor" strokeWidth="1.6" />
            <path d="M12.7 12.7L16.25 16.25" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </span>

        <input
          ref={inputRef}
          type="text"
          value={value}
          autoComplete="off"
          spellCheck={false}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-inherit"
          style={{ color: tokens.textPrimary }}
          onFocus={() => setIsOpen(true)}
          onChange={(event) => {
            onQueryChange(event.target.value);
            setIsOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setIsOpen(true);
              setActiveIndex((current) => (suggestions.length ? (current + 1) % suggestions.length : 0));
              return;
            }

            if (event.key === "ArrowUp") {
              event.preventDefault();
              setIsOpen(true);
              setActiveIndex((current) => (suggestions.length ? (current - 1 + suggestions.length) % suggestions.length : 0));
              return;
            }

            if (event.key === "Enter") {
              if (!hasQuery) return;
              event.preventDefault();
              commitSelection(activeSuggestion || null);
              return;
            }

            if (event.key === "Escape") {
              setIsOpen(false);
            }
          }}
        />

        {value ? (
          <button
            type="button"
            aria-label={language === "zh" ? "清除搜索" : "Clear search"}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-sm"
            style={{
              color: tokens.textSecondary,
              background: tokens.surfaceAlt
            }}
            onClick={() => {
              onQueryChange("");
              setIsOpen(false);
              inputRef.current?.focus();
            }}
          >
            ×
          </button>
        ) : null}
      </div>

      {dropdownVisible ? (
        <div
          className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-[1400] overflow-hidden rounded-[22px] border shadow-2xl backdrop-blur-xl"
          style={{
            borderColor: tokens.borderStrong,
            background: tokens.surfaceStrong
          }}
        >
          {showNoResult ? (
            <div className="px-4 py-3 text-sm leading-6" style={{ color: tokens.textSecondary }}>
              {noResultText}
            </div>
          ) : (
            <div className="max-h-[320px] overflow-y-auto py-2">
              {suggestions.map((suggestion, index) => {
                const accent = getMoatTypeColor(suggestion.node.dominantMoatType, theme);
                const displayName = getOccupationMoatDisplayName(suggestion.node, language);
                const matchedAlias = suggestion.matchedAlias?.trim();
                const showAlias = Boolean(
                  matchedAlias
                  && matchedAlias !== displayName
                  && matchedAlias !== suggestion.label
                );

                return (
                  <button
                    key={`${suggestion.node.occupationId}-${suggestion.label}`}
                    type="button"
                    className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition-colors"
                    style={{
                      background: index === activeIndex ? withAlpha(accent, theme === "dark" ? 0.16 : 0.1) : "transparent",
                      color: tokens.textPrimary
                    }}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => commitSelection(suggestion)}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{displayName}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs" style={{ color: tokens.textSecondary }}>
                        <span>{language === "zh" ? suggestion.node.majorGroupCn : suggestion.node.majorGroup}</span>
                        <span aria-hidden="true">·</span>
                        <span>{getMoatTypeLabel(suggestion.node.dominantMoatType, language, "short")}</span>
                      </div>
                      {showAlias ? (
                        <p className="mt-1 truncate text-xs" style={{ color: tokens.textSecondary }}>
                          {language === "zh" ? `匹配词：${matchedAlias}` : `Matched alias: ${matchedAlias}`}
                        </p>
                      ) : null}
                    </div>

                    <span
                      className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                      style={{
                        color: theme === "dark" ? "#f8fbff" : "#ffffff",
                        background: accent
                      }}
                    >
                      {getMoatTypeLabel(suggestion.node.dominantMoatType, language, "short")}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
