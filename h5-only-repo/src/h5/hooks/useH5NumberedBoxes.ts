import { DependencyList, RefObject, useLayoutEffect } from "react";

function formatBoxNumber(value: number) {
  return value.toString().padStart(2, "0");
}

export function useH5NumberedBoxes(scopeRef: RefObject<HTMLElement | null>, deps: DependencyList = []) {
  useLayoutEffect(() => {
    const scope = scopeRef.current;
    if (!scope) return;

    const boxes = Array.from(scope.querySelectorAll<HTMLElement>("[data-h5-numbered-box]"));
    boxes.forEach((element, index) => {
      element.dataset.boxNumber = formatBoxNumber(index + 1);
    });
  }, deps);
}
