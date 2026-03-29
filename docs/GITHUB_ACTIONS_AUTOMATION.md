# GitHub Actions 自动更新说明

这套网站现在通过 GitHub Actions 自动更新数据，不需要你每次手动在本地执行同步脚本。

当前仓库是：

- `React + Vite + Tailwind` 静态前端
- `Node + TypeScript` 数据同步 CLI
- `GitHub Pages` 静态发布

工作流负责更新 JSON 数据，前端页面负责读取这些 JSON 并显示。

移动端 H5 页面位于：

- [E:\Codex\frontend\src\h5](/E:/Codex/frontend/src/h5)

静态入口位于：

- [E:\Codex\m\index.html](/E:/Codex/m/index.html)
- [E:\Codex\m\occupation.html](/E:/Codex/m/occupation.html)

## 当前工作流

### 1. `Update AIRS Data Hourly`

文件：

- [E:\Codex\.github\workflows\update-airs-daily.yml](/E:/Codex/.github/workflows/update-airs-daily.yml)

用途：

- 拉取最新招聘数据
- 重建 [E:\Codex\backend\data\airs_data.json](/E:/Codex/backend/data/airs_data.json)

当前频率：

- 每小时一次
- 每小时 `15` 分运行

默认来源：

- `USAJOBS`

可选来源：

- `CareerOneStop Jobs V2`

默认公开来源：

- `Greenhouse`
- `Lever`
- `Ashby`
- `SmartRecruiters`

这些公开职位板的源配置文件在：

- [E:\Codex\backend\data\public_jobboards_sources.json](/E:/Codex/backend/data/public_jobboards_sources.json)

### 2. `Update O-NET Data Monthly`

文件：

- [E:\Codex\.github\workflows\update-onet-monthly.yml](/E:/Codex/.github/workflows/update-onet-monthly.yml)

用途：

- 每月检查并更新 `O*NET`
- 重建 [E:\Codex\backend\data\airs_data.json](/E:/Codex/backend/data/airs_data.json)

当前频率：

- 每月一次
- 每月 1 日 `03:00 UTC`
- 即北京时间 `11:00`

### 3. `Update College Scorecard Monthly`

文件：

- [E:\Codex\.github\workflows\update-college-scorecard-monthly.yml](/E:/Codex/.github/workflows/update-college-scorecard-monthly.yml)

用途：

- 每月同步美国教育部 `College Scorecard`
- 更新大学 × 专业就业结果数据

当前频率：

- 每月一次
- 每月 1 日 `03:30 UTC`
- 即北京时间 `11:30`

## 启用前必须配置的 Secrets

进入 GitHub 仓库：

`Settings -> Secrets and variables -> Actions`

至少添加这两个 `Repository secrets`：

- `USAJOBS_API_KEY`
- `USAJOBS_USER_EMAIL`

含义：

- `USAJOBS_API_KEY`：你的 USAJOBS API Key
- `USAJOBS_USER_EMAIL`：申请 USAJOBS API 时使用的邮箱

如果这两个 secret 没填，`Update AIRS Data Hourly` 会在最开始直接失败。

## 可选的 CareerOneStop 配置

如果你还想启用第二招聘源 `CareerOneStop Jobs V2`，再添加：

- `CAREERONESTOP_API_TOKEN`
- `CAREERONESTOP_USER_ID`

可选 `Repository variable`：

- `CAREERONESTOP_LOCATION`

建议值：

- `US`

如果这两个 CareerOneStop secrets 没填，工作流不会失败，只会自动跳过该来源。

## 如何手动运行

进入仓库：

`Actions`

然后：

1. 选择 `Update AIRS Data Hourly`
2. 点击 `Run workflow`

或者：

1. 选择 `Update O-NET Data Monthly`
2. 点击 `Run workflow`

或者：

1. 选择 `Update College Scorecard Monthly`
2. 点击 `Run workflow`

## 自动更新后通常会修改哪些文件

### AIRS 小时更新

通常会改：

- [E:\Codex\backend\data\airs_data.json](/E:/Codex/backend/data/airs_data.json)
- [E:\Codex\backend\data\usajobs_history.json](/E:/Codex/backend/data/usajobs_history.json)
- [E:\Codex\backend\data\careeronestop_history.json](/E:/Codex/backend/data/careeronestop_history.json)
- [E:\Codex\backend\data\public_jobboards_history.json](/E:/Codex/backend/data/public_jobboards_history.json)
- [E:\Codex\backend\data\airs_baseline.json](/E:/Codex/backend/data/airs_baseline.json)

### O*NET 月更

通常会改：

- `backend/data/onet/*`
- [E:\Codex\backend\data\airs_data.json](/E:/Codex/backend/data/airs_data.json)
- [E:\Codex\backend\data\usajobs_history.json](/E:/Codex/backend/data/usajobs_history.json)
- [E:\Codex\backend\data\careeronestop_history.json](/E:/Codex/backend/data/careeronestop_history.json)

### College Scorecard 月更

通常会改：

- [E:\Codex\backend\data\college_scorecard_programs.json](/E:/Codex/backend/data/college_scorecard_programs.json)
- [E:\Codex\backend\data\college_scorecard_cip_summary.json](/E:/Codex/backend/data/college_scorecard_cip_summary.json)

## 工作流成功后发生什么

如果有数据变化，工作流会自动：

1. 提交更新后的 JSON 文件
2. 推送回仓库
3. 由 GitHub Pages 重新发布前端页面

因为前端本身是静态 SPA，所以通常不需要额外手工部署。

## 首次启用建议检查

首次启用后，建议手动跑一次这三个工作流，并确认：

1. `Update AIRS Data Hourly` 成功
2. `Update O-NET Data Monthly` 成功
3. `Update College Scorecard Monthly` 成功
4. 仓库里出现新的自动提交
5. 这些地址能正常打开：
   - `/home.html`
   - `/occupation-view.html?soc=43-3099.00&lang=zh`
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

这条链路不依赖 GitHub Actions，而是面向 Local / 自托管服务：

- 统计服务源码：
  - [E:\Codex\services\analytics\server.ts](/E:/Codex/services/analytics/server.ts)
- 手动生成报表：
  - `npm run analytics:report`
- 手动发送邮件：
  - `npm run analytics:email`

默认收件人：

- `neo17571875@gmail.com`

服务端每 72 小时会检查一次是否需要生成并发送报表；如果你在本机长期运行统计服务，也可以不再额外配置任务计划。

如果你在 Windows Local 模式下想强制本机每 3 天执行一次，可运行：

```powershell
powershell -ExecutionPolicy Bypass -File .\services\analytics\register-tri-daily-task.ps1
```

发送邮件所需环境变量：

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
