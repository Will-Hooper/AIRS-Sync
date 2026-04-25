# AIRS Edit Mode

## 入口

- 只有 URL 中存在 `debug=1` 时，桌面端才启用编辑模式能力。
- 支持 hash 路由写法，例如 `/#/?debug=1` 和 `#/occupation/15-1252?debug=1`。
- 在 `debug=1` 已生效的前提下，可用 `Ctrl + Shift + E` 在浏览态和编辑态之间切换。
- H5 端当前只读，不显示编辑工具条和属性面板。

## 配置文件

- 首页默认配置：`/page-configs/home.json`
- 职业详情页默认配置：`/page-configs/occupation-detail.json`
- 浏览器本地保存键：`airs-page-config:<pageId>`

运行时读取顺序：

1. 先读取仓库内默认 JSON
2. 再读取本地已保存配置
3. 若本地有保存结果，则优先使用本地配置

## Schema

```ts
interface EditorPageConfig {
  schemaVersion: 1;
  pageId: string;
  updatedAt: string;
  modules: EditorPageModule[];
}

interface EditorPageModule {
  pageId: string;
  moduleId: string;
  moduleType: string;
  content: Record<string, EditorTextField>;
  layout: EditorModuleLayout;
  style: EditorModuleStyle;
  updatedAt: string;
}

interface EditorTextField {
  key: string;
  label: string;
  value: { en: string; zh: string };
  style?: {
    fontSize?: number;
    fontWeight?: number;
    lineHeight?: number;
    color?: string;
    textAlign?: "left" | "center" | "right";
  };
  multiline?: boolean;
}

interface EditorModuleLayout {
  sectionId: string;
  colStart: number;
  rowStart: number;
  colSpan: number;
  rowSpan: number;
  minHeight: number;
  minColSpan?: number;
  maxColSpan?: number;
  minRowSpan?: number;
  maxRowSpan?: number;
}

interface EditorModuleStyle {
  background?: string;
  borderRadius?: number;
  padding?: number;
  textColor?: string;
}
```

## 预留后端接口

- `GET /page-config/:pageId`
- `PUT /page-config/:pageId`

当前阶段仍以本地 JSON + 浏览器本地保存为主，接口路径已经在前端存储层保留。

## 已接入模块

### Desktop / Home

- `home-hero`
- `home-summary-average`
- `home-summary-concentration`
- `home-summary-rewrite`
- `home-summary-signal`
- `home-current-focus`
- `home-data-panel`

### Desktop / Occupation Detail

- `occupation-overview`
- `occupation-breakdown`
- `occupation-evidence`
- `occupation-tasks`
- `occupation-status`

### H5

- 首页读取 `home-hero.title`、`home-data-panel.note`
- 详情页读取 `occupation-overview.readKicker`、`occupation-breakdown.breakdownTitle`

## 使用方式

1. 进入编辑模式后，顶部出现工具条，右侧出现属性面板。
2. 单击模块进入选中态。
3. 双击文案直接改字。
4. 拖顶部手柄移动模块。
5. 拖右下角手柄调整模块尺寸。
6. 在右侧面板修改 grid、背景、圆角、padding、文字样式。
7. 点击顶部或右侧的“保存”把当前配置写入本地。
8. 点击“导出配置”下载当前页面 JSON。
9. 点击“重置当前模块”恢复该模块默认配置。
10. 点击“撤销本次改动”恢复该模块最近一次已保存状态。
