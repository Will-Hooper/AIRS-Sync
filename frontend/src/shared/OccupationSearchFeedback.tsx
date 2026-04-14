import { useState } from "react";
import { trackSearchFeedback, type SearchEventSource } from "../lib/analytics";
import type { OccupationSearchMatchType } from "../lib/types";

interface OccupationSearchFeedbackProps {
  source: SearchEventSource;
  language: string;
  query: string;
  matchType?: OccupationSearchMatchType;
  resultCount?: number;
  variant?: "desktop" | "mobile";
}

export function OccupationSearchFeedback({
  source,
  language,
  query,
  matchType,
  resultCount,
  variant = "desktop"
}: OccupationSearchFeedbackProps) {
  const [feedbackText, setFeedbackText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isZh = language === "zh";
  const wrapperClassName = variant === "mobile"
    ? "border-t border-white/8 px-4 py-4"
    : "border-t border-white/8 px-4 py-4";
  const inputClassName = variant === "mobile"
    ? "w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/20"
    : "w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/20";
  const buttonClassName = variant === "mobile"
    ? "rounded-2xl border border-white/12 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-50"
    : "rounded-2xl border border-white/12 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-50";

  const submitFeedback = async () => {
    if (!feedbackText.trim() || submitting) return;
    setSubmitting(true);
    await trackSearchFeedback({
      query,
      feedbackText,
      source,
      language,
      matchType,
      resultCount
    });
    setFeedbackText("");
    setSubmitted(true);
    setSubmitting(false);
  };

  return (
    <div className={wrapperClassName}>
      <p className="text-xs font-medium text-white/82">
        {isZh ? "没找到你的职业？告诉我们你怎么称呼这份工作" : "Didn't find the right role? Tell us what you call this job."}
      </p>
      <p className="mt-1 text-xs leading-6 text-white/45">
        {isZh ? `你刚刚搜索的是“${query}”。我们会用这些反馈补充中文职业入口词。` : `You searched for "${query}". We use this feedback to improve search coverage.`}
      </p>
      <div className="mt-3 flex flex-col gap-3">
        <input
          value={feedbackText}
          onChange={(event) => setFeedbackText(event.target.value)}
          className={inputClassName}
          placeholder={isZh ? "例如：仓库发货、店播中控、直播投流" : "Example: warehouse shipping, store livestream control"}
        />
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            className={buttonClassName}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => void submitFeedback()}
            disabled={!feedbackText.trim() || submitting}
          >
            {submitted
              ? (isZh ? "已提交" : "Sent")
              : submitting
                ? (isZh ? "提交中..." : "Sending...")
                : (isZh ? "提交职业叫法" : "Send feedback")}
          </button>
          {submitted && (
            <span className="text-xs text-emerald-300/85">
              {isZh ? "已记录，后续会用于补词。" : "Saved for future search coverage updates."}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
