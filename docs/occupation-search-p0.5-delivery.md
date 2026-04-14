# AIRS 中国职业搜索覆盖层 P0.5 交付说明

## 本次目标

本次没有重做搜索架构，也没有改 AIRS 原有 occupation / template / SOC 渲染链路。

交付重点是五件事：

1. 固定中文职业搜索验收样本。
2. 自动化回归测试。
3. 词库维护规范和轻量校验。
4. 搜索日志可读统计输出。
5. 无结果反馈闭环。

## 新增 / 修改文件

### 搜索验证与回归

- [occupation-search-test-cases.ts](/E:/Codex/frontend/src/lib/occupation-search-test-cases.ts)
- [occupation-search.spec.ts](/E:/Codex/frontend/src/lib/__tests__/occupation-search.spec.ts)
- [vitest.config.ts](/E:/Codex/vitest.config.ts)
- [tsconfig.frontend.json](/E:/Codex/tsconfig.frontend.json)
- [package.json](/E:/Codex/package.json)

### 搜索层与词库维护

- [occupation-search.ts](/E:/Codex/frontend/src/lib/occupation-search.ts)
- [occupation-search-seeds.ts](/E:/Codex/frontend/src/lib/occupation-search-seeds.ts)
- [occupation-search-maintenance.md](/E:/Codex/frontend/src/lib/occupation-search-maintenance.md)
- [check-occupation-search-seeds.ts](/E:/Codex/src-node/check-occupation-search-seeds.ts)

### analytics 与补词闭环

- [analytics.ts](/E:/Codex/frontend/src/lib/analytics.ts)
- [storage.ts](/E:/Codex/services/analytics/lib/storage.ts)
- [types.ts](/E:/Codex/services/analytics/lib/types.ts)
- [search-quality-report.ts](/E:/Codex/services/analytics/lib/search-quality-report.ts)
- [search-report.ts](/E:/Codex/services/analytics/search-report.ts)
- [server.ts](/E:/Codex/services/analytics/server.ts)

### 无结果反馈 UI

- [OccupationSearchFeedback.tsx](/E:/Codex/frontend/src/shared/OccupationSearchFeedback.tsx)
- [SearchCombobox.tsx](/E:/Codex/frontend/src/components/shared/SearchCombobox.tsx)
- [H5SearchCombobox.tsx](/E:/Codex/frontend/src/h5/components/H5SearchCombobox.tsx)
- [HomePage.tsx](/E:/Codex/frontend/src/pages/HomePage.tsx)
- [OccupationPage.tsx](/E:/Codex/frontend/src/pages/OccupationPage.tsx)
- [MobileHomePage.tsx](/E:/Codex/frontend/src/h5/pages/MobileHomePage.tsx)
- [MobileOccupationPage.tsx](/E:/Codex/frontend/src/h5/pages/MobileOccupationPage.tsx)

## 样本与测试

- 中文职业搜索样本数：`144`
- 样本分组：`4` 组
- 自动化测试数：`177`
- 覆盖内容：
  - normalize 规则
  - 六层匹配链路
  - 关键高频职业主结果
  - 口语/泛词 alternatives
  - 144 条样本批量回归

本地执行方式：

- `npm run test:search`
- `npm run typecheck:frontend`
- `npm run typecheck:node`
- `npm run check:h5-boundary`

## 统计输出方式

新增最小可用的搜索质量报告：

- 命令行生成：`npm run analytics:search-quality`
- JSON 输出：`services/analytics/reports/latest-search-quality.json`
- 开发接口：`GET /api/analytics/reports/search-quality.json`

当前输出字段包括：

- 搜索总次数
- 唯一搜索词数
- 首次搜索命中率
- 零结果率
- Top 50 搜索词
- Top 50 零结果词
- Top 50 有结果但未点击词
- `matchType` 分布
- `deviceType` 分布
- 反馈条数
- Top 反馈词

同时补了 `didClickResult`，现在可以区分：

- 有结果但没点
- 真正点击进入职业页

## 反馈入口实现

无结果场景下，搜索下拉面板底部会出现轻量反馈区块：

- 文案：没找到你的职业？告诉我们你怎么称呼这份工作
- 交互：单输入框 + 提交按钮
- 记录字段：
  - 原始 query
  - normalized query
  - feedbackText
  - source
  - matchType
  - resultCount
  - deviceType
  - sessionId

服务端落到：

- `services/analytics/data/search-feedback.ndjson`

## 词库维护与校验

新增维护规范文档：

- [occupation-search-maintenance.md](/E:/Codex/frontend/src/lib/occupation-search-maintenance.md)

新增轻量校验命令：

- `npm run search:check-seeds`

当前脚本会输出：

- 空 alias
- 无效 weight
- 同 entry 内归一后重复 alias
- 跨 occupation 的同 normalized alias 冲突

当前同 normalized alias 的重复主要以 warning 形式输出，不阻断构建；这类重复会在 `occupation-search.ts` 的 alias 构建阶段被去重，但仍保留提醒，便于后续人工整理。

## Vite 大 chunk warning

当前仍存在 Vite 大 chunk warning。

本次没有处理，原因如下：

1. 本次目标是搜索质量验证、补词闭环和回归防护，不是前端拆包重构。
2. 当前 warning 没有阻塞搜索功能、回归测试、无结果反馈和 analytics 聚合。
3. 现在更需要先把“搜得到、可验证、能补词”这条链路闭环。

本 warning 当前不阻塞 P0.5 的原因：

- H5 搜索逻辑仍能正常执行。
- 搜索建议没有出现功能性错误。
- 详情页和分享页没有因为本次改动失效。

以下情况出现时，应优先处理拆包：

1. H5 首屏明显变慢。
2. 搜索建议出现输入卡顿。
3. 详情页或分享页打开延迟明显。

后续建议的优化方向：

1. 按路由拆包。
2. 按功能拆包。
3. 优先拆分 seed 大词库、分享图重逻辑、非首屏组件。
