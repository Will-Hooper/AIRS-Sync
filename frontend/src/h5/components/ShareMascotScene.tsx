import type { H5Language } from "../lib/language";
import { buildMascotSceneLabel, renderMascotSceneSvg } from "../share/share-mascot-renderer";

interface ShareMascotSceneProps {
  score: number;
  language: H5Language;
  width?: number;
  height?: number;
  className?: string;
}

export function ShareMascotScene({
  score,
  language,
  width,
  height,
  className = ""
}: ShareMascotSceneProps) {
  const scene = renderMascotSceneSvg({ score, language, width, height });
  const label = buildMascotSceneLabel(score, language);

  return (
    <div
      className={className}
      aria-label={label}
      role="img"
      dangerouslySetInnerHTML={{ __html: scene }}
    />
  );
}
