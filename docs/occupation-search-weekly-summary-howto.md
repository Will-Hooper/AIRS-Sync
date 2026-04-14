# AIRS 中国职业搜索周报整理说明

## 这份说明解决什么问题

当前项目已经有这些固定入口：

- 累计搜索质量报表：[latest-search-quality.json](/E:/Codex/services/analytics/reports/latest-search-quality.json)
- feedback 数据：`services/analytics/data/search-feedback.ndjson`
- 搜索日志：`services/analytics/data/search-events.ndjson`
- seed warning：`npm run search:check-seeds`
- 回归测试：`npm run test:search`

这份说明只解决一件事：

如何基于当前项目现状，把“累计报表 + 最近 7/14 天原始数据 + warning + 测试结果”整理成本周周报。

## 固定执行命令

每周先执行这三条：

```powershell
npm run analytics:search-quality
npm run search:check-seeds
npm run test:search
```

然后打开：

- [latest-search-quality.json](/E:/Codex/services/analytics/reports/latest-search-quality.json)
- [occupation-search-weekly-report-template.md](/E:/Codex/docs/occupation-search-weekly-report-template.md)

## 为什么还要看最近 7/14 天原始数据

当前 `latest-search-quality.json` 是现有项目里的累计快照，适合看整体趋势。

但周运营时，优先级判断要看最近窗口：

- 默认最近 `7` 天
- 流量低时看最近 `14` 天

因此，周报里必须用原始日志再补一次近 7/14 天视角。

## 最近 7/14 天搜索日志筛选方法

把下面命令里的 `$days = 7` 改成 `14`，就能切换窗口。

```powershell
$days = 7
$cutoff = (Get-Date).AddDays(-$days)

$events = Get-Content 'E:\Codex\services\analytics\data\search-events.ndjson' |
  Where-Object { $_.Trim() } |
  ForEach-Object { $_ | ConvertFrom-Json } |
  Where-Object { [datetime]$_.occurredAt -ge $cutoff }

"Recent events: $($events.Count)"

$events |
  Group-Object normalizedQuery |
  Sort-Object Count -Descending |
  Select-Object -First 20 Name, Count
```

## 最近 7/14 天零结果词

```powershell
$events |
  Where-Object { $_.isZeroResult -eq $true } |
  Group-Object normalizedQuery |
  Sort-Object Count -Descending |
  Select-Object -First 20 Name, Count
```

## 最近 7/14 天有结果但未点击词

```powershell
$events |
  Where-Object { ($_.resultCount -gt 0) -and ($_.didClickResult -ne $true) } |
  Group-Object normalizedQuery |
  Sort-Object Count -Descending |
  Select-Object -First 20 Name, Count
```

## 最近 7/14 天 `matchType` 和设备分布

```powershell
$events |
  Group-Object matchType |
  Sort-Object Count -Descending |
  Select-Object Name, Count

$events |
  Group-Object deviceType |
  Sort-Object Count -Descending |
  Select-Object Name, Count
```

## 最近 7/14 天 feedback 词

```powershell
$days = 7
$cutoff = (Get-Date).AddDays(-$days)

$feedback = Get-Content 'E:\Codex\services\analytics\data\search-feedback.ndjson' |
  Where-Object { $_.Trim() } |
  ForEach-Object { $_ | ConvertFrom-Json } |
  Where-Object { [datetime]$_.occurredAt -ge $cutoff }

"Recent feedback: $($feedback.Count)"

$feedback |
  Group-Object feedbackText |
  Sort-Object Count -Descending |
  Select-Object -First 20 Name, Count
```

## warning 如何整理进周报

把 warning 输出保存一份文本，再只摘高优先项：

```powershell
npm run search:check-seeds | Tee-Object 'E:\Codex\services\analytics\reports\latest-search-seed-warnings.txt'
```

周报里只先写：

- 高频搜索词跨 occupation 冲突
- 已影响主结果的冲突
- 高频 feedback 相关冲突

当前优先人工判断样例直接写：

- `会计`
- `发货`

## 周报填写顺序

每周照这个顺序整理：

1. 先从 `latest-search-quality.json` 抄累计总量和整体分布。
2. 再用近 7/14 天原始日志填本周窗口数据。
3. 再贴 Top 零结果词、Top 未点击词、Top 反馈词。
4. 再补本周高优先 warning。
5. 最后写本周是否新增 alias、调 weight、调 alternatives，或者明确暂不处理。

## 当前阶段明确不做

周报整理阶段明确不做这些动作：

- 不重做 analytics
- 不改搜索架构
- 不新增独立搜索服务
- 不进入 P1 扩库
