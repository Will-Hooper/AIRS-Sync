# AIRS 可视化网站

这是一个基于 `React + React Router + Tailwind + TypeScript` 的 AIRS 静态网站，当前架构分为两部分：

- 前端 SPA：负责首页、职业详情页、交互视图与多语言界面
- Node + TypeScript 数据同步 CLI：负责生成 `backend/data/*.json`

网站最终以纯静态形式发布，不依赖在线后端 API。

## 当前结构

- [frontend](E:\Codex\frontend)
  React 前端工程根目录
- [frontend/src](E:\Codex\frontend\src)
  前端源码
- [spa](E:\Codex\spa)
  Vite 构建后的静态产物
- [src-node](E:\Codex\src-node)
  数据同步与 JSON 生成源码
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

## 本地静态预览

如果你想按接近 GitHub Pages 的方式预览：

```powershell
.\preview.ps1
```

然后打开：

- [http://localhost:8090/home.html](http://localhost:8090/home.html)

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
