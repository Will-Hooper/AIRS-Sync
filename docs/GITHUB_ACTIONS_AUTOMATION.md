# GitHub Actions 自动更新说明

这套网站当前采用“数据源 -> 同步脚本 -> JSON 文件 -> 前端读取”的稳定准实时方案：

- 前端：`React + Vite + Tailwind` 静态 SPA
- 数据同步：`Node + TypeScript` CLI
- 发布：`GitHub Pages` 静态站点

桌面端与 H5 共用同一份 [E:\Codex\backend\data\airs_data.json](/E:/Codex/backend/data/airs_data.json)，不会出现两端读不同数据源的情况。

## 当前工作流

### 1. `Update Recruitment Data Hourly`

文件：

- [E:\Codex\.github\workflows\update-airs-hourly.yml](/E:/Codex/.github/workflows/update-airs-hourly.yml)

用途：

- 每小时同步招聘热度、招聘数量、地区分布、热门职业榜单
- 生成小时级 JSON

当前频率：

- 每小时一次
- 每小时 `15` 分运行

主要来源：

- `USAJOBS`
- `CareerOneStop Jobs V2`（已配置 secret 时启用）
- 公开 ATS 板：
  - `Greenhouse`
  - `Lever`
  - `Ashby`
  - `SmartRecruiters`

配置文件：

- [E:\Codex\backend\data\public_jobboards_sources.json](/E:/Codex/backend/data/public_jobboards_sources.json)

### 2. `Update AIRS Full Daily`

文件：

- [E:\Codex\.github\workflows\update-airs-full-daily.yml](/E:/Codex/.github/workflows/update-airs-full-daily.yml)

用途：

- 每天完整重算 AIRS 总分、分项拆解、职业排序
- 刷新 [E:\Codex\backend\data\airs_data.json](/E:/Codex/backend/data/airs_data.json)

当前频率：

- 每天一次
- 每天 `02:20 UTC`
- 即北京时间 `10:20`

### 3. `Update O-NET Data Quarterly`

文件：

- [E:\Codex\.github\workflows\update-onet-quarterly.yml](/E:/Codex/.github/workflows/update-onet-quarterly.yml)

用途：

- 每季度同步 `O*NET`
- 刷新职业定义、描述、技能、任务说明，并重建 AIRS 数据集

当前频率：

- 每季度一次
- 每年 `1 / 4 / 7 / 10` 月 1 日 `03:00 UTC`
- 即北京时间 `11:00`

### 4. `Update College Scorecard Yearly`

文件：

- [E:\Codex\.github\workflows\update-college-scorecard-yearly.yml](/E:/Codex/.github/workflows/update-college-scorecard-yearly.yml)

用途：

- 每年同步美国教育部 `College Scorecard`
- 刷新高校 × 专业就业结果数据

当前频率：

- 每年一次
- 每年 1 月 15 日 `03:30 UTC`
- 即北京时间 `11:30`

### 5. `Update Analytics Report Every 3 Days`

文件：

- [E:\Codex\.github\workflows\update-analytics-tri-daily.yml](/E:/Codex/.github/workflows/update-analytics-tri-daily.yml)

用途：

- 每 3 天生成一次用户输入统计报表
- 在 SMTP 已配置时发送邮件

当前频率：

- 每 3 天一次
- `01:00 UTC`
- 即北京时间 `09:00`

## 启用前必须配置的 Secrets

进入 GitHub 仓库：

`Settings -> Secrets and variables -> Actions`

至少添加这两个 `Repository secrets`：

- `USAJOBS_API_KEY`
- `USAJOBS_USER_EMAIL`

含义：

- `USAJOBS_API_KEY`：你的 USAJOBS API Key
- `USAJOBS_USER_EMAIL`：申请 USAJOBS API 时使用的邮箱

如果这两个 secret 没填，以下两个工作流会在最开始直接失败：

- `Update Recruitment Data Hourly`
- `Update AIRS Full Daily`

## 可选的 CareerOneStop 配置

如果你还想启用第二招聘源 `CareerOneStop Jobs V2`，再添加：

- `CAREERONESTOP_API_TOKEN`
- `CAREERONESTOP_USER_ID`

可选 `Repository variable`：

- `CAREERONESTOP_LOCATION`

建议值：

- `US`

如果这两个 CareerOneStop secrets 没填，工作流不会失败，只会自动跳过该来源。

## 可选的报表邮件 SMTP 配置

三天报表邮件发送依赖以下 secrets：

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

如果 SMTP 未配置：

- 报表仍会生成
- 工作流会在摘要里写明“未发送邮件”

## 如何手动运行

进入仓库 `Actions` 页面后，可以分别手动运行：

1. `Update Recruitment Data Hourly`
2. `Update AIRS Full Daily`
3. `Update O-NET Data Quarterly`
4. `Update College Scorecard Yearly`
5. `Update Analytics Report Every 3 Days`

## 自动更新后通常会修改哪些文件

### 招聘数据小时更新

通常会改：

- [E:\Codex\backend\data\airs_data.json](/E:/Codex/backend/data/airs_data.json)
- [E:\Codex\backend\data\usajobs_history.json](/E:/Codex/backend/data/usajobs_history.json)
- [E:\Codex\backend\data\careeronestop_history.json](/E:/Codex/backend/data/careeronestop_history.json)
- [E:\Codex\backend\data\public_jobboards_history.json](/E:/Codex/backend/data/public_jobboards_history.json)
- [E:\Codex\backend\data\airs_baseline.json](/E:/Codex/backend/data/airs_baseline.json)

### AIRS 每日完整重算

通常会改：

- [E:\Codex\backend\data\airs_data.json](/E:/Codex/backend/data/airs_data.json)
- [E:\Codex\backend\data\usajobs_history.json](/E:/Codex/backend/data/usajobs_history.json)
- [E:\Codex\backend\data\careeronestop_history.json](/E:/Codex/backend/data/careeronestop_history.json)
- [E:\Codex\backend\data\public_jobboards_history.json](/E:/Codex/backend/data/public_jobboards_history.json)
- [E:\Codex\backend\data\airs_baseline.json](/E:/Codex/backend/data/airs_baseline.json)

### O*NET 季度同步

通常会改：

- `backend/data/onet/*`
- [E:\Codex\backend\data\airs_data.json](/E:/Codex/backend/data/airs_data.json)
- [E:\Codex\backend\data\usajobs_history.json](/E:/Codex/backend/data/usajobs_history.json)
- [E:\Codex\backend\data\careeronestop_history.json](/E:/Codex/backend/data/careeronestop_history.json)

### College Scorecard 年度同步

通常会改：

- [E:\Codex\backend\data\college_scorecard_programs.json](/E:/Codex/backend/data/college_scorecard_programs.json)
- [E:\Codex\backend\data\college_scorecard_cip_summary.json](/E:/Codex/backend/data/college_scorecard_cip_summary.json)

### 三天统计报表

通常会改：

- [E:\Codex\services\analytics\reports\latest-report.html](/E:/Codex/services/analytics/reports/latest-report.html)
- [E:\Codex\services\analytics\reports\latest-report.json](/E:/Codex/services/analytics/reports/latest-report.json)

## 失败日志与排查

这些工作流都增加了两层失败可见性：

1. 失败时把 `.log` 上传成 artifact
2. 在 `GITHUB_STEP_SUMMARY` 中写出明确的失败说明

因此如果更新失败，至少可以直接从：

- Actions 日志
- 失败 artifact
- Step Summary

这三处看见原因。

## 首次启用建议检查

首次启用后，建议手动跑一次这五个工作流，并确认：

1. `Update Recruitment Data Hourly` 成功
2. `Update AIRS Full Daily` 成功
3. `Update O-NET Data Quarterly` 成功
4. `Update College Scorecard Yearly` 成功
5. `Update Analytics Report Every 3 Days` 成功
6. 仓库里出现新的自动提交
7. 这些地址能正常打开：
   - `/home.html`
   - `/occupation-view.html?soc=43-3099.00&lang=zh`
   - `/m/index.html`
   - `/backend/data/airs_data.json`

## 与前端构建的关系

GitHub Actions 当前默认更新的是数据文件，不会每次都重新构建前端。

也就是说：

- 页面代码改动后，需要你自己上传或提交前端文件
- 数据更新则由工作流自动完成

前端当前核心目录是：

- [E:\Codex\frontend](/E:/Codex/frontend)
- [E:\Codex\spa](/E:/Codex/spa)

如果你改了页面、样式或 React 组件，记得把前端构建产物一起同步到仓库。

## 本地统计与三天邮件报表

除了 GitHub Actions，本地也保留了独立统计服务：

- 服务源码：
  - [E:\Codex\services\analytics\server.ts](/E:/Codex/services/analytics/server.ts)
- 手动生成报表：
  - `npm run analytics:report`
- 手动发送邮件：
  - `npm run analytics:email`

默认收件人：

- `neo17571875@gmail.com`

如果你在 Windows Local 模式下想强制本机每 3 天执行一次，可运行：

```powershell
powershell -ExecutionPolicy Bypass -File .\services\analytics\register-tri-daily-task.ps1
```
