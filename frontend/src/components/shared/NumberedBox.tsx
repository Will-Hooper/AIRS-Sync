import type { PropsWithChildren } from "react";

interface NumberedBoxProps extends PropsWithChildren {
  className?: string;
}

export function NumberedBox({ className = "", children }: NumberedBoxProps) {
  return (
    <div data-numbered-box className={className}>
      {children}
    </div>
  );
}
