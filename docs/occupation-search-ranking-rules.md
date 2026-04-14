# AIRS 中国职业搜索排序调整规则

## 当前阶段的排序边界

当前搜索主链路已经固定：

`exact_alias -> prefix_alias -> contains_alias -> fuzzy_alias -> category_fallback -> no_result`

P0.5 阶段不改这条主链路，只定义什么时候补 alias、什么时候调 weight、什么时候调 alternatives。

## 固定判断顺序

所有排序相关问题，都按这个顺序判断：

1. 缺 alias 时，先补 alias，不调排序。
2. 已命中但主结果不稳定时，先调 alias weight，不改主逻辑。
3. 主结果可接受但候选顺序不自然时，只调 alternatives 排序。
4. 词频太低、意图不清、影响小的，先不处理。
5. 只有当某类词持续高频出现、靠 alias 和排序仍无法自然表达时，才标记为“新增 occupation 入口候选”。

当前阶段只标记候选，不进入 P1 扩库。

## 什么时候先补 alias

出现下面这些情况，不要先动排序：

- 查询词根本没命中
- 查询词只能靠 fuzzy 才勉强命中
- 查询词长期停留在 category fallback
- feedback 里持续出现用户真实叫法，但词库没有

因为问题根源不在排序，而在入口覆盖层不够。

## 什么时候先调 weight

只有当下面这些情况成立时，才优先调 weight：

- 已经 exact / prefix / contains 命中
- 主结果落在错误 occupation，或者和用户直觉明显不符
- 同一个 normalized alias 在多个 occupation 之间冲突

当前项目里，这类问题优先检查：

- 高频 exact_alias 冲突
- `cross-occupation-alias` warning
- 主结果和 feedback 意图明显不一致

调 weight 时，优先修改结构化 alias 的 `weight`，不要先去改搜索主逻辑。

## 什么时候只调 alternatives 排序

以下情况只调 alternatives，不动主结果：

- 主结果已经可接受
- 用户第二选择通常是固定几类相邻职业
- 当前 alternatives 顺序不自然
- 当前 alternatives 被自动数据中的长标题污染

当前项目里，可以通过这些位置调整：

- [occupation-search-seeds.ts](/E:/Codex/frontend/src/lib/occupation-search-seeds.ts) 里的 `searchPriority`
- `CATEGORY_FALLBACKS` 的 `entryIds` 顺序
- [occupation-search.ts](/E:/Codex/frontend/src/lib/occupation-search.ts) 里已存在的 curated alternatives 顺序

## 什么时候先不处理

以下情况先不处理：

- 近 7/14 天只出现一次
- 词义过于模糊
- 当前主结果虽然不完美，但用户仍能找到可接受职业
- 调整会影响多个高频 occupation，风险大于收益

先不处理，不代表永远不处理。要把这类词记录到周报里的“暂不处理项”。

## 什么时候记录为“新增 occupation 入口候选”

只有同时满足下面条件，才记录候选：

- 某类词连续多周高频出现
- 已补 alias
- 已调 weight
- 已调 alternatives
- 仍然无法自然表达用户意图

这时只在周报里记录：

- 查询词
- 当前最接近的 occupation
- 为什么现有 occupation 承接不自然
- 建议后续是否需要新增 occupation 入口

当前阶段只记录候选，不做实现。

## 当前阶段明确不做

- 不调整搜索架构
- 不改成独立 `/api/search/*`
- 不引入复杂 NLP
- 不重做 analytics
- 不进入 P1 中国职业扩库
