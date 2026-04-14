# AIRS 中国职业层 API 与字段文档

## 适用范围

- 本期上线范围仅限 P0 18 个中国职业。
- 字段与接口按最小可上线方案设计，但保留 `merged_redirect` 和 `one_to_many_redirect` 的扩展口。

## 一、主表字段

表名建议：`china_occupations`

| 字段 | 类型建议 | 必填 | 本期是否必须 | 说明 |
| --- | --- | --- | --- | --- |
| id | bigint / uuid | 是 | 是 | 中国职业主键 |
| slug | varchar(128) | 是 | 是 | 页面唯一 slug，用于详情路由 |
| cn_code | varchar(32) | 是 | 是 | 中国职业代码 |
| cn_title | varchar(128) | 是 | 是 | 原始中文名 |
| cn_title_display | varchar(128) | 是 | 是 | 页面主标题 |
| en_title | varchar(256) | 否 | 是 | 页面英文副标题 |
| track | varchar(64) | 是 | 是 | 方向，如平台经济、AI/数据新职业 |
| priority | varchar(8) | 是 | 是 | P0/P1/P2 |
| mapping_type | varchar(32) | 是 | 是 | `independent_card`、`merged_redirect`、`one_to_many_redirect`、`exact_linked` |
| independent_card_flag | boolean | 是 | 是 | 是否独立建卡 |
| status | varchar(32) | 是 | 是 | `draft`、`reviewed`、`ready`、`online` |
| intro_short | varchar(256) | 否 | 是 | 一句话定义 |
| intro_long | text | 否 | 是 | 长文案 |
| reason | text | 否 | 是 | 为什么单独展示 |
| why_not_merged | text | 否 | 是 | 为什么不能直接 merged |
| created_at | timestamp | 是 | 是 | 创建时间 |
| updated_at | timestamp | 是 | 是 | 更新时间 |

## 二、与 AIRS 主职业关系字段

| 字段 | 类型建议 | 本期是否必须 | 说明 |
| --- | --- | --- | --- |
| mapped_soc_code | varchar(16) | 是 | 推荐挂靠的 SOC 代码；没有稳妥父职业时可为空 |
| mapped_airs_id | bigint | 否 | AIRS 内部主键；若当前没有稳定 ID，可暂空 |
| mapped_airs_title | varchar(256) | 是 | AIRS 父职业展示名 |
| relation_explainer | text | 是 | 页面“与 AIRS 主职业关系说明”模块直接使用 |
| risk_note | text | 是 | 页面“AIRS 风险分析承接区”直接使用 |

## 三、搜索别名字段

| 字段 | 类型建议 | 本期是否必须 | 说明 |
| --- | --- | --- | --- |
| aliases_json | json / jsonb | 是 | 原始别名数组 |
| normalized_aliases_json | json / jsonb | 是 | 归一化后的别名数组，用于搜索 |
| search_boost | integer | 否 | 搜索加权，P0 建议更高 |

## 四、独立建卡字段

| 字段 | 类型建议 | 本期是否必须 | 说明 |
| --- | --- | --- | --- |
| card_type | varchar(32) | 否 | 建议固定为 `china_occupation` |
| page_path | varchar(256) | 是 | 页面路径，如 `/china-occupations/cross-border-e-commerce-operations-manager` |
| launch_batch | varchar(32) | 是 | 本期建议写 `first_p0_18` |
| launch_order | integer | 是 | 首发顺序 |

## 五、SEO 字段

| 字段 | 类型建议 | 本期是否必须 | 说明 |
| --- | --- | --- | --- |
| seo_title | varchar(256) | 是 | 页面 title |
| seo_description | varchar(512) | 是 | 页面 description |
| canonical_url | varchar(512) | 否 | 若站点已做 canonical，可直接存 |

## 六、分享字段

| 字段 | 类型建议 | 本期是否必须 | 说明 |
| --- | --- | --- | --- |
| share_title | varchar(256) | 是 | 分享标题 |
| share_summary | varchar(512) | 否 | 分享摘要，可先复用 intro_short |
| share_image | varchar(512) | 否 | 若暂无分享图可先为空 |

## 七、状态字段

| 字段 | 类型建议 | 本期是否必须 | 说明 |
| --- | --- | --- | --- |
| status | varchar(32) | 是 | 控制是否可被前台读取 |
| published_at | timestamp | 否 | 上线时间 |
| archived_at | timestamp | 否 | 下线时间 |

## 八、前端实际取数字段最小集

### 搜索接口最小集

- `id`
- `slug`
- `cn_title_display`
- `en_title`
- `track`
- `priority`
- `mapping_type`
- `independent_card_flag`
- `intro_short`
- `matched_alias`
- `match_type`
- `mapped_soc_code`
- `mapped_airs_title`

### 详情接口最小集

- `id`
- `slug`
- `cn_code`
- `cn_title_display`
- `en_title`
- `track`
- `priority`
- `mapping_type`
- `independent_card_flag`
- `intro_short`
- `intro_long`
- `reason`
- `why_not_merged`
- `relation_explainer`
- `risk_note`
- `china_context_note`
- `aliases_json`
- `mapped_soc_code`
- `mapped_airs_title`
- `seo_title`
- `seo_description`
- `share_title`

## 九、建议接口

### 1. 中国职业搜索接口

- 方法：`GET /api/china-occupations/search`
- 作用：按中国职业主名和别名检索；优先返回中国职业层结果。

请求参数：

| 参数 | 必填 | 示例 | 说明 |
| --- | --- | --- | --- |
| q | 是 | BIM技术员 | 原始查询词 |
| limit | 否 | 10 | 返回条数，默认 10 |
| scene | 否 | global_search | 搜索场景，便于后续排序差异化 |
| include_airs_fallback | 否 | true | 无中国职业命中时是否带 AIRS fallback 提示 |

响应字段建议：

```json
{
  "query": "BIM技术员",
  "normalizedQuery": "bim技术员",
  "results": [
    {
      "id": "100023",
      "slug": "bim-technician",
      "cnTitleDisplay": "BIM技术员",
      "enTitle": "BIM Technician",
      "track": "BIM/数字建造",
      "priority": "P0",
      "mappingType": "independent_card",
      "independentCardFlag": true,
      "matchType": "alias_exact",
      "matchedAlias": "BIM技术员",
      "introShort": "BIM技术员主要活跃在建筑数字化建模与协同场景……",
      "parent": {
        "socCode": "17-3011.00",
        "title": "建筑与土木制图员"
      },
      "url": "/china-occupations/bim-technician"
    }
  ],
  "fallback": null
}
```

### 2. 中国职业详情接口

- 方法：`GET /api/china-occupations/:slug`
- 作用：返回独立卡片详情页需要的全部字段。

路径参数：

| 参数 | 必填 | 示例 |
| --- | --- | --- |
| slug | 是 | cross-border-e-commerce-operations-manager |

响应字段建议：

```json
{
  "id": "100001",
  "slug": "cross-border-e-commerce-operations-manager",
  "cnCode": "4-01-06-03",
  "cnTitleDisplay": "跨境电商运营管理师",
  "enTitle": "Cross-Border E-Commerce Operations Manager",
  "track": "平台经济",
  "priority": "P0",
  "mappingType": "independent_card",
  "independentCardFlag": true,
  "introShort": "……",
  "introLong": "……",
  "reason": "……",
  "whyNotMerged": "……",
  "relationExplainer": "当前推荐挂靠 AIRS 主职业为……",
  "riskNote": "页面不要把该职业写成 AIRS 已独立覆盖……",
  "chinaContextNote": "在中国平台经营语境下……",
  "aliases": ["跨境电商运营", "跨境运营"],
  "parent": {
    "socCode": "13-1161.00",
    "airsId": null,
    "title": "市场研究分析师与营销专员",
    "url": "/occupations/13-1161-00"
  },
  "seo": {
    "title": "跨境电商运营管理师是什么职业？工作内容、别名与 AIRS 关系 | AIRS 中国职业层",
    "description": "……"
  },
  "share": {
    "title": "跨境电商运营管理师是什么职业？为什么要单独展示"
  }
}
```

状态码建议：

- `200`：正常返回
- `404`：slug 不存在
- `410`：记录已下线或归档
- `500`：服务异常

### 3. 中国职业与 AIRS 映射接口

- 方法：`GET /api/china-occupations/:slug/mapping`
- 作用：单独返回映射关系，便于后续 merged 和 one-to-many 共用。

响应字段建议：

```json
{
  "slug": "bim-technician",
  "mappingType": "independent_card",
  "independentCardFlag": true,
  "parent": {
    "socCode": "17-3011.00",
    "title": "建筑与土木制图员"
  },
  "relationExplainer": "当前推荐挂靠 AIRS 主职业为建筑与土木制图员……",
  "whyNotMerged": "如果直接并入 AIRS“建筑与土木制图员”……",
  "relatedAirsTargets": []
}
```

### 4. 推荐职业接口

- 方法：`GET /api/china-occupations/:slug/related`
- 作用：返回相关推荐职业，优先同方向，再补同优先级。

请求参数：

| 参数 | 必填 | 示例 | 说明 |
| --- | --- | --- | --- |
| limit | 否 | 3 | 默认 3 |

响应字段建议：

```json
{
  "slug": "bim-technician",
  "results": [
    {
      "slug": "carbon-emissions-administrator",
      "cnTitleDisplay": "碳排放管理员",
      "priority": "P0",
      "track": "双碳/绿色经济"
    }
  ]
}
```

## 十、实现建议

- 搜索接口与详情接口都只返回 `status in (ready, online)` 的记录。
- slug 建议直接存库，不在前端临时拼接。
- `relation_explainer`、`risk_note`、`china_context_note` 建议后端预生成，避免前端再拼文案。
- 即使本期只上 P0，也保留 `mapping_type` 字段，避免后续 merged 和 one-to-many 再改接口。
