# AIRS 中国职业搜索 seed warning 清理优先级规则

## 规则总原则

`npm run search:check-seeds` 的 warning 不是为了“一次清零”，而是为了识别：

- 哪些 warning 已经影响真实流量
- 哪些 warning 会让本周补词判断失真
- 哪些 warning 只是结构层面的历史残留

当前阶段不追求 warning 全部清零，只先清真实流量影响最大的 warning。

## P1 warning

P1 是本周优先人工判断和清理的 warning：

- 高频搜索词跨 occupation 冲突
- 导致主结果明显错误的 alias 冲突
- 导致 exact_alias 命中混乱的冲突
- 高频反馈涉及的冲突词

P1 的判断标准不是“warning 看起来严重”，而是：

- 本周 Top 搜索词里已经出现
- 本周 Top 零结果 / 未点击 / feedback 已经出现
- 已经影响主结果或 exact_alias 的稳定性

当前项目里，优先人工判断的典型样例就是：

- `会计`
- `发货`

这两类词都属于“高频真实表达，而且天然容易跨 occupation 冲突”的典型样例。

## P2 warning

P2 是应该逐步清理，但不一定本周马上处理的 warning：

- 高频 occupation 内部归一重复
- 高流量职业 alias 结构混乱
- 会影响 weight 判断但未造成明显错误的冲突

这类 warning 当前常见于：

- 同一个 occupation 内既有标准名，又有同义口语变体，normalize 后重复
- 同一个 occupation 里既有字符串 alias，又有结构化 alias，但没有清晰 weight 层级

P2 的目标是让后续补词不越来越乱，而不是立即改变搜索结果。

## P3 warning

P3 是低优先级维护项：

- 低频重复
- 历史残留低影响冲突
- 不影响主结果的轻度问题

这类 warning 可以继续保留在 `search:check-seeds` 输出里，不要求本周处理。

## 当前阶段的清理顺序

每周按这个顺序看 warning：

1. 先看 `cross-occupation-alias`
   这类最容易影响高频 exact_alias 和主结果。
2. 再看高流量 occupation 的 `duplicate-alias`
   重点看文职、运营、物流、司机、教育医疗这几类。
3. 最后看低频重复和历史残留
   这类只记录，不强制本周处理。

## 什么时候必须优先处理 warning

满足任意一条，就本周优先处理：

- 主结果已经明显错
- exact_alias 命中被打乱
- 用户 feedback 已经反复提到同一词
- 高流量词的未点击率明显升高
- 本周新增 alias 后，warning 直接扩大

## 什么时候可以先不处理 warning

以下情况可以先留在周报：

- 只在低频词上出现
- 没影响主结果
- 没影响 exact_alias 稳定性
- 只是 occupation 内部重复，且当前构建时已去重

## 当前项目里的典型样例

### `会计`

`会计` 属于优先人工判断样例，因为：

- 搜索频率高
- 用户直觉很稳定
- 容易和 `会计员`、`出纳` 形成跨 occupation 冲突

处理顺序：

1. 先看近 7/14 天 `会计`、`会计员`、`财务文员` 的真实搜索和点击。
2. 再决定是补 alias、调 weight，还是保留现状。

### `发货`

`发货` 也属于优先人工判断样例，因为：

- 既可能落 `物流专员`
- 也可能落 `仓库管理员`
- 语义上同时包含“物流文职”和“仓储执行”

处理顺序：

1. 先看 `发货专员`、`发货的`、`管发货` 的真实流量和 feedback。
2. 如果多数用户在找执行岗，就优先仓储。
3. 如果多数用户在找物流文职，再考虑调 weight。

## 当前阶段明确不做

- 不为了清 warning 去改搜索架构
- 不为了清 warning 去新增 occupation 入口
- 不为了清 warning 进入 P1 扩库
- 不追求 warning 一次性归零
