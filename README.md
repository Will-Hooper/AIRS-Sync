# AIRS 可视化网站

这是一个基于 `React + React Router + Tailwind + TypeScript` 的 AIRS 静态网站，当前架构分为两部分：

- 前端 SPA：负责首页、职业详情页、交互视图与多语言界面
- Node + TypeScript 数据同步 CLI：负责生成 `backend/data/*.json`
- 独立移动端 H5：位于 [frontend/src/h5](E:\Codex\frontend\src\h5)，通过 `/m/...` 独立入口访问
- 本地统计服务：位于 [services/analytics](E:\Codex\services\analytics)，负责搜索埋点、IP 地域识别、三天报表与邮件发送

网站最终以纯静态形式发布，不依赖在线后端 API。

## 当前结构

- [frontend](E:\Codex\frontend)
  React 前端工程根目录
- [frontend/src](E:\Codex\frontend\src)
  前端源码
- [frontend/src/h5](E:\Codex\frontend\src\h5)
  独立移动端 H5 页面、组件与分享图逻辑
- [spa](E:\Codex\spa)
  Vite 构建后的静态产物
- [src-node](E:\Codex\src-node)
  数据同步与 JSON 生成源码
- [services/analytics](E:\Codex\services\analytics)
  本地统计服务、报表生成与邮件发送脚本
- [backend/data](E:\Codex\backend\data)
  网站运行时读取的数据文件

## 页面入口

真正运行的站点是 SPA，入口文件为：

- [spa/index.html](E:\Codex\spa\index.html)

仓库根目录保留了兼容跳转页，便于 GitHub Pages 和旧链接继续工作：

- [index.html](E:\Codex\index.html)
- [home.html](E:\Codex\home.html)
- [occupation-view.html](E:\Codex\occupation-view.html)
- [occupation.html](E:\Codex\occupation.html)

这些文件会自动跳转到：

- `./spa/index.html#/`
- `./spa/index.html#/occupation/...`

另外，移动端 H5 提供独立入口：

- [m/index.html](E:\Codex\m\index.html)
- [m/occupation.html](E:\Codex\m\occupation.html)

它们会分别跳转到：

- `./spa/index.html#/m`
- `./spa/index.html#/m/occupation/...`

正式上线时，根目录入口还支持按子域名自动分流：

- `www.[DOMAIN]` 默认进入桌面端
- `m.[DOMAIN]` 默认进入独立 H5 端

也就是说，正式接入独立子域名后，不需要再用 `/m/...` 作为对外主入口，`m.[DOMAIN]` 会直接进入 H5 页面。

## 前端技术栈

- `React`
- `React Router`
- `Tailwind CSS`
- `TypeScript`
- `Vite`

关键文件：

- [frontend/src/main.tsx](E:\Codex\frontend\src\main.tsx)
- [frontend/src/router.tsx](E:\Codex\frontend\src\router.tsx)
- [frontend/src/pages/HomePage.tsx](E:\Codex\frontend\src\pages\HomePage.tsx)
- [frontend/src/pages/OccupationPage.tsx](E:\Codex\frontend\src\pages\OccupationPage.tsx)
- [frontend/src/h5/pages/MobileHomePage.tsx](E:\Codex\frontend\src\h5\pages\MobileHomePage.tsx)
- [frontend/src/h5/pages/MobileOccupationPage.tsx](E:\Codex\frontend\src\h5\pages\MobileOccupationPage.tsx)
- [frontend/src/h5/lib/share-image.ts](E:\Codex\frontend\src\h5\lib\share-image.ts)
- [frontend/src/styles.css](E:\Codex\frontend\src\styles.css)

## 数据文件

网站当前主要读取：

- [backend/data/airs_data.json](E:\Codex\backend\data\airs_data.json)

辅助数据包括：

- [backend/data/soc_detailed_master.json](E:\Codex\backend\data\soc_detailed_master.json)
- [backend/data/public_jobboards_sources.json](E:\Codex\backend\data\public_jobboards_sources.json)
- [backend/data/public_jobboards_history.json](E:\Codex\backend\data\public_jobboards_history.json)
- [backend/data/college_scorecard_programs.json](E:\Codex\backend\data\college_scorecard_programs.json)
- [backend/data/college_scorecard_cip_summary.json](E:\Codex\backend\data\college_scorecard_cip_summary.json)

## 本地开发

安装依赖：

```powershell
npm install
```

前端类型检查：

```powershell
npm run typecheck:frontend
```

前端开发模式：

```powershell
npm run dev:frontend
```

前端构建：

```powershell
npm run build:frontend
```

完整构建：

```powershell
npm run build
```

启动本地统计服务：

```powershell
npm run analytics:server
```

手动生成统计报表：

```powershell
npm run analytics:report
```

手动发送统计邮件：

```powershell
npm run analytics:email
```

## 本地静态预览

如果你想按接近 GitHub Pages 的方式预览：

```powershell
.\preview.ps1
```

然后打开：

- [http://localhost:8090/home.html](http://localhost:8090/home.html)
- [http://localhost:8090/m/index.html](http://localhost:8090/m/index.html)

## 数据重建

构建 Node CLI：

```powershell
npm run build:node
```

重建招聘数据：

```powershell
npm run sync:usajobs -- --useExistingHistoryOnly
```

更新 O-NET：

```powershell
npm run sync:onet -- --force
```

更新美国大学专业就业结果：

```powershell
npm run sync:scorecard
```

## 自动更新

GitHub Actions 已接入三条自动更新链路：

1. `Update AIRS Data Daily`
2. `Update O-NET Data Monthly`
3. `Update College Scorecard Monthly`

详见：

- [docs/GITHUB_ACTIONS_AUTOMATION.md](E:\Codex\docs\GITHUB_ACTIONS_AUTOMATION.md)

## 搜索统计与三天报表

搜索统计现在由独立本地服务处理：

- 事件接收：`POST /api/analytics/events/search`
- 记录内容：
  - 搜索词
  - 来源页面
  - IP
  - 国家 / 地区 / 城市
  - 命中的职业
- 报表内容：
  - 职业输入次数排行
  - IP 地域分布
  - 趋势变化
  - 总输入次数

核心文件：

- [services/analytics/server.ts](E:\Codex\services\analytics\server.ts)
- [services/analytics/lib/report.ts](E:\Codex\services\analytics\lib\report.ts)
- [services/analytics/lib/email.ts](E:\Codex\services\analytics\lib\email.ts)

本地默认端口：

- `http://localhost:8787`

如需让前端把埋点发到这个服务，可在前端构建时设置：

- `VITE_ANALYTICS_BASE_URL`

例如：

```powershell
$env:VITE_ANALYTICS_BASE_URL="http://localhost:8787"
npm run build:frontend
```

### 邮件发送

发送报表邮件需要配置 SMTP 环境变量：

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

默认收件人：

- `neo17571875@gmail.com`

### 每 3 天自动执行

服务端本身内置了 72 小时一次的检查逻辑；如果你在本机长期运行统计服务，它会自动生成并发送报表。

在 Local 模式下，如果你希望 Windows 自己定时执行，也可以注册计划任务：

```powershell
powershell -ExecutionPolicy Bypass -File .\services\analytics\register-tri-daily-task.ps1
```

## 发布

当前推荐发布方式是纯静态托管：

- `GitHub Pages`
- `Netlify`
- `Vercel`

发布时要以 [spa](E:\Codex\spa) 产物为核心，并确保：

- `spa/assets/*` 已上传
- `backend/data/*.json` 已上传
- 根目录兼容入口页已上传

详见：

- [docs/STATIC_DEPLOYMENT.md](E:\Codex\docs\STATIC_DEPLOYMENT.md)

## 数据来源

当前默认会整合这些来源：

- `USAJOBS`
- `CareerOneStop Jobs V2`（配置密钥后启用）
- 公开 ATS 职位板：
  - `Greenhouse`
  - `Lever`
  - `Ashby`
  - `SmartRecruiters`
- `O*NET`
- `College Scorecard`

## 说明

当前仓库已经不再以传统后端服务作为运行前提。  
网站本身是静态 SPA，数据通过离线同步脚本生成并提交回仓库。
