import type { ReactNode } from "react";

interface CircularToggleButtonProps {
  title: string;
  ariaPressed: boolean;
  onClick: () => void;
  size?: "desktop" | "mobile";
  children: ReactNode;
}

const BUTTON_STYLE = {
  background: "linear-gradient(180deg, rgba(252, 253, 255, 0.98) 0%, rgba(239, 244, 252, 0.95) 100%)",
  boxShadow: "0 14px 34px rgba(150, 185, 241, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.86)",
  color: "#2e3848"
};

const OUTER_RING_STYLE = {
  borderColor: "rgba(167, 198, 255, 0.92)"
};

const INNER_RING_STYLE = {
  borderColor: "rgba(224, 235, 255, 0.96)"
};

export function CircularToggleButton({
  title,
  ariaPressed,
  onClick,
  size = "desktop",
  children
}: CircularToggleButtonProps) {
  const sizeClassName = size === "mobile" ? "h-[3.1rem] w-[3.1rem]" : "h-[3.45rem] w-[3.45rem]";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={title}
      aria-pressed={ariaPressed}
      title={title}
      className={`group relative inline-flex ${sizeClassName} shrink-0 items-center justify-center rounded-full outline-none transition duration-200 hover:-translate-y-[1px] hover:shadow-[0_18px_40px_rgba(150,185,241,0.24)] active:translate-y-0 active:scale-[0.985] focus-visible:ring-2 focus-visible:ring-[#cfe1ff] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent`}
      style={BUTTON_STYLE}
    >
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-full border" style={OUTER_RING_STYLE} />
      <span aria-hidden="true" className="pointer-events-none absolute inset-[4px] rounded-full border" style={INNER_RING_STYLE} />
      <span className="relative z-10 inline-flex items-center justify-center">{children}</span>
    </button>
  );
}
