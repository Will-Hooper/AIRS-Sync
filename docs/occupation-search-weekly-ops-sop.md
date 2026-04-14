# AIRS 中国职业搜索覆盖层 P0.5 每周运营 SOP

## 适用范围

本 SOP 只适用于当前 P0.5 阶段：

- 不改搜索架构。
- 不新增独立搜索服务。
- 不进入 P1 扩库。
- 不重做 analytics。
- 不重做桌面端 / H5 搜索交互。

当前每周运营的目标只有三件事：

1. 用现有日志和反馈判断本周最该补的 alias。
2. 用现有测试和 warning 判断是否会引入回归。
3. 把本周处理结果固化为可复用周报。

## 每周节奏

- 固定每周执行 `1` 次。
- 默认看最近 `7` 天。
- 如果最近 `7` 天总搜索量偏低，或者 Top 词大量只有 `1` 次，改看最近 `14` 天。

建议直接用这两个判断切换到 14 天：

- 最近 7 天总搜索量 `< 100`
- Top 50 搜索词里大部分只有 `1` 次

## 每周先看哪些入口

每周开始前，先刷新并查看这四类输入：

1. 搜索质量报表
   文件：[latest-search-quality.json](/E:/Codex/services/analytics/reports/latest-search-quality.json)
   命令：`npm run analytics:search-quality`
2. feedback 数据
   来源：[OccupationSearchFeedback.tsx](/E:/Codex/frontend/src/shared/OccupationSearchFeedback.tsx)
   数据文件：`services/analytics/data/search-feedback.ndjson`
3. seed warning
   命令：`npm run search:check-seeds`
4. 搜索回归结果
   命令：`npm run test:search`

## 每周必看指标

每周必须看完这几项后再决定是否补词：

- 搜索总次数
- 首次命中率
- 零结果率
- Top 50 搜索词
- Top 50 零结果词
- Top 50 有结果但未点击词
- Top 50 反馈词
- `matchType` 分布
- `deviceType` 分布

## 固定执行顺序

每周按下面固定顺序执行，不跳步：

1. 生成报表
   先运行 `npm run analytics:search-quality`，刷新累计口径报表。
2. 看 Top 零结果词
   先判断哪些词本周根本没被覆盖。
3. 看 Top 未点击词
   判断哪些词“搜到了但主结果或候选不自然”。
4. 看反馈词
   判断真实用户正在怎么称呼职业。
5. 看 seed warning
   用 `npm run search:check-seeds` 看本周是否有新增冲突或已有高优先 warning。
6. 判断补 alias
   优先处理高频零结果、高频反馈和高频口语词。
7. 判断调 weight
   只有在“已命中但主结果不稳定”时才调。
8. 判断调 alternatives 排序
   只有在“主结果可接受，但候选顺序不自然”时才调。
9. 判断暂不处理项
   低频词、噪音词、非职业词、长整句先留在周报里，不进词库。
10. 修改词库
   只改现有 seed / alias / weight / fallback 顺序，不进入 P1 扩库。
11. 跑测试与校验
   至少跑：
   `npm run test:search`
   `npm run search:check-seeds`
   `npm run analytics:search-quality`
12. 输出周报
   用 [occupation-search-weekly-report-template.md](/E:/Codex/docs/occupation-search-weekly-report-template.md) 填本周结果。

## 本周判断口径

### 先补 alias 的场景

- 高频零结果词。
- 高频 feedback 词。
- 高频口语词。
- 高频招聘站词。
- 高频但只落到 `no_result` / `category_fallback` 的词。

### 先调 weight 的场景

- 已经命中，但主结果不稳定。
- 同一 normalized alias 在多个 occupation 之间摇摆。
- exact_alias 命中了，但第一结果不符合普通中国用户直觉。

### 只调 alternatives 的场景

- 主结果已经可接受。
- 候选列表里缺明显相邻职业。
- 候选顺序不自然，影响用户二次选择。

### 暂不处理的场景

- 最近 7/14 天只出现 1 次的低频词。
- 太长的任务句。
- 噪音输入。
- 明显非职业查询。
- 语义过于模糊、暂时无法稳定映射现有 occupation 的词。

## 本周执行边界

本周运营可以做：

- 补 alias
- 调 alias weight
- 调 fallback / alternatives 顺序
- 清理高优先 warning
- 更新周报

本周运营明确不做：

- 新建搜索服务
- 改 `occupation-search.ts` 六层匹配主链路
- 改 AIRS occupation / template / SOC 主结构
- 新增大批中国职业入口
- 进入 P1 扩库

## 当前项目内的固定入口

- 搜索核心：[occupation-search.ts](/E:/Codex/frontend/src/lib/occupation-search.ts)
- 样本集：[occupation-search-test-cases.ts](/E:/Codex/frontend/src/lib/occupation-search-test-cases.ts)
- 回归测试：[occupation-search.spec.ts](/E:/Codex/frontend/src/lib/__tests__/occupation-search.spec.ts)
- 词库维护规范：[occupation-search-maintenance.md](/E:/Codex/frontend/src/lib/occupation-search-maintenance.md)
- 周报模板：[occupation-search-weekly-report-template.md](/E:/Codex/docs/occupation-search-weekly-report-template.md)
- 周报整理说明：[occupation-search-weekly-summary-howto.md](/E:/Codex/docs/occupation-search-weekly-summary-howto.md)
