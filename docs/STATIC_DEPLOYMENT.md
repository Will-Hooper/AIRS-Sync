# Static Deployment

## 当前架构

当前网站已经改成纯前端模式：

- 页面直接读取 `backend/data/airs_data.json`
- 不再依赖 `/api/*` 后端接口
- 详情页和首页都从同一个 JSON 文件取数
- 数据更新通过 `src-node` 下的 Node + TypeScript CLI 与 GitHub Actions 完成

## 你发布时必须带上的文件

至少要带上这些：

- `home.html`
- `occupation-view.html`
- `maze-theme.css`
- `landing-neo.js`
- `occupation-neo.js`
- `i18n-neo.js`
- `api-client.js`
- `occupation-translation.js`
- `runtime-config.js`
- `backend/data/airs_data.json`

最简单的做法就是直接发布整个 `E:\Codex` 目录。

## 适合的发布方式

现在可以使用任何纯静态托管方式：

- GitHub Pages
- Netlify
- Vercel
- 任何能直接托管 HTML / CSS / JS / JSON 文件的服务

## 本地预览

项目仍保留本地静态预览脚本：

```powershell
.\preview.ps1
```

然后打开：

`http://localhost:8090/home.html`

## 数据更新

静态站本身没有后端服务，但数据会通过 Node CLI 重建：

```powershell
npm install
npm run build
npm run sync:usajobs -- --useExistingHistoryOnly
npm run sync:onet -- --force
npm run sync:scorecard
```

如果你使用 GitHub Pages，推荐直接依赖仓库内的 GitHub Actions 自动更新工作流。
