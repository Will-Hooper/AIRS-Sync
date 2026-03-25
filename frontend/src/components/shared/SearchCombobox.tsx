import { useEffect, useState } from "react";
import { getOccupations } from "../../lib/api";
import type { AppLanguage } from "../../lib/i18n";
import type { OccupationRow } from "../../lib/types";

interface SearchComboboxProps {
  language: AppLanguage;
  placeholder: string;
  value?: string;
  onSelect: (occupation: OccupationRow) => void;
  className?: string;
}

export function SearchCombobox({
  language,
  placeholder,
  value = "",
  onSelect,
  className = ""
}: SearchComboboxProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<OccupationRow[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        const payload = await getOccupations({ q: query });
        setSuggestions(payload.occupations.slice(0, 6));
      } catch {
        setSuggestions([]);
      }
    }, 120);

    return () => window.clearTimeout(timer);
  }, [query]);

  const submitFirstMatch = () => {
    if (suggestions[0]) {
      onSelect(suggestions[0]);
      setOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <input
        value={query}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            submitFirstMatch();
          }
        }}
        className="airs-input"
        placeholder={placeholder}
      />
      {open && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.75rem)] z-40 overflow-hidden rounded-[24px] border border-white/10 bg-slate-950/95 shadow-2xl backdrop-blur-xl">
          {suggestions.map((occupation) => (
            <button
              key={occupation.socCode}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onSelect(occupation);
                setOpen(false);
              }}
              className="flex w-full flex-col gap-1 border-b border-white/6 px-4 py-3 text-left transition hover:bg-white/5 last:border-b-0"
            >
              <span className="text-sm font-medium text-white">
                {language === "zh" ? occupation.titleZh || occupation.title : occupation.title}
              </span>
              <span className="text-xs text-white/45">{occupation.socCode}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
