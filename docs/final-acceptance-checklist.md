# AIRS 最终验收清单

更新日期：2026-04-16

## 本轮范围

- 桌面端搜索框中文输入法回归
- H5 端搜索框中文输入法回归
- H5 分享图人工视觉回归
- 仅允许小范围修正，不重构现有结构

## 本轮小修

- 已修复桌面端首页搜索后 URL 同步竞态问题
- 位置：`frontend/src/pages/HomePage.tsx`
- 现象：中文输入法完成上屏并回车后，页面跳转已成功，但首页的延迟 `q` 同步仍可能覆盖 `lang`/`entry` 参数，导致提交的不是最终 payload
- 处理：在跳转前标记一次性跳过后续 query 同步，避免旧状态回写 URL

## 已通过

### 浏览器 / 设备

- Windows 桌面端 `Microsoft Edge`
- 桌面主站：`http://127.0.0.1:5173/#/`
- H5 独立站：`http://127.0.0.1:5174/#/?lang=zh`

说明：
- 本轮 H5 回归基于桌面浏览器打开 H5 独立站完成
- 不等同于真实 Android / iPhone 设备实机回归

### 搜索框场景

- 中文拼音输入过程中不误触发搜索
- 候选词未上屏前，`Enter` 不会提前提交
- 候选词完成上屏后，再次 `Enter` 可正常触发搜索
- 快速连续输入后，不会提交旧 suggestion payload
- 中英文混输场景可正常选择并跳转
- 桌面端与 H5 端行为一致

### H5 分享图场景

- 长职业名称未与主视觉、二维码重叠
- 长解读文案未与二维码重叠
- 二维码保持在底部卡片区域，位置稳定
- 牛 / 马五档状态存在清晰差异
- 高分状态更轻松稳定，低分状态更焦虑吃力，方向正确
- 分享图生成按钮实际链路可出图

## 验证记录

### 自动化 / 构建

- 根项目：`npm test`
- 根项目：`npm run build:frontend`
- 根项目：`npm run check:h5-boundary`
- H5 独立项目：`npm run typecheck`
- H5 独立项目：`npm run build`

### 浏览器回归

- 报告：`output/search-regression-report-final.json`
- 视觉截图：`output/h5-share-visual-regression.png`
- 分享图样例：`output/share-mascot-samples/`

### 本轮重点结论

- 桌面端首页中文 IME 搜索最终跳转：
  - `#/occupation/15-1252.00?lang=zh&entry=软件开发工程师`
- H5 首页中文 IME 搜索最终跳转：
  - `#/occupation/15-1252.00?lang=zh&entry=软件开发工程师`
- 快速从旧查询切到新查询后，详情页提交的仍是最新 payload
- 混输 `HR人事` 时，桌面端与 H5 均能命中并进入 `人力资源专员`

## 仍待验证

- 真实 Windows 中文输入法人工敲字回归
- macOS 中文输入法回归
- Android Chrome 实机回归
- iPhone Safari / 微信内 H5 回归
- 真机截图、分享、扫码链路回归
- 更多极端超长职业名 / 超长解读文案样本

## 当前结论

- 桌面端搜索框：可验收
- H5 搜索框：可验收，但建议补一轮真机 IME 回归
- H5 分享图：可验收，但建议补一轮真机截图传播场景回归
