# AIRS 中国职业搜索补 alias 优先级规则

## 规则总原则

当前阶段的决策顺序固定为：

1. 先补 alias。
2. alias 不够时再调 weight。
3. alias 和 weight 都不能解决时，再判断是否只调 alternatives。
4. 只有持续高频且现有 occupation 无法自然承接时，才记录为“新增 occupation 入口候选”。

当前阶段只记录候选，不进入 P1 扩库。

## 最优先补的词

这几类词优先级最高，周运营里先处理：

- 高频零结果词
- 高频 feedback 词
- 高频口语词
- 高频招聘站词
- 高频但只落到 `no_result` / `category_fallback` 的词

当前项目里，优先补这类表达最有价值：

- 普通用户口语
  例：`招人的`、`做表格的`、`跑外卖的`
- 招聘站标题
  例：`招聘专员`、`运营助理`、`发货专员`
- 平台型职业表达
  例：`做抖音的`、`直播间运营`
- 高流量错写
  例：如果未来 `法物专员` 连续多周出现，就进入补词候选

## 次优先补的词

这几类词放在第二层：

- 有结果但未点击率高的词
- alternatives 中有但主结果不合理的词
- 同义变体很多但覆盖不全的词

这种场景通常不是“完全搜不到”，而是“搜得到但不顺手”。处理顺序仍然是先补 alias，再看是否要调 weight。

## 暂缓处理的词

以下词先留在周报，不急着入库：

- 近 7/14 天只出现 `1` 次的低频词
- 太长的任务句
- 噪音输入
- 明显非职业查询

当前阶段，下面这类词默认暂缓：

- “帮老板处理事情的那种文职”
- “稳定双休轻松坐班”
- “脾气好点就行的工作”
- “塔罗占卜”

## 不要直接入库的词

以下几类词不要直接进 seed：

- 过长整句
- 强情绪词
- 明显非职业词
- 不能稳定映射 occupation 的歧义词

当前项目里，遇到这些词时优先保留在反馈或周报里，不直接入库：

- “钱多事少离家近”
- “不想加班的工作”
- “高薪稳定”
- “适合宝妈”
- “兼职副业”

## 新增 alias 前必须检查的 5 件事

每次新增 alias 前，必须逐项检查：

1. 有没有现成同义 alias
   先查 [occupation-search-seeds.ts](/E:/Codex/frontend/src/lib/occupation-search-seeds.ts) 和 [occupation-search-china-p0.ts](/E:/Codex/frontend/src/lib/occupation-search-china-p0.ts)。
2. 会不会跨 occupation 冲突
   先跑 `npm run search:check-seeds`，看是否会打到已有高频 occupation。
3. 是否属于高频真实表达
   先看 `latest-search-quality.json`、feedback、近 7/14 天原始日志。
4. 能不能稳定归一
   先用 [normalizeOccupationQuery](/E:/Codex/frontend/src/lib/occupation-search.ts) 判断归一后是否仍有清晰语义。
5. 是否值得入库，而不是继续靠 fuzzy / fallback
   如果现有 fuzzy / fallback 已经足够自然，就先不入库。

## 什么时候优先补 alias，而不是调排序

以下情况一律先补 alias：

- 词根本没命中
- 命中了，但只靠 fuzzy 才勉强猜到
- 命中了，但只靠 category fallback 兜底
- 普通用户和招聘站都在高频用这个词

因为这类问题本质是“入口覆盖不够”，不是“排序错了”。

## 什么时候先不补

以下情况本周先不补：

- 低频且只出现一次
- 非职业表达
- 词义非常模糊
- 加进去大概率会误伤另一个更高频职业

例如：

- `顾问`
- `项目`
- `老师傅`

这类词如果没有更清晰上下文，先不要直接入库。

## 当前阶段的落地边界

本规则只指导 P0.5 的补词工作，不做以下动作：

- 不新增独立搜索服务
- 不重写六层匹配主链路
- 不新增大批 occupation 入口
- 不进入 P1 扩库
