import type { PropsWithChildren } from "react";

interface H5NumberedBoxProps extends PropsWithChildren {
  className?: string;
}

export function H5NumberedBox({ className = "", children }: H5NumberedBoxProps) {
  return (
    <div data-h5-numbered-box className={`h5-numbered ${className}`.trim()}>
      {children}
    </div>
  );
}
