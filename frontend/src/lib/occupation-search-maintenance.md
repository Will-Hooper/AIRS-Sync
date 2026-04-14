# AIRS 中文职业搜索词库维护规范

## 目标

本词库的职责不是做新的职业研究，而是把中国普通用户会输入的职业叫法，稳定映射到现有 AIRS occupation / template / SOC 体系。

维护时优先保证三件事：

1. 常见中文叫法第一次搜索就能搜到。
2. 不把过多泛词、噪音词、职责片段胡乱塞进词库。
3. 补词后不破坏已有高频命中结果。

## 相关文件

- 搜索核心：[occupation-search.ts](/E:/Codex/frontend/src/lib/occupation-search.ts)
- 通用种子：[occupation-search-seeds.ts](/E:/Codex/frontend/src/lib/occupation-search-seeds.ts)
- 中国 P0 种子：[occupation-search-china-p0.ts](/E:/Codex/frontend/src/lib/occupation-search-china-p0.ts)
- 验收样本：[occupation-search-test-cases.ts](/E:/Codex/frontend/src/lib/occupation-search-test-cases.ts)
- 回归测试：[occupation-search.spec.ts](/E:/Codex/frontend/src/lib/__tests__/occupation-search.spec.ts)

## alias 结构

`aliases` 支持两种写法：

1. 纯字符串
   适合最简单、无冲突的常用别名。
2. 结构化对象
   适合需要控制 `aliasType`、`weight`、`source` 的别名。

结构化写法示例：

```ts
{
  alias: "发货的",
  aliasType: "spoken",
  weight: 96,
  source: "seed_manual"
}
```

## 什么词可以入库

- 中国普通用户真实会搜的职业名。
- 招聘网站高频标题。
- 口语表达。
- 任务型表达。
- 常用英文缩写。
- 稳定且高频的错写或误写。

优先补这些词：

- 搜索日志 Top 零结果词。
- 搜索日志里高频但点击率低的词。
- 客服、运营、物流、司机、文职、教育医疗这类高频职业簇的漏词。

## 什么词不要乱加

- 过度泛化、无法指向明确职业簇的词。
- 只描述环境、不描述职业的噪音词。
- 很长的简历句子或招聘 JD 片段。
- 只出现过一次、没有复现的偶发词。
- 会把已有高频词带偏的别名。

不建议直接入库的例子：

- “稳定双休”
- “轻松坐班”
- “不限经验”
- “高薪”

## alias 命名规则

- 优先用中国用户输入法里最自然的写法。
- 保留中文主叫法，不要求学术化。
- 缩写仅在真实高频时加入，如 `hr`、`ui`、`it`。
- 错写只收常见错写，不收一次性乱码。
- 同义但语气不同的词尽量收敛到一个职业簇，不要多 occupation 重复乱挂。

## 一词多义处理

遇到一词多义，按下面顺序判断：

1. 是否存在明显高频主语义。
2. 是否能通过 `weight` 让主语义稳定胜出。
3. 是否更适合放到 `category_fallback`，而不是强绑到单职业。
4. 是否需要保留多个结果，但把同模板/同类目职业放到 alternatives。

例子：

- `运营`：允许主结果落在 `电商运营`，但 alternatives 需要给出 `新媒体运营`、`抖音运营` 等近邻职业。
- `司机`：主结果可先回 `网约车司机`，同时补 `货车司机`、`配送司机`。
- `设计`：不要强求唯一正确答案，重点是不给空结果。

## weight 调整规则

- `90-100`：必须稳定命中的主别名、高频口语词、高频缩写。
- `75-89`：常见招聘站词、常见任务型表达。
- `55-74`：低频补充词、可能与别的职业有冲突的词。

当同一个 `alias_normalized` 指向多个职业时：

- 更符合普通用户直觉的职业提高权重。
- 更偏招聘站术语、职责片段的职业降低权重。
- 如果还是冲突，优先考虑改成 fallback，而不是继续拉高权重。

## 口语词和招聘站词怎么处理

- 口语词：优先 `spoken` 或 `task_based`。
- 招聘站词：优先 `recruitment`。
- 英文缩写：优先 `abbreviation`。
- 错写：优先 `wrong_variant`。

不要把所有词都标成 `common`。类型信息是后续补词审查和校准的重要依据。

## 根据搜索日志补词

每次补词前先看三份清单：

1. Top 零结果词。
2. Top 有结果但未点击词。
3. 用户在无结果页主动提交的反馈词。

补词流程：

1. 看原始 query 和 normalized query。
2. 判断它应该归到哪个现有职业入口。
3. 先尝试补 alias，不新建职业详情页。
4. 如果是泛词，优先补 fallback，而不是新增一个虚假“精确职业”。
5. 补词后运行 `npm run test:search`。
6. 运行 `npm run search:check-seeds` 检查重复和冲突。

## 补词前自检

- 这个词是职业名，还是只是职责片段？
- 这个词会不会误伤另一个更高频职业？
- 这个词是否已经被 normalize 后等价收录？
- 这个词是否应该通过 fallback 解决，而不是种子解决？
- 补进去以后，144 条样本里是否出现主结果回归？

## 变更要求

- 任何新增 alias，都应优先补到结构化对象写法，至少在有冲突风险时如此。
- 任何修改高频职业主别名，都必须同步跑回归测试。
- 新增大类 fallback 时，要确认 alternatives 不会被自动数据的英文长标题污染。
