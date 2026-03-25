import { useNavigate } from "react-router-dom";
import { messages } from "../lib/i18n";

export function NotFoundPage() {
  const navigate = useNavigate();
  const copy = messages.zh;

  return (
    <div className="airs-shell">
      <div className="airs-page">
        <div className="airs-panel flex min-h-[70vh] flex-col items-center justify-center gap-6 px-6 text-center">
          <p className="airs-kicker">{copy.appName}</p>
          <h1 className="airs-title-lg max-w-3xl">{copy.notFoundTitle}</h1>
          <p className="max-w-2xl text-base leading-8 text-white/55">{copy.notFoundText}</p>
          <button type="button" className="airs-button-primary" onClick={() => navigate("/")}>
            {copy.returnHome}
          </button>
        </div>
      </div>
    </div>
  );
}
