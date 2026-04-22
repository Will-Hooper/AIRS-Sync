import dataset from "../../../../backend/data/airs_data.json";
import {
  OCCUPATION_SEARCH_TEST_CASES,
  OCCUPATION_SEARCH_TEST_CASE_GROUPS,
  TOTAL_OCCUPATION_SEARCH_TEST_CASES
} from "../occupation-search-test-cases";
import { normalizeOccupationQuery, searchOccupationsByQuery } from "../occupation-search";
import type { JsonDataset, OccupationRow, OccupationSearchPayload } from "../types";

const rows = (dataset as JsonDataset).occupations as unknown as OccupationRow[];

function search(query: string) {
  return searchOccupationsByQuery(rows, query);
}

function alternativeLabels(payload: OccupationSearchPayload) {
  return payload.alternatives.map((item) => item.label);
}

describe("occupation search corpus", () => {
  test("ships a fixed Chinese validation corpus with at least 120 cases", () => {
    expect(OCCUPATION_SEARCH_TEST_CASE_GROUPS).toHaveLength(4);
    expect(TOTAL_OCCUPATION_SEARCH_TEST_CASES).toBeGreaterThanOrEqual(120);
  });

  test("organizes the corpus into the four requested categories", () => {
    expect(OCCUPATION_SEARCH_TEST_CASE_GROUPS.map((group) => group.category)).toEqual(["A", "B", "C", "D"]);
    expect(OCCUPATION_SEARCH_TEST_CASE_GROUPS.every((group) => group.cases.length >= 20)).toBe(true);
  });
});

describe("normalizeOccupationQuery", () => {
  test.each([
    ["  ＨＲ   ", "hr"],
    ["做人事的", "人事"],
    ["电商运营专员", "电商运营"],
    ["跑外卖的", "跑外卖"],
    ["做表格的", "表格"],
    ["做直播带货的", "直播带货"]
  ])("normalizes %s to %s", (raw, expected) => {
    expect(normalizeOccupationQuery(raw)).toBe(expected);
  });
});

describe("search pipeline match types", () => {
  test("hits exact_alias for direct aliases", () => {
    expect(search("文员").matchType).toBe("exact_alias");
  });

  test("hits prefix_alias for shorter prefixes", () => {
    expect(search("新媒体").matchType).toBe("prefix_alias");
  });

  test("hits contains_alias for related containing expressions", () => {
    expect(search("设计").matchType).toBe("contains_alias");
  });

  test("hits fuzzy_alias for typo or near-match queries", () => {
    expect(search("视屏剪辑").matchType).toBe("fuzzy_alias");
    expect(search("开滴滴").matchType).toBe("fuzzy_alias");
  });

  test("hits category_fallback for generic categories", () => {
    expect(search("文职").matchType).toBe("category_fallback");
  });

  test("hits no_result when nothing reasonable can be mapped", () => {
    const payload = search("塔罗占卜");
    expect(payload.matchType).toBe("no_result");
    expect(payload.primaryResult).toBeNull();
  });
});

describe("primary result regression", () => {
  test.each([
    ["文员", "行政文员"],
    ["人事", "人力资源专员"],
    ["会计", "会计"],
    ["客服", "客服专员"],
    ["电商运营", "电商运营"],
    ["新媒体", "新媒体运营"],
    ["剪辑", "视频剪辑"],
    ["外卖员", "配送员"],
    ["滴滴司机", "网约车司机"],
    ["程序员", "软件开发工程师"],
    ["艺人经纪人", "艺人经纪人"],
    ["明星经纪人", "艺人经纪人"],
    ["演员经纪人", "艺人经纪人"],
    ["娱乐经纪人", "艺人经纪人"],
    ["演艺经纪人", "艺人经纪人"],
    ["教师", "老师"],
    ["护士", "护士"]
  ])("returns %s -> %s", (query, expectedLabel) => {
    expect(search(query).primaryResult?.label).toBe(expectedLabel);
  });
});

describe("entertainment agent convergence regression", () => {
  test("maps artist-manager aliases onto the talent agent entry", () => {
    const payload = search("艺人经纪人");
    expect(payload.primaryResult?.occupation.socCode).toBe("13-1011.00");
    expect(payload.primaryResult?.label).toBe("艺人经纪人");
  });

  test("does not let the bare 经纪人 query over-expand into entertainment aliases", () => {
    const payload = search("经纪人");
    expect(payload.matchType).toBe("no_result");
    expect(payload.primaryResult).toBeNull();
  });
});

describe("alternative recommendation regression", () => {
  test.each([
    ["做抖音的", ["电商运营", "新媒体运营"]],
    ["招人的", ["行政文员", "前台接待"]],
    ["做表格的", ["人力资源专员", "前台接待"]],
    ["设计", ["平面设计师", "交互设计师"]],
    ["销售", ["电话销售", "门店销售"]],
    ["司机", ["货车司机", "配送司机"]],
    ["工厂", ["仓库管理员", "货车司机"]]
  ])("returns sensible alternatives for %s", (query, expectedLabels) => {
    expect(alternativeLabels(search(query))).toEqual(expect.arrayContaining(expectedLabels));
  });
});

describe("conflict convergence primary regression", () => {
  test.each([
    ["律师", "律师"],
    ["法务", "法务专员"],
    ["法律顾问", "法律顾问"],
    ["律师助理", "法务专员"],
    ["法律助理", "法务专员"],
    ["医生", "医生"],
    ["医师", "医生"],
    ["中医师", "中医师"],
    ["大夫", "医生"],
    ["临床医生", "医生"],
    ["警察", "警察"],
    ["辅警", "辅警"],
    ["司法警察", "司法警察"],
    ["民警", "警察"],
    ["公安", "警察"],
    ["会计", "会计"],
    ["审计", "审计"],
    ["成本会计", "成本会计"],
    ["财务经理", "财务经理"],
    ["前台", "前台接待"],
    ["酒店前台", "酒店前台"],
    ["前台接待", "前台接待"],
    ["行政前台", "前台接待"],
    ["设计", "UI设计师"],
    ["UI设计师", "UI设计师"],
    ["建筑设计师", "建筑设计师"],
    ["交互设计师", "交互设计师"],
    ["动画设计师", "动画设计师"],
    ["司机", "网约车司机"],
    ["网约车司机", "网约车司机"],
    ["出租车司机", "出租车司机"],
    ["公交车司机", "公交车司机"],
    ["叉车司机", "叉车司机"],
    ["程序员", "软件开发工程师"],
    ["软件工程师", "软件开发工程师"],
    ["软件开发工程师", "软件开发工程师"],
    ["开发工程师", "软件开发工程师"]
  ])("keeps %s -> %s", (query, expectedLabel) => {
    expect(search(query).primaryResult?.label).toBe(expectedLabel);
  });
});

describe("conflict convergence alternatives regression", () => {
  test.each([
    ["律师", ["法律顾问", "法务专员"]],
    ["法务", ["律师", "法律顾问"]],
    ["医生", ["中医师", "口腔医生"]],
    ["警察", ["辅警", "司法警察"]],
    ["会计", ["成本会计", "审计"]],
    ["酒店前台", ["大堂经理", "前台接待"]],
    ["前台", ["酒店前台", "行政文员"]],
    ["设计", ["交互设计师", "平面设计师"]],
    ["司机", ["出租车司机", "货车司机"]],
    ["软件工程师", ["前端开发", "后端开发"]]
  ])("keeps related alternatives for %s", (query, expectedLabels) => {
    expect(alternativeLabels(search(query))).toEqual(expect.arrayContaining(expectedLabels));
  });
});

describe("batch regression corpus", () => {
  test.each(OCCUPATION_SEARCH_TEST_CASES)("$query", (testCase) => {
    const payload = search(testCase.query);

    if (testCase.expectedNormalizedQuery) {
      expect(payload.queryNormalized).toBe(testCase.expectedNormalizedQuery);
    }

    expect(testCase.expectedMatchTypes).toContain(payload.matchType);

    if (testCase.expectedPrimaryOccupation === null) {
      expect(payload.primaryResult).toBeNull();
    } else {
      expect(payload.primaryResult?.label).toBe(testCase.expectedPrimaryOccupation);
    }

    if (testCase.expectedAlternativeIncludes?.length) {
      expect(alternativeLabels(payload)).toEqual(expect.arrayContaining(testCase.expectedAlternativeIncludes));
    }
  });
});
