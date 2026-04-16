# AIRS H5 分享图牛马吉祥物说明

## 分数档位

- `81-100`：高稳定、低 AI 冲击。牛更松弛可靠，马更轻快自信，AI 只做辅助工具。
- `61-80`：整体仍可控。牛稳住节奏，马提速应对，AI 已介入但还没形成压迫。
- `41-60`：开始承压。牛明显变沉、还在硬撑，马先露出紧张和疲惫。
- `21-40`：压力明显上升。牛像在死扛，马更容易焦虑失衡，系统元素明显增强。
- `0-20`：高压预警。系统开始主导画面，牛被压得更沉，马更慌张，但仍保留可传播的黑色幽默。

## 资源与接入

- 分数映射：`frontend/src/h5/share/share-mascot-score-map.ts`
- 基础配置：`frontend/src/h5/share/share-mascot-config.ts`
- SVG 渲染：`frontend/src/h5/share/share-mascot-renderer.ts`
- H5 组件：`frontend/src/h5/components/ShareMascotScene.tsx`
- H5 分享图接入：`frontend/src/h5/share/share-image.ts`
- 基础 SVG 资源：`frontend/src/h5/assets/mascot/`

## 搜索框 IME 修复

- 共享策略放在 `frontend/src/shared/search-combobox-ime.ts` 和 `frontend/src/shared/useOccupationSearchCombobox.ts`
- 桌面端与 H5 端统一为：组合输入期间不误触发搜索、上屏完成后 Enter 可正常提交、提交时强制使用当前 query 的最新 payload

## 示例图

- 运行 `npm run export:share-samples`
- 输出目录：`output/share-mascot-samples/`
