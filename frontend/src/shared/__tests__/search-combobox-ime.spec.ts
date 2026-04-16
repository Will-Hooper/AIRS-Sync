import {
  SEARCH_IME_ENTER_COOLDOWN_MS,
  beginComposition,
  createSearchImeState,
  endComposition,
  hasFreshSearchPayload,
  shouldBlockSubmitOnEnter,
  shouldPropagateQueryChange
} from "../search-combobox-ime";

describe("search combobox IME helpers", () => {
  test("marks composition state transitions explicitly", () => {
    const started = beginComposition(createSearchImeState());
    expect(started.isComposing).toBe(true);

    const finished = endComposition(started, 1024);
    expect(finished.isComposing).toBe(false);
    expect(finished.lastCompositionEndAt).toBe(1024);
  });

  test("blocks Enter while composition is active or still in cooldown", () => {
    expect(shouldBlockSubmitOnEnter({
      key: "Enter",
      isComposing: true,
      nativeIsComposing: false,
      keyCode: 13,
      now: 200,
      lastCompositionEndAt: 100
    })).toBe(true);

    expect(shouldBlockSubmitOnEnter({
      key: "Enter",
      isComposing: false,
      nativeIsComposing: true,
      keyCode: 13,
      now: 200,
      lastCompositionEndAt: 100
    })).toBe(true);

    expect(shouldBlockSubmitOnEnter({
      key: "Enter",
      isComposing: false,
      nativeIsComposing: false,
      keyCode: 229,
      now: 200,
      lastCompositionEndAt: 100
    })).toBe(true);

    expect(shouldBlockSubmitOnEnter({
      key: "Enter",
      isComposing: false,
      nativeIsComposing: false,
      keyCode: 13,
      now: 200,
      lastCompositionEndAt: 200 - SEARCH_IME_ENTER_COOLDOWN_MS + 1
    })).toBe(true);
  });

  test("allows Enter after composition cooldown has passed", () => {
    expect(shouldBlockSubmitOnEnter({
      key: "Enter",
      isComposing: false,
      nativeIsComposing: false,
      keyCode: 13,
      now: 400,
      lastCompositionEndAt: 400 - SEARCH_IME_ENTER_COOLDOWN_MS - 1
    })).toBe(false);
  });

  test("only propagates intermediate query changes when not composing", () => {
    expect(shouldPropagateQueryChange(true)).toBe(false);
    expect(shouldPropagateQueryChange(false)).toBe(true);
  });

  test("checks whether cached search payload still matches the current query", () => {
    expect(hasFreshSearchPayload("程序员", { queryRaw: "程序员" } as never)).toBe(true);
    expect(hasFreshSearchPayload("程序员", { queryRaw: "程序" } as never)).toBe(false);
    expect(hasFreshSearchPayload("程序员", null)).toBe(false);
  });
});
