import { useNavigate } from "react-router-dom";
import { H5Footer } from "../components/H5Footer";
import { getH5Copy } from "../lib/copy";
import { getInitialH5Language, normalizeH5Language } from "../lib/language";

export function MobileNotFoundPage() {
  const navigate = useNavigate();
  const language = normalizeH5Language(getInitialH5Language(window.location.search));
  const copy = getH5Copy(language);

  return (
    <div className="h5-shell">
      <div className="h5-page">
        <div className="h5-panel flex min-h-[70vh] flex-col items-center justify-center gap-6 px-6 text-center">
          <p className="h5-kicker">{copy.moduleKicker}</p>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-white">{copy.notFoundTitle}</h1>
          <p className="max-w-[30ch] text-sm leading-7 text-white/55">{copy.notFoundText}</p>
          <button type="button" className="h5-button-primary" onClick={() => navigate("/")}>
            {copy.returnHome}
          </button>
        </div>
        <H5Footer language={language} />
      </div>
    </div>
  );
}
