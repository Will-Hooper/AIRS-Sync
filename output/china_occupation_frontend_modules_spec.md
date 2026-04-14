# AIRS 中国职业卡片前端模块规范

## 适用范围

- 本规范适用于首批 50 张中国职业独立卡片详情页。
- 页面路由建议：`/china-occupations/:slug`
- 首批卡片全部使用同一套模块顺序，避免按职业逐张定制。

## 页面数据依赖

前端至少需要以下字段：

- `cn_code`
- `cn_title`
- `cn_title_display`
- `en_title_recommended`
- `priority`
- `track`
- `recommended_parent_soc_code`
- `recommended_parent_airs_title`
- `search_aliases`
- `intro_short`
- `intro_long`
- `reason`
- `why_not_merged`

建议后端补充以下派生字段，减少前端拼文案：

- `relation_explainer`
- `china_context_note`
- `risk_note`
- `share_title`
- `related_occupations`
- `seo_title`
- `seo_description`

## 页面固定模块顺序

1. 顶部职业标题区
2. 职业一句话定义
3. 与 AIRS 主职业关系说明
4. 为什么单独展示
5. AIRS 风险分析承接区
6. 中国语境补充说明
7. 搜索别名区
8. 分享文案区
9. 相关推荐职业区

## 模块明细

### 1. 顶部职业标题区

- 组件 ID：`hero`
- 展示字段：`cn_title_display`、`en_title_recommended`、`priority`、`track`
- 交互：若存在推荐挂靠 AIRS 主职业，可在标题区旁显示“相关 AIRS 主职业”按钮。
- 验收：标题区在桌面端首屏完整可见，移动端不换成纯英文标题。

### 2. 职业一句话定义

- 组件 ID：`one-line-definition`
- 展示字段：`intro_short`
- 交互：无。
- 验收：定义不超过 2 行时默认展开；超过 2 行时仍默认完整展示，不做折叠。

### 3. 与 AIRS 主职业关系说明

- 组件 ID：`airs-relation`
- 展示字段：`recommended_parent_soc_code`、`recommended_parent_airs_title`
- 交互：若存在父职业，可跳转对应 AIRS 主职业页。
- 空态：无父职业时显示“当前暂无稳妥的 AIRS 主职业可直接挂靠”。
- 验收：文案必须明确“推荐挂靠不等于完整覆盖”。

### 4. 为什么单独展示

- 组件 ID：`why-independent`
- 展示字段：`reason`
- 交互：无。
- 验收：该模块必须在首屏后立即可见，不能被放到页面底部。

### 5. AIRS 风险分析承接区

- 组件 ID：`risk-handoff`
- 展示字段：`why_not_merged`
- 交互：无。
- 验收：需和“为什么单独展示”分开显示，避免两段文案混成一段。

### 6. 中国语境补充说明

- 组件 ID：`china-context`
- 展示字段：后端派生的 `china_context_note`
- 交互：无。
- 验收：文案必须明确该职业在中国语境下的独立性。

### 7. 搜索别名区

- 组件 ID：`aliases`
- 展示字段：`search_aliases`
- 交互：点击别名可触发站内搜索或页面内跳转。
- 验收：默认展示 3-6 个别名；过多时折叠，不影响首屏。

### 8. 分享文案区

- 组件 ID：`share`
- 展示字段：`share_title`
- 交互：复制链接、复制标题、系统分享。
- 验收：P0 页面必须有分享标题；P1/P2 页面可先只提供复制链接。

### 9. 相关推荐职业区

- 组件 ID：`related`
- 展示字段：`related_occupations`
- 交互：点击跳转其他中国职业卡片。
- 验收：默认展示 3 个推荐职业；优先同方向，再补同优先级。

## 页面状态规则

### 有推荐父职业

- 展示“相关 AIRS 主职业”卡片。
- 按钮文案建议：`查看相关 AIRS 主职业`

### 无推荐父职业

- 不展示空白按钮。
- 关系模块直接说明“当前暂无稳妥挂靠对象”。

### P0 页面

- 必须补齐分享标题、SEO title、SEO description。
- 搜索结果页应优先曝光。

### 移动端

- 模块顺序不变。
- 标题区标签可以换行，但中文主标题必须保持优先可见。

## 推荐埋点

- `china_card_view`
- `china_card_parent_click`
- `china_card_alias_click`
- `china_card_share_click`
- `china_card_related_click`

## 开发验收示例

- 示例页面：跨境电商运营管理师
- 示例推荐父职业：市场研究分析师与营销专员（13-1161.00）
- 示例关系说明：当前推荐挂靠 AIRS 主职业为市场研究分析师与营销专员（13-1161.00），用于帮助用户理解能力邻近关系和后续跳转；这不代表 AIRS 已完整覆盖该中国职业。
- 示例风险说明：如果直接并入AIRS“市场研究分析师与营销专员”，只能表达市场营销与流量分析的一部分能力，无法体现平台规则适配、跨境物流协同和本地化增长运营，前端和用户更容易把该职业理解成普通市场营销专员或传统电商运营。
