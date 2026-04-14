# P0 中国职业种子数据字段填写规则

## 一般规则

- 文件编码统一为 UTF-8。
- 标量空值统一写 `""`，数组空值统一写 `[]`。
- 时间字段统一用 ISO 8601 格式，并带时区，例如 `2026-04-14T00:00:00+08:00`。
- 不在导入模板里使用 `null`、`-`、`N/A`、`暂无`。
- JSON 和 CSV 使用同一套字段名；CSV 中的数组字段写成 JSON 字符串。

## 字段逐项规则

| 字段 | 规则 | 示例 |
| --- | --- | --- |
| id | 必须唯一；建议使用 bigint 风格数值字符串，便于和数据库主键对齐。 | 100001 |
| cn_code | 有官方代码则填写；确实没有时填 `""`。 | 4-01-06-03 |
| cn_title | 填官方或原始中文职业名，不用简称替代。 | 建筑信息模型技术员 |
| cn_title_display | 填页面主标题；允许使用行业高频简称。 | BIM技术员 |
| en_title | 使用稳定、可读的英文展示名，首字母大写。 | BIM Technician |
| slug | 使用小写 kebab-case；一经上线不应频繁改动。 | bim-technician |
| page_path | 固定写成 `/china-occupations/:slug`。 | /china-occupations/bim-technician |
| aliases_json | 只填真实可搜的中文别名；建议 3-6 个；主名或主标题必须放第一位。 | ["BIM技术员","建筑信息模型师","BIM工程师"] |
| mapped_soc_code | 有稳妥父职业时填写标准 SOC 代码；没有时写 `""`。 | 17-3011.00 |
| mapped_airs_title | 只写 AIRS 父职业中文展示名；没有时写 `""`。 | 建筑与土木制图员 |
| mapping_type | 仅允许枚举值：`independent_card`、`merged_redirect`、`one_to_many_redirect`、`exact_linked`。P0 本批固定填 `independent_card`。 | independent_card |
| independent_card_flag | 布尔值；独立建卡填 `true`。 | true |
| priority | 枚举值 `P0/P1/P2`；本批固定 `P0`。 | P0 |
| status | 枚举值建议 `draft/reviewed/ready/online`；联调模板统一填 `ready`。 | ready |
| direction | 使用受控中文方向值，不自行发明新标签。 | AI/数据新职业 |
| intro_short | 50-80 字；必须写清场景、职责和独立展示理由。 | 略 |
| intro_long | 120-200 字；先写工作场景，再写与 AIRS 父职业的边界。 | 略 |
| why_not_merged | 必须说明为什么不能直接并入现有 AIRS 职业；避免空话。 | 略 |
| relation_explainer | 有父职业时强调“推荐挂靠”；无父职业时明确“暂无稳妥挂靠对象”。 | 略 |
| risk_note | 必须提醒前端和内容不要把 AIRS 父职业写成“已覆盖”。 | 略 |
| seo_title | 建议 26-42 个中文字符；格式尽量统一。 | BIM技术员是什么职业？工作内容、别名与 AIRS 关系 | AIRS 中国职业层 |
| seo_description | 建议 60-120 字；要包含工作内容和“为什么不能简单并入”。 | 略 |
| share_title | 建议 16-32 字；优先问题式。 | BIM技术员是什么职业？为什么要单独展示 |
| share_description | 可直接复用 `intro_short`；后续可人工精修。 | 略 |
| recommended_related_slugs | 必须是已存在职业的 slug 数组；默认 3 个；不能包含自己。 | ["digital-twin-application-technician","carbon-emissions-administrator","supply-chain-manager"] |
| created_at | 创建时间，导入时统一。 | 2026-04-14T00:00:00+08:00 |
| updated_at | 更新时间，导入时统一。 | 2026-04-14T00:00:00+08:00 |

## 别名填写规则

- 优先顺序：页面主标题同义词 > 行业高频简称 > 用户口语词。
- 不要为了凑数加入泛词，如“工程师”“顾问”“运营”。
- 不要加入与其他职业冲突明显的宽泛词。
- 中文职业优先填中文别名，不主动塞英文缩写，除非用户真实会这样搜，如 `BIM`、`AI`。

## 文案填写规则

- 不使用“赋能”“引领”“重塑行业”等空泛表述。
- 不直接说“这个职业就是某个 AIRS 职业”，只能说“推荐挂靠”“能力邻近”“便于理解关系”。
- `intro_short` 要适合首屏直接展示。
- `intro_long` 要适合详情页正文直接展示。
- `why_not_merged`、`relation_explainer`、`risk_note` 三段不要互相复制粘贴，应各自承担不同说明职责。

## 最小可联调字段集

前端详情页首屏真正必需的字段：

- `slug`
- `cn_title_display`
- `en_title`
- `priority`
- `direction`
- `intro_short`
- `mapped_soc_code`
- `mapped_airs_title`
- `relation_explainer`
- `why_not_merged`

## 扩批时的注意事项

- 扩到 P1/P2 时，字段名和空值策略保持不变。
- 如果出现 `merged_redirect` 或 `one_to_many_redirect`，仍沿用同一字段集，只调整 `mapping_type`、`independent_card_flag` 和映射说明字段。
- 新批次如果缺少 `cn_code` 或稳妥父职业，必须统一写空值，不允许临时发明占位词。
