# P0 中国职业种子数据说明

## 文件说明

- `china_occupation_p0_seed.json`：P0 18 个职业的联调样例数据，适合后端导入、前端 mock 和内容校对。
- `china_occupation_p0_seed.csv`：与 JSON 同字段顺序的平铺导入模板，适合表格校对和批量导入。
- 当前记录数：18

## 空值策略

- 标量字段统一使用空字符串 `""` 作为空值。
- 数组字段统一使用空数组 `[]` 作为空值。
- 不使用 `null`、`-`、`暂无` 作为导入层空值。
- 当前这批数据里，`mapped_soc_code` 和 `mapped_airs_title` 只有“老年人能力评估师”使用空字符串，表示暂无稳妥的 AIRS 父职业。

## 前端直接展示字段

- `cn_title_display`
- `en_title`
- `priority`
- `direction`
- `intro_short`
- `intro_long`
- `mapped_soc_code`
- `mapped_airs_title`
- `relation_explainer`
- `why_not_merged`
- `share_title`
- `recommended_related_slugs`

## 只用于搜索 / SEO / 分享的字段

- `aliases_json`
- `slug`
- `page_path`
- `seo_title`
- `seo_description`
- `share_description`

## 后续仍需人工补充或复核的字段

- `mapped_soc_code` 和 `mapped_airs_title`：后续若 AIRS 新增更贴切父职业，需要人工复核。
- `recommended_related_slugs`：当前为联调用示例，正式上线前可结合产品策略再微调。
- `share_description`：当前直接复用 `intro_short`，后续若接分享卡片样式，可人工精修。
- `status`：当前统一给到 `ready`，正式上线前可切成 `online`。

## JSON 与 CSV 的类型约定

- JSON 中的 `aliases_json` 和 `recommended_related_slugs` 是数组。
- CSV 中的 `aliases_json` 和 `recommended_related_slugs` 使用 JSON 字符串写入，字段名与 JSON 保持一致。
- 其他字段在 JSON 和 CSV 中保持同名同义。

## 最小可联调字段集

前端详情页首屏真正必需的字段如下：

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

## 导入顺序建议

1. 后端先导入 JSON 或 CSV 中的基础字段。
2. 前端先用 `slug`、`cn_title_display`、`intro_short`、`relation_explainer` 联调首屏。
3. 内容团队再校对 `intro_long`、`why_not_merged`、`seo_title`、`share_title`。
4. 联调通过后，再把 `status` 从 `ready` 切为 `online`。

## 字段顺序

CSV 与 JSON 的字段顺序建议按以下列固定，不要在后续扩批时随意变动：

- `id`
- `cn_code`
- `cn_title`
- `cn_title_display`
- `en_title`
- `slug`
- `page_path`
- `aliases_json`
- `mapped_soc_code`
- `mapped_airs_title`
- `mapping_type`
- `independent_card_flag`
- `priority`
- `status`
- `direction`
- `intro_short`
- `intro_long`
- `why_not_merged`
- `relation_explainer`
- `risk_note`
- `seo_title`
- `seo_description`
- `share_title`
- `share_description`
- `recommended_related_slugs`
- `created_at`
- `updated_at`
