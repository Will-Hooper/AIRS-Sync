# AIRS 中国职业层数据库字段方案

## 设计目标

- 在不破坏现有 AIRS 主职业表结构的前提下，新增一层“中国职业”数据，用来承接中国独立职业名、别名、搜索入口和映射说明。
- 既支持独立建卡，也支持 merged 和 one-to-many 的跳转型记录，避免以后重复改表。
- 让产品、搜索、后台审核和后续批量补库都能复用同一套主表。

## 建议主表

表名建议：`china_occupations`

| 字段 | 建议类型 | 必填 | 示例 | 说明 |
| --- | --- | --- | --- | --- |
| id | bigint / uuid | 是 | 100001 | 中国职业层主键。若现有 AIRS 用 bigint，建议继续沿用 bigint。 |
| cn_code | varchar(32) | 是 | 4-01-06-03 | 中国职业代码，建议唯一。 |
| cn_title | varchar(128) | 是 | 跨境电商运营管理师 | 原始中文职业名。 |
| en_title | varchar(256) | 否 | Cross-Border E-Commerce Operations Manager | 产品侧推荐英文名。 |
| aliases_json | json / jsonb | 是 | ["跨境电商运营","跨境运营"] | 中文搜索别名、常见缩写、倒装写法。 |
| mapped_soc_code | varchar(16) | 否 | 13-1161.00 | 推荐挂靠的 SOC 代码；没有可信父职业时可为空。 |
| mapped_airs_id | bigint | 否 | 867 | AIRS 内部职业 ID；若当前 AIRS 只稳定暴露 SOC，可先允许为空，后续补回。 |
| mapping_type | varchar(32) | 是 | independent_card | 中国职业与 AIRS 的关系类型。 |
| independent_card_flag | boolean | 是 | true | 是否独立建卡。 |
| priority | varchar(8) | 是 | P0 | 首批补库优先级。 |
| status | varchar(32) | 是 | reviewed | 数据状态，支持审核和上线流转。 |
| intro_short | varchar(256) | 否 | 50-80字摘要 | 列表页、搜索结果、卡片摘要。 |
| intro_long | text | 否 | 120-200字介绍 | 详情页长介绍。 |
| notes | text | 否 | 为什么不应简单并入现有职业 | 审核备注、映射解释、产品说明都放这里。 |
| created_at | timestamp | 是 | 2026-04-14 10:00:00 | 创建时间。 |
| updated_at | timestamp | 是 | 2026-04-14 10:00:00 | 最后更新时间。 |

## 推荐枚举

### mapping_type

- `independent_card`：应单独展示中国职业卡片。
- `merged_redirect`：不独立建卡，只展示映射说明并跳转到 AIRS 主职业。
- `one_to_many_redirect`：一个中国职业需要拆到多个 AIRS 主职业，先展示说明页或分流页。
- `exact_linked`：与 AIRS 主职业高度一致，直接复用 AIRS 卡片，但保留中国职业入口。

### status

- `draft`：初始导入或机器建议。
- `reviewed`：人工复核通过，待产品确认。
- `ready`：已可进入开发联调。
- `online`：已前台发布。
- `archived`：历史停用或合并后归档。

## 建议扩展字段

如果后续要把中国职业层真正做成长期资产，建议补以下字段：

| 字段 | 建议类型 | 用途 |
| --- | --- | --- |
| source_version | varchar(64) | 记录对应的《国家职业分类大典》版本或来源批次。 |
| source_definition | text | 保存中国职业原始定义，方便审核对照。 |
| relation_explainer | text | 用于前端展示“与 AIRS 主职业的关系说明”。 |
| why_not_merged | text | 用于前端展示“为什么不直接并入”。 |
| search_boost | integer | 搜索排序加权，如 P0 设为更高分。 |
| launch_batch | varchar(32) | 标识 first50、second100 等批次。 |

## 表关系建议

- `china_occupations.mapped_soc_code` 关联 AIRS 主职业表中的 `socCode`。
- 若 AIRS 已有内部职业主键，建议同步写入 `mapped_airs_id`，前端跳转优先用内部 ID，SOC 作为可读锚点。
- merged 和 one-to-many 场景建议再建一张 `china_occupation_mappings` 子表，避免一个中国职业只允许挂一个父职业。

## 索引建议

- 唯一索引：`cn_code`
- 普通索引：`mapped_soc_code`
- 组合索引：`status, priority`
- 全文或检索索引：`cn_title + aliases_json`

## 落地建议

- 第一阶段先落主表，满足独立建卡和搜索命中。
- 第二阶段增加映射子表，支持 one-to-many 和更复杂的关系说明。
- 第三阶段把审核流、搜索埋点和产品配置接入后台，形成持续补库机制。
