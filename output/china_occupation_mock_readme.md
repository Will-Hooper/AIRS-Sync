# 中国职业层接口 Mock 使用说明

## 文件与页面状态对应关系

- `china_occupation_mock_search_response.json`
  对应页面状态：搜索命中独立建卡、搜索命中 merged_redirect、搜索命中 one_to_many_redirect、搜索无结果、搜索服务异常。
- `china_occupation_mock_detail_responses.json`
  对应页面状态：职业详情正常、字段缺省但可回退、slug 不存在、职业详情异常。
- `china_occupation_mock_mapping_response.json`
  对应页面状态：有明确 parent AIRS 职业、无 mapped_soc_code、映射服务异常。
- `china_occupation_mock_recommend_response.json`
  对应页面状态：相关推荐正常返回、相关推荐为空、相关推荐服务异常。
- `china_occupation_mock_error_cases.json`
  对应页面状态：所有接口统一异常结构；建议直接被 mock server 或前端错误分支复用。

## 建议的前端使用场景

- 搜索页或全局搜索框：优先读取 `china_occupation_mock_search_response.json`。
- 详情页主渲染：读取 `china_occupation_mock_detail_responses.json` 中对应 slug 的成功样例。
- 详情页关系模块：读取 `china_occupation_mock_mapping_response.json`。
- 相关推荐模块：读取 `china_occupation_mock_recommend_response.json`。
- 错误兜底页：统一读取 `china_occupation_mock_error_cases.json`。

## 首屏最小必需响应字段

前端详情页首屏真正必需的字段：

- `slug`
- `cnTitleDisplay`
- `enTitle`
- `priority`
- `track`
- `introShort`
- `mappedSocCode`
- `mappedAirsTitle`
- `relationExplainer`
- `whyNotMerged`

## 可延迟加载字段

以下字段可以在首屏之后再使用，不阻塞首屏渲染：

- `introLong`
- `riskNote`
- `chinaContextNote`
- `aliases`
- `parent.url`
- `seo.title`
- `seo.description`
- `share.title`
- `share.description`
- `results`（相关推荐列表）

## 统一异常返回格式

所有异常都使用同一套结构：

```json
{
  "success": false,
  "endpoint": "GET /api/china-occupations/:slug",
  "requestId": "mock-china_occupation_detail_unavailable",
  "error": {
    "status": 500,
    "code": "china_occupation_detail_unavailable",
    "message": "中国职业详情服务暂时不可用，请稍后重试。",
    "retryable": true,
    "details": {
      "slug": "bim-technician"
    }
  }
}
```

## 使用建议

1. 前端本地开发时，可直接把这几份 JSON 挂到 mock server 或静态文件服务。
2. 若页面先做首屏联调，只需要详情成功样例和搜索成功样例即可开始。
3. 状态页联调时，再切到 error_cases 和 emptyCases。
4. 真实后端接入时，优先保证字段名与这些 mock 一致，减少前端重复改动。
