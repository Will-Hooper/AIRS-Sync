import { DependencyList, RefObject, useLayoutEffect } from "react";

function formatBoxNumber(value: number) {
  return value.toString().padStart(2, "0");
}

export function useNumberedBoxes(scopeRef: RefObject<HTMLElement | null>, deps: DependencyList = []) {
  useLayoutEffect(() => {
    const scope = scopeRef.current;
    if (!scope) return;

    const boxes = Array.from(scope.querySelectorAll<HTMLElement>("[data-numbered-box]"));
    boxes.forEach((element, index) => {
      element.dataset.boxNumber = formatBoxNumber(index + 1);
    });
  }, deps);
}
