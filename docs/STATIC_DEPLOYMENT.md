# Static Deployment

## 当前发布形态

当前网站已经重构为：

- `React + React Router + Tailwind + TypeScript` 前端
- `Vite` 打包输出到 [spa](E:\Codex\spa)
- `Node + TypeScript` CLI 负责生成 [backend/data](E:\Codex\backend\data) 下的 JSON 数据

网站线上运行时是纯静态站，不需要在线后端 API。

## 发布时必须带上的内容

最关键的是这三部分：

1. SPA 构建产物
   - [spa/index.html](E:\Codex\spa\index.html)
   - [spa/assets](E:\Codex\spa\assets)

2. 数据文件
   - [backend/data/airs_data.json](E:\Codex\backend\data\airs_data.json)
   - 以及前端读取到的其他 JSON

3. 根目录兼容入口
   - [index.html](E:\Codex\index.html)
   - [home.html](E:\Codex\home.html)
   - [occupation-view.html](E:\Codex\occupation-view.html)
   - [occupation.html](E:\Codex\occupation.html)

这些入口页会自动跳转到：

- `./spa/index.html#/`
- `./spa/index.html#/occupation/...`

## 推荐上传方式

如果你是发布到 GitHub Pages，推荐至少上传：

- [spa](E:\Codex\spa)
- [backend](E:\Codex\backend)
- [index.html](E:\Codex\index.html)
- [home.html](E:\Codex\home.html)
- [occupation-view.html](E:\Codex\occupation-view.html)
- [occupation.html](E:\Codex\occupation.html)
- [README.md](E:\Codex\README.md)

如果你是整个仓库直接发布，也可以直接上传整个项目目录，但要注意不要把本地缓存和临时文件一起带上。

## 不要上传

- `node_modules`
- `dist-node`
- `.tmp_*`
- `.edge-headless`
- `server-out.log`
- `server-err.log`
- `backend/data/onet/.cache`
- 任何本地调试截图

## 本地验证

安装依赖：

```powershell
npm install
```

构建：

```powershell
npm run build
```

本地静态预览：

```powershell
.\preview.ps1
```

然后访问：

- [http://localhost:8090/home.html](http://localhost:8090/home.html)

## 数据更新

网站本身不带后端服务，但数据会通过 Node CLI 重建：

```powershell
npm run sync:usajobs -- --useExistingHistoryOnly
npm run sync:onet -- --force
npm run sync:scorecard
```

如果你使用 GitHub Pages，更推荐直接依赖 GitHub Actions 自动更新，不需要每次手动执行。

## GitHub Pages 建议

如果你是仓库根目录发布，至少确认：

- `spa/index.html` 已存在
- `backend/data/airs_data.json` 可访问
- 根目录 `home.html` 能正确跳到 `spa/index.html#/`

上线后建议手动检查这几个地址：

- `/home.html`
- `/spa/index.html`
- `/backend/data/airs_data.json`
- `/occupation-view.html?soc=43-3099.00&lang=zh`
