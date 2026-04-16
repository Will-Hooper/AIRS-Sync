import { getMascotBandCopy, getMascotScoreBand } from "../share-mascot-score-map";

describe("share mascot score map", () => {
  test.each([
    [95, "secure", "稳稳拿捏"],
    [72, "steady", "还能控场"],
    [52, "watchful", "得提着一口气"],
    [31, "strained", "被系统追着跑"],
    [12, "critical", "系统压脸了"]
  ])("maps %s into the expected AIRS mascot band", (score, key, badge) => {
    const band = getMascotScoreBand(score);
    expect(band.key).toBe(key);
    expect(getMascotBandCopy(score, "zh").badge).toBe(badge);
  });

  test("keeps the direction correct: higher scores are more stable than lower scores", () => {
    const high = getMascotBandCopy(90, "zh");
    const low = getMascotBandCopy(10, "zh");

    expect(high.rangeLabel).toContain("高稳定");
    expect(low.rangeLabel).toContain("高压预警");
    expect(high.riskHint).toContain("更稳定");
    expect(low.riskHint).toContain("高压");
  });
});
