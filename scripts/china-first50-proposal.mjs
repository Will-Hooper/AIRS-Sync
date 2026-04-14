import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "output");
const AIRS_PATH = path.join(ROOT, "backend", "data", "airs_data.json");
const MISSING_PATH = path.join(ROOT, "output", "cn_missing_in_airs_v3_clean.csv");
const SUMMARY_PATH = path.join(ROOT, "output", "summary_v3_clean.md");

const p = (item) => item;

const ITEMS = [
  p({ t: "跨境电商运营管理师", d: "跨境电商运营管理师", e: "Cross-Border E-Commerce Operations Manager", s: "13-1161.00", pr: "P0", g: "平台经济", a: ["跨境电商运营", "跨境运营", "跨境店铺运营", "跨境电商运营经理"], r: "平台经济高频搜索词，岗位边界稳定，且中国跨境平台场景无法被传统营销岗位准确承载。", ss: "跨境平台商家与品牌出海团队", sf: "选品上架、投放增长、订单履约与平台规则协同", sc: "跨境平台商家、品牌出海团队和代运营公司", tk: "选品上架、平台投放、店铺增长、订单履约和跨境规则协同", di: "平台规则适配、跨境物流协同和本地化增长运营", pc: "市场营销与流量分析的一部分能力", ms: "普通市场营销专员或传统电商运营" }),
  p({ t: "用户增长运营师", d: "用户增长运营师", e: "User Growth Operations Specialist", s: "13-1161.00", pr: "P0", g: "平台经济", a: ["增长运营", "用户增长", "增长负责人", "流量增长运营"], r: "互联网公司和品牌团队会直接按该岗位名招聘与搜索，职业心智已经独立成型。", ss: "互联网产品与品牌增长团队", sf: "转化实验、漏斗优化、用户分层和留存提升", sc: "互联网产品团队、品牌增长团队和平台商业化部门", tk: "用户分层、漏斗优化、增长实验、转化分析和生命周期运营", di: "以增长指标为核心的实验机制和数据驱动运营闭环", pc: "营销分析与用户研究的一部分能力", ms: "普通市场营销专员" }),
  p({ t: "网约配送员", d: "网约配送员", e: "On-Demand Delivery Rider", s: "43-5021.00", pr: "P0", g: "平台经济", a: ["即时配送员", "同城配送员", "外卖骑手", "配送骑手"], r: "平台型即时配送是中国用户最熟悉的职业之一，搜索量和社会认知都远高于传统信使岗位。", ss: "即时零售与外卖平台履约场景", sf: "平台接单、即时派送、路线执行和履约交付", sc: "外卖平台、即时零售平台和同城配送网络", tk: "平台接单、即时派送、路线执行、用户签收和异常履约处理", di: "平台调度、众包规则、时效履约和即时配送场景", pc: "一般快递与信使递送的线下交付环节", ms: "传统快递员" }),
  p({ t: "民宿管家", d: "民宿管家", e: "Homestay Steward", s: "39-6012.00", pr: "P0", g: "平台经济", a: ["民宿运营管家", "民宿主理人", "民宿运营", "民宿前台管家"], r: "民宿经营已形成稳定职业心智，平台化房态管理与住客体验工作需要独立呈现。", ss: "民宿经营与平台房态管理场景", sf: "房态管理、住客接待、体验服务和平台运营", sc: "民宿经营主体、短租平台和文旅住宿服务场景", tk: "房态管理、住客接待、体验活动协调、差评处理和平台运营", di: "住客体验、房东协同和平台运营一体化职责", pc: "礼宾接待与前台服务的一部分工作", ms: "传统酒店礼宾或前台文员" }),
  p({ t: "供应链管理师", d: "供应链管理师", e: "Supply Chain Manager", s: "13-1081.00", pr: "P0", g: "产业运营", a: ["供应链运营师", "供应链经理", "供应链专员", "供应链规划"], r: "该岗位在制造、零售和电商企业中搜索价值高，且与传统物流师已有明显边界差异。", ss: "制造业、零售与平台供应网络", sf: "采购协同、库存优化、供应计划和网络治理", sc: "制造企业、零售品牌、电商平台和供应网络组织场景", tk: "采购协同、库存优化、供应计划、交付协调和供应网络治理", di: "跨采购、仓储、计划和履约的全链路协同能力", pc: "物流分析与配送组织的部分能力", ms: "传统物流师" }),
  p({ t: "建筑信息模型技术员", d: "BIM技术员", e: "BIM Technician", s: "17-3011.00", pr: "P0", g: "BIM/数字建造", a: ["建筑信息模型师", "BIM工程师", "BIM建模师", "BIM技术员"], r: "BIM 是建筑行业最典型的中文独立搜索词之一，用户不会把它理解为传统制图岗位。", ss: "建筑数字化建模与协同场景", sf: "模型搭建、协同校核、碰撞检查和信息管理", sc: "设计院、施工单位、咨询公司和数字建造平台", tk: "模型搭建、协同校核、碰撞检查、信息管理和交付标准维护", di: "BIM 协同、模型信息治理和多专业联动管理", pc: "建筑制图与图纸表达的一部分工作", ms: "传统建筑与土木制图员" }),
  p({ t: "碳排放管理员", d: "碳排放管理员", e: "Carbon Emissions Administrator", s: "13-1041.00", pr: "P0", g: "双碳/绿色经济", a: ["碳管理师", "碳排放管理", "碳盘查专员", "碳核算管理员"], r: "双碳相关岗位中社会认知最强、传播最广，适合作为中国职业层首批标志性卡片。", ss: "企业碳盘查与履约管理场景", sf: "碳核算、排放监测、履约管理和数据报送", sc: "重点排放企业、第三方咨询机构和绿色治理团队", tk: "碳核算、排放监测、履约管理、数据报送和减排台账维护", di: "碳履约、碳盘查和排放数据治理能力", pc: "合规管理中的部分报送与监测环节", ms: "普通合规官或环境专员" }),
  p({ t: "碳汇计量评估师", d: "碳汇计量评估师", e: "Carbon Sink Measurement and Assessment Specialist", s: "19-2041.00", pr: "P0", g: "双碳/绿色经济", a: ["碳汇评估师", "碳汇计量师", "碳汇核算师", "碳汇项目评估"], r: "该岗位直接连接碳汇项目、生态修复和核算市场，政策与行业讨论度都很高。", ss: "碳汇项目核算与评估场景", sf: "碳汇监测、方法应用、项目评估和核算报告", sc: "林业碳汇项目、生态修复项目和第三方评估机构", tk: "碳汇监测、方法学应用、项目评估、核算报告和项目审查", di: "碳汇方法、生态数据解释和项目价值评估能力", pc: "环境科学观察与评估的一部分能力", ms: "普通环境科学家" }),
  p({ t: "人工智能训练师", d: "人工智能训练师", e: "AI Training Specialist", s: "15-2051.00", pr: "P0", g: "AI/数据新职业", a: ["AI训练师", "数据标注师", "模型训练师", "人工智能标注师"], r: "这是中国 AI 劳动市场里认知最明确的新职业之一，用户不会把它等同于数据科学家。", ss: "模型训练与数据标注场景", sf: "训练集构建、标注质检、模型评测和调优反馈", sc: "大模型团队、智能产品团队和数据标注服务场景", tk: "训练集构建、标注质检、模型评测、反馈优化和训练流程执行", di: "数据标注组织、训练流程协同和模型评测反馈机制", pc: "数据分析与算法工作中的局部环节", ms: "数据科学家" }),
  p({ t: "生成式人工智能系统应用员", d: "生成式AI应用员", e: "Generative AI Application Specialist", s: "15-1252.00", pr: "P0", g: "AI/数据新职业", a: ["AIGC应用员", "生成式AI应用师", "大模型应用专员", "AI应用员"], r: "生成式 AI 已形成明确中文搜索心智，首批上线能显著改善用户检索和产品解释能力。", ss: "大模型落地与业务应用场景", sf: "提示设计、流程接入、业务应用和效果反馈", sc: "企业 AI 落地项目、内容生产场景和业务自动化团队", tk: "提示设计、流程接入、业务应用配置、使用反馈和效果优化", di: "面向业务落地的大模型应用和场景配置能力", pc: "软件开发或系统配置的一部分工作", ms: "普通软件开发工程师" }),
  p({ t: "信息安全测试员", d: "信息安全测试员", e: "Information Security Testing Specialist", s: "15-1212.00", pr: "P0", g: "AI/数据新职业", a: ["安全测试工程师", "渗透测试员", "安全测试专员", "网络安全测试员"], r: "网络安全岗位中文搜索词稳定，安全测试与一般安全分析已形成明显分工。", ss: "网络与应用安全测试场景", sf: "漏洞验证、渗透测试、风险复现和修复反馈", sc: "安全服务团队、企业安全部门和应用上线测试流程", tk: "漏洞验证、渗透测试、风险复现、修复反馈和安全验收支持", di: "测试验证、攻击模拟和问题复现能力", pc: "安全分析中的监测与研判部分", ms: "普通信息安全分析师" }),
  p({ t: "数字孪生应用技术员", d: "数字孪生应用技术员", e: "Digital Twin Application Technician", s: "15-1252.00", pr: "P0", g: "AI/数据新职业", a: ["数字孪生技术员", "数字孪生工程师", "孪生应用工程师", "数字孪生实施"], r: "数字孪生是高识别度中文职业词，首批独立建卡有助于承接产业数字化搜索需求。", ss: "数字孪生建模与场景落地", sf: "数据接入、场景建模、运行映射和应用实施", sc: "工业数字化项目、园区可视化平台和设备运行仿真场景", tk: "数据接入、场景建模、运行映射、系统联调和应用实施", di: "现实系统映射、仿真联动和可视化应用实施能力", pc: "软件开发中的部分系统配置工作", ms: "普通软件开发工程师" }),
  p({ t: "家庭教育指导师", d: "家庭教育指导师", e: "Family Education Guidance Specialist", s: "21-1012.00", pr: "P0", g: "家庭服务", a: ["家庭教育顾问", "家庭教育咨询师", "家教指导师", "亲子教育指导"], r: "家长会直接以该职业名搜索服务，职业对象、场景和社会认知都已独立。", ss: "家庭教育与亲子关系指导场景", sf: "家长指导、养育建议、家庭沟通和成长支持", sc: "家庭教育服务机构、学校延伸服务和社区家庭指导场景", tk: "家长指导、养育建议、家庭沟通、成长支持和家庭教育方案制定", di: "面向家庭关系和养育场景的持续指导能力", pc: "教育咨询中的升学和学校指导部分", ms: "教育升学顾问" }),
  p({ t: "老年人能力评估师", d: "老年人能力评估师", e: "Elderly Functional Assessment Specialist", s: "", pr: "P0", g: "健康照护", a: ["老年能力评估师", "老年评估师", "失能评估师", "养老评估师"], r: "养老与长期照护服务对该岗位有清晰需求，且用户对其独立功能认知非常明确。", ss: "养老评估与照护分级场景", sf: "能力评估、失能分级、照护建议和福利适配", sc: "养老机构、长护险评估、社区照护和老年服务管理场景", tk: "能力评估、失能分级、照护建议、福利适配和评估记录管理", di: "老年功能评估、照护等级判断和服务适配能力", pc: "健康服务中的基础访视或一般照护支持", ms: "普通社区卫生从业人员" }),
  p({ t: "出生缺陷防控咨询师", d: "出生缺陷防控咨询师", e: "Birth Defect Prevention Counselor", s: "29-9092.00", pr: "P0", g: "健康照护", a: ["出生缺陷咨询师", "优生咨询师", "出生缺陷防控", "产前防控咨询"], r: "母婴与生育健康场景中，该岗位拥有清晰服务对象和较高的中文搜索价值。", ss: "优生优育与出生缺陷防控场景", sf: "风险咨询、筛查解读、干预建议和转诊协同", sc: "妇幼保健、产前筛查、遗传风险沟通和健康管理场景", tk: "风险咨询、筛查解读、干预建议、随访转介和防控宣教", di: "面向防控流程的持续咨询和筛查协同能力", pc: "遗传风险沟通中的单点咨询能力", ms: "单纯遗传咨询师" }),
  p({ t: "康复辅助技术咨询师", d: "康复辅助技术咨询师", e: "Assistive Technology Consultant", s: "21-1015.00", pr: "P0", g: "健康照护", a: ["辅具咨询师", "康复辅具咨询师", "辅助技术咨询师", "辅具适配师"], r: "辅具适配与康复服务需求增长明显，该职业的中文检索心智已经独立于一般康复咨询。", ss: "康复辅具评估与适配场景", sf: "需求评估、辅具匹配、使用指导和效果跟踪", sc: "康复机构、辅助器具服务机构和长期照护支持场景", tk: "需求评估、辅具匹配、使用指导、效果跟踪和技术咨询", di: "辅具评估、适配建议和辅助技术方案设计能力", pc: "康复咨询中的一般支持与转介工作", ms: "普通康复咨询师" }),
  p({ t: "农业数字化技术员", d: "农业数字化技术员", e: "Agricultural Digitalization Technician", s: "19-4012.00", pr: "P0", g: "数字农业", a: ["数字农业技术员", "智慧农业技术员", "农业数字化专员", "数字农技员"], r: "数字农业是政策与产业共同推动的新方向，适合作为中国职业层的战略示范卡片。", ss: "智慧农业与数字农事场景", sf: "农业数据采集、设备接入、生产监测和数字服务", sc: "智慧农场、农业平台、数字农服组织和农业物联网场景", tk: "农业数据采集、设备接入、生产监测、平台运维和数字服务实施", di: "农业场景下的数据化实施和设备协同能力", pc: "传统农业技术支持的一部分工作", ms: "普通农业技术员" }),
  p({ t: "区块链应用操作员", d: "区块链应用操作员", e: "Blockchain Application Operator", s: "15-1299.00", pr: "P0", g: "AI/数据新职业", a: ["区块链操作员", "链上应用操作员", "区块链运营专员", "链上业务操作员"], r: "区块链岗位搜索集中在中文职业名上，首批补库能有效承接“链上操作”类需求。", ss: "链上业务部署与操作场景", sf: "节点运维、链上操作、业务配置和异常处理", sc: "区块链平台、链上业务系统和节点运维支持场景", tk: "节点运维、链上操作、业务配置、权限管理和异常处理", di: "链上业务操作和节点运行维护能力", pc: "泛计算机岗位中的部分系统操作工作", ms: "普通计算机从业人员" }),
  p({ t: "电子商务师", d: "电子商务师", e: "E-Commerce Specialist", s: "13-1161.00", pr: "P1", g: "平台经济", a: ["电商运营", "电商专员", "网店运营", "电商经理"], r: "该职业虽然较早出现，但搜索和招聘依然高频，适合作为首批补库中的基础电商岗位。", ss: "平台店铺与电商经营场景", sf: "店铺运营、商品管理、活动投放和转化优化", sc: "电商平台商家、品牌电商团队和代运营机构", tk: "店铺运营、商品管理、活动投放、转化优化和售后协同", di: "平台运营与商品经营的一体化能力", pc: "市场营销分析中的局部工作", ms: "普通营销专员" }),
  p({ t: "连锁经营管理师", d: "连锁经营管理师", e: "Chain Operations Manager", s: "11-1021.00", pr: "P1", g: "平台经济", a: ["连锁运营管理师", "连锁店管理师", "门店连锁管理", "连锁经营"], r: "连锁业态岗位搜索稳定，且中国市场对门店标准化运营有明显职业心智。", ss: "连锁门店与多店运营场景", sf: "门店标准化、加盟协同、经营分析和运营管控", sc: "餐饮连锁、零售连锁和加盟经营管理场景", tk: "门店标准化、加盟协同、经营分析、督导管理和运营管控", di: "多店复制、加盟体系和标准化运营能力", pc: "综合运营管理中的一般管理环节", ms: "普通综合与运营经理" }),
  p({ t: "供应链工程技术人员", d: "供应链工程技术人员", e: "Supply Chain Engineering Technician", s: "17-3026.00", pr: "P1", g: "产业运营", a: ["供应链工程师", "供应链技术员", "供应链工程技术", "供应网络工程"], r: "它比供应链管理师更偏工程实施，适合作为首批补库中的产业升级型岗位。", ss: "供应网络优化与系统协同场景", sf: "流程设计、系统联动、节点优化和交付协同", sc: "制造供应网络、零售供应体系和供应链数字化改造场景", tk: "流程设计、系统联动、节点优化、交付协同和效率分析", di: "供应链工程化设计和系统协同实施能力", pc: "工业流程优化中的部分分析能力", ms: "普通物流分析或工业工程技术员" }),
  p({ t: "调饮师", d: "调饮师", e: "Beverage Mixologist", s: "35-3011.00", pr: "P1", g: "中国新职业", a: ["饮品调制师", "饮品师", "饮品研发师", "奶茶调饮师"], r: "消费服务领域中用户认知度极高，且中文岗位名明显强于传统“调酒师”搜索心智。", ss: "新式饮品门店与产品研发场景", sf: "饮品调制、配方执行、产品出品和风味优化", sc: "新式茶饮品牌、咖饮门店和饮品研发场景", tk: "饮品调制、配方执行、产品出品、风味优化和标准化操作", di: "新式饮品产品线和门店出品体系能力", pc: "传统酒饮调制中的出品技能", ms: "传统调酒师" }),
  p({ t: "家政服务员", d: "家政服务员", e: "Domestic Service Worker", s: "39-9099.00", pr: "P1", g: "家庭服务", a: ["家政员", "家政阿姨", "家庭服务员", "住家家政"], r: "家政服务是中文高频搜索场景，独立呈现可显著改善家庭服务类职业的搜索命中率。", ss: "家庭照料与居家服务场景", sf: "家庭清洁、生活照料、家务协助和入户服务", sc: "住家家政、钟点服务、家庭照料和社区家政服务场景", tk: "家庭清洁、生活照料、家务协助、入户服务和基础家庭支持", di: "入户服务、家庭场景适配和生活协助能力", pc: "泛个人服务中的零散照料工作", ms: "普通个人服务从业人员" }),
  p({ t: "生殖健康咨询师", d: "生殖健康咨询师", e: "Reproductive Health Counselor", s: "29-9092.00", pr: "P1", g: "健康照护", a: ["生殖咨询师", "生殖健康顾问", "生育健康咨询师", "生殖健康指导"], r: "面向生育健康的服务场景清晰，用户会直接以该职业名检索服务和岗位信息。", ss: "生育健康与生殖咨询场景", sf: "风险咨询、方案解释、转诊协同和健康指导", sc: "生殖健康机构、妇幼保健和生育咨询服务场景", tk: "风险咨询、方案解释、转诊协同、健康指导和服务跟进", di: "围绕生育健康全流程的持续咨询能力", pc: "遗传咨询中的单点解释环节", ms: "单纯遗传咨询师" }),
  p({ t: "婚姻家庭辅导师", d: "婚姻家庭辅导师", e: "Marriage and Family Guidance Specialist", s: "21-1019.00", pr: "P1", g: "家庭服务", a: ["婚姻家庭咨询师", "婚姻辅导师", "家庭关系辅导", "婚姻辅导"], r: "家庭关系服务需求明确，中文检索习惯也与一般心理咨询明显不同。", ss: "婚姻关系与家庭沟通辅导场景", sf: "关系评估、沟通辅导、家庭协调和问题干预", sc: "婚姻家庭服务机构、社区家庭支持和关系辅导场景", tk: "关系评估、沟通辅导、家庭协调、问题干预和支持计划制定", di: "以婚姻家庭关系为核心的连续辅导能力", pc: "泛咨询岗位中的一般情绪支持能力", ms: "普通其他咨询师" }),
  p({ t: "孤残儿童护理员", d: "孤残儿童护理员", e: "Orphaned and Disabled Child Care Worker", s: "31-1131.00", pr: "P1", g: "健康照护", a: ["孤残儿童照护员", "特殊儿童护理员", "福利院护理员", "儿童照护员"], r: "服务对象非常清晰，简单并入一般护理辅助会丢失福利机构场景的职业特征。", ss: "福利机构儿童照护场景", sf: "生活照护、康复协助、安全观察和成长支持", sc: "儿童福利机构、特殊儿童照护和长期照护支持场景", tk: "生活照护、康复协助、安全观察、成长支持和机构照护配合", di: "面向孤残儿童的长期照护与福利机构服务能力", pc: "基础护理协助的一般执行工作", ms: "普通护理助理" }),
  p({ t: "人工智能工程技术人员", d: "人工智能工程技术人员", e: "AI Engineering Technician", s: "15-1252.00", pr: "P1", g: "AI/数据新职业", a: ["AI工程师", "人工智能工程师", "AI技术工程师", "人工智能技术员"], r: "用户会以“AI 工程师”直接检索岗位，且其工程化落地职责与数据科学家明显不同。", ss: "模型落地与 AI 系统工程场景", sf: "模型部署、系统集成、接口联调和应用实施", sc: "AI 产品团队、模型平台团队和业务落地实施场景", tk: "模型部署、系统集成、接口联调、应用实施和运行优化", di: "工程化落地、系统集成和业务部署能力", pc: "软件开发或数据建模中的局部能力", ms: "普通软件开发工程师或数据科学家" }),
  p({ t: "数字化解决方案设计师", d: "数字化方案设计师", e: "Digital Solution Designer", s: "41-9031.00", pr: "P1", g: "AI/数据新职业", a: ["解决方案设计师", "数字化顾问", "数字化方案设计师", "方案架构设计师"], r: "该岗位常见于数字化转型项目，是产品、售前和实施之间的重要中国式岗位。", ss: "企业数字化转型与方案设计场景", sf: "需求梳理、方案设计、系统组合和落地协同", sc: "企业数字化项目、软件售前场景和行业解决方案团队", tk: "需求梳理、方案设计、系统组合、客户沟通和落地协同", di: "行业理解、方案组合和落地协同能力", pc: "售前咨询中的部分方案表达工作", ms: "普通销售工程师" }),
  p({ t: "工业互联网工程技术人员", d: "工业互联网工程技术人员", e: "Industrial Internet Engineering Technician", s: "17-2199.00", pr: "P1", g: "AI/数据新职业", a: ["工业互联网工程师", "工业互联网技术员", "工联网工程师", "工业互联网实施"], r: "工业互联网已成为制造业数字化高频职业词，适合首批建立中国职业层入口。", ss: "工业设备联网与平台实施场景", sf: "设备接入、边缘部署、平台配置和系统联调", sc: "工厂数字化项目、工业平台团队和产线联网实施场景", tk: "设备接入、边缘部署、平台配置、系统联调和运行支持", di: "OT/IT 融合实施和工业现场集成能力", pc: "泛工程岗位中的一般系统实施能力", ms: "普通其他工程师" }),
  p({ t: "工业互联网运维员", d: "工业互联网运维员", e: "Industrial Internet Operations and Maintenance Specialist", s: "15-1244.00", pr: "P1", g: "AI/数据新职业", a: ["工业互联网运维", "工业平台运维员", "工联网运维", "工业系统运维"], r: "这是工业互联网落地后的持续岗位，中文搜索心智比普通网络运维更具体。", ss: "工业平台运行与现场运维场景", sf: "系统巡检、连接维护、故障排查和运行保障", sc: "工业互联网平台、工厂连接系统和现场运行保障场景", tk: "系统巡检、连接维护、故障排查、运行保障和版本协同", di: "工业现场连接与平台运行保障能力", pc: "一般网络系统维护工作", ms: "普通网络与计算机系统管理人员" }),
  p({ t: "物联网工程技术人员", d: "物联网工程技术人员", e: "IoT Engineering Technician", s: "17-2199.00", pr: "P1", g: "AI/数据新职业", a: ["物联网工程师", "IoT工程师", "物联网技术员", "物联网系统工程师"], r: "IoT 已形成成熟的中文岗位词，且其工作边界不宜被普通软件岗位替代。", ss: "设备联网与物联应用实施场景", sf: "终端接入、协议调试、平台联动和系统部署", sc: "智能设备项目、物联平台实施和行业数字化方案场景", tk: "终端接入、协议调试、平台联动、系统部署和现场实施", di: "设备接入、协议适配和场景落地能力", pc: "泛工程实施中的系统开发或配置环节", ms: "普通其他工程师" }),
  p({ t: "物联网安装调试员", d: "物联网安装调试员", e: "IoT Installation and Commissioning Technician", s: "49-2022.00", pr: "P1", g: "AI/数据新职业", a: ["物联网调试员", "IoT安装调试员", "智能设备安装调试员", "物联网安装员"], r: "该岗位面向现场实施，用户搜索更接近中文安装调试词，而不是泛设备安装岗位。", ss: "智能设备现场安装调试场景", sf: "设备安装、联网调试、参数配置和交付验收", sc: "智能楼宇、智慧园区、工厂设备联网和现场实施场景", tk: "设备安装、联网调试、参数配置、问题排查和交付验收", di: "现场接入、联网调试和设备交付能力", pc: "电信设备安装中的部分接入工作", ms: "普通电信设备安装员与维修工" }),
  p({ t: "大数据工程技术人员", d: "大数据工程技术人员", e: "Big Data Engineering Technician", s: "15-2051.00", pr: "P1", g: "AI/数据新职业", a: ["大数据工程师", "数据工程师", "大数据技术员", "数据平台工程师"], r: "数据工程方向在中文招聘与搜索中非常稳定，值得作为 AI/数据层的基础职业卡片。", ss: "数据平台与数据管道建设场景", sf: "数据接入、清洗建模、平台维护和任务调度", sc: "数据中台、分析平台和业务数据工程建设场景", tk: "数据接入、清洗建模、平台维护、任务调度和数据服务支持", di: "数据基础设施建设与管道治理能力", pc: "数据分析中的建模和处理环节", ms: "普通数据科学家" }),
  p({ t: "数据安全工程技术人员", d: "数据安全工程技术人员", e: "Data Security Engineering Technician", s: "15-1212.00", pr: "P1", g: "AI/数据新职业", a: ["数据安全工程师", "数据安全技术员", "数据安全专员", "数据合规安全"], r: "数据安全已成为独立治理主题，用户不会把它简单等同于网络安全分析。", ss: "数据安全治理与防护场景", sf: "分级分类、访问控制、脱敏治理和风险处置", sc: "企业数据治理、安全合规和数据平台防护场景", tk: "分级分类、访问控制、脱敏治理、风险处置和审计支撑", di: "以数据资产为核心的安全治理能力", pc: "一般信息安全中的监测与分析工作", ms: "普通信息安全分析师" }),
  p({ t: "智能制造工程技术人员", d: "智能制造工程技术人员", e: "Intelligent Manufacturing Engineering Technician", s: "17-3026.00", pr: "P1", g: "AI/数据新职业", a: ["智能制造工程师", "智能制造技术员", "智能制造实施工程师", "智能制造系统工程师"], r: "智能制造是制造业升级中的高频岗位词，职业边界已经明显区别于一般工业工程或设备维护。", ss: "产线数字化与智能制造改造场景", sf: "产线集成、系统联调、工艺协同和制造数字化实施", sc: "工厂数字化改造、产线升级项目和智能制造平台实施场景", tk: "产线集成、系统联调、工艺协同、制造数字化实施和运行优化", di: "制造系统集成、产线协同和智能化落地能力", pc: "工业流程优化中的部分工程分析能力", ms: "普通工业工程技术员" }),
  p({ t: "工业机器人系统运维员", d: "工业机器人系统运维员", e: "Industrial Robot Systems O&M Technician", s: "17-3024.00", pr: "P1", g: "AI/数据新职业", a: ["工业机器人运维员", "机器人运维工程师", "工业机器人维护员", "机器人系统运维"], r: "机器人系统运维是智能工厂中的独立岗位，用户不会把它简单理解为一般设备维修工。", ss: "工业机器人产线运行保障场景", sf: "设备巡检、程序联调、故障排查和系统维护", sc: "机器人工作站、自动化产线和智能工厂运维场景", tk: "设备巡检、程序联调、故障排查、备件维护和系统运行保障", di: "机器人系统级维护、联调和现场恢复能力", pc: "机电设备维护中的部分维修环节", ms: "普通工业机械维修工" }),
  p({ t: "工业视觉系统运维员", d: "工业视觉系统运维员", e: "Industrial Vision Systems O&M Technician", s: "17-3024.00", pr: "P1", g: "AI/数据新职业", a: ["机器视觉运维员", "工业视觉运维", "视觉系统维护员", "机器视觉工程师"], r: "机器视觉已形成明确产业用语，其现场运维职责与普通自动化维护岗位存在稳定边界。", ss: "工业视觉检测与识别系统场景", sf: "相机标定、算法联调、故障排查和运行维护", sc: "机器视觉检测线、自动化质检场景和视觉识别系统实施现场", tk: "相机标定、算法联调、故障排查、参数维护和运行保障", di: "视觉系统调试、检测精度维护和现场识别联动能力", pc: "自动化设备维护中的部分调试工作", ms: "普通机电维护或一般质检人员" }),
  p({ t: "智能制造系统运维员", d: "智能制造系统运维员", e: "Intelligent Manufacturing Systems O&M Technician", s: "17-3024.00", pr: "P1", g: "AI/数据新职业", a: ["智能制造运维员", "智能工厂运维员", "制造系统运维", "智能制造维护工程师"], r: "该岗位承接智能工厂持续运行，职责覆盖系统、设备和现场协同，不宜退化成单一设备维修。", ss: "智能工厂系统运行保障场景", sf: "系统巡检、设备联动、异常处理和运行优化", sc: "智能工厂、数字车间和产线控制系统运行保障场景", tk: "系统巡检、设备联动、异常处理、运行优化和跨系统协同维护", di: "制造系统整体运行保障和现场协同能力", pc: "设备检修或 IT 运维中的局部维护能力", ms: "普通设备维修工或网络运维员" }),
  p({ t: "智能网联汽车测试员", d: "智能网联汽车测试员", e: "Intelligent Connected Vehicle Test Technician", s: "15-1253.00", pr: "P1", g: "AI/数据新职业", a: ["智能汽车测试员", "智能网联测试工程师", "自动驾驶测试员", "车联网测试员"], r: "智能网联汽车测试是汽车智能化中的高辨识岗位，用户不会把它等同于普通软件测试。", ss: "智能网联汽车功能验证场景", sf: "功能测试、道路验证、数据记录和缺陷反馈", sc: "整车厂、智能驾驶团队和车联网系统验证场景", tk: "功能测试、道路验证、数据记录、缺陷反馈和测试流程执行", di: "车端系统验证、道路场景测试和整车协同能力", pc: "软件测试中的用例执行与缺陷记录能力", ms: "普通软件测试员" }),
  p({ t: "建筑节能减排咨询师", d: "建筑节能减排咨询师", e: "Building Energy-Saving and Emissions-Reduction Consultant", s: "17-3025.00", pr: "P1", g: "双碳/绿色经济", a: ["建筑节能咨询师", "建筑减碳咨询师", "建筑节能顾问", "绿色建筑咨询师"], r: "建筑减碳与绿色建筑项目推动了稳定岗位需求，该职业比一般工程咨询更贴近中国政策和项目实践。", ss: "绿色建筑与建筑节能改造场景", sf: "能耗评估、节能方案、减排咨询和项目协同", sc: "绿色建筑咨询、建筑节能改造和园区低碳项目场景", tk: "能耗评估、节能方案、减排咨询、项目协同和实施跟踪", di: "建筑场景下的节能改造和减排方案整合能力", pc: "环境工程支持中的局部分析工作", ms: "普通环境工程技术员或销售工程师" }),
  p({ t: "建筑幕墙设计师", d: "建筑幕墙设计师", e: "Building Curtain Wall Designer", s: "17-3011.00", pr: "P1", g: "BIM/数字建造", a: ["幕墙设计师", "幕墙工程设计师", "建筑幕墙工程师", "幕墙设计"], r: "幕墙设计在中国建筑市场有稳定岗位认知和项目场景，不宜被泛化为普通制图或装饰设计。", ss: "建筑幕墙专项设计场景", sf: "系统深化、节点设计、材料选型和施工配合", sc: "幕墙专项设计院、幕墙工程公司和建筑外立面项目场景", tk: "系统深化、节点设计、材料选型、施工配合和图纸交付", di: "幕墙系统构造设计和专项落地协同能力", pc: "建筑制图中的图纸表达环节", ms: "普通建筑制图员或装饰设计师" }),
  p({ t: "装配式建筑施工员", d: "装配式建筑施工员", e: "Prefabricated Building Construction Technician", s: "49-9095.00", pr: "P1", g: "BIM/数字建造", a: ["装配式施工员", "装配式建筑安装员", "装配式建造施工员", "预制装配施工员"], r: "装配式建造已形成中国建筑行业的独立施工场景，用户不会把它理解为一般安装工。", ss: "装配式建筑现场施工场景", sf: "构件吊装、现场拼装、工序协调和质量控制", sc: "装配式住宅、工业化建造项目和预制构件施工现场", tk: "构件吊装、现场拼装、工序协调、质量控制和施工记录管理", di: "装配式施工组织、构件协同和现场装配能力", pc: "成品建筑安装中的局部安装环节", ms: "普通活动房安装员" }),
  p({ t: "智能网联汽车装调运维员", d: "智能网联汽车装调运维员", e: "Intelligent Connected Vehicle Assembly, Commissioning and O&M Technician", s: "17-3024.00", pr: "P2", g: "AI/数据新职业", a: ["智能网联汽车运维员", "智能汽车装调员", "车联网装调运维", "智能汽车装调工程师"], r: "它覆盖车端装调、标定和运行保障，是智能网联汽车产业链中的独立实施岗位。", ss: "智能网联汽车装调与运维场景", sf: "装配调试、参数标定、故障处理和运行保障", sc: "整车测试基地、智能驾驶样车装调和车联网运维保障场景", tk: "装配调试、参数标定、故障处理、运行保障和现场问题闭环", di: "车端装调、标定和持续运行保障能力", pc: "机电调试或一般设备维护中的局部工作", ms: "普通机电技术员" }),
  p({ t: "虚拟现实工程技术人员", d: "虚拟现实工程技术人员", e: "Virtual Reality Engineering Technician", s: "15-1252.00", pr: "P2", g: "AI/数据新职业", a: ["VR工程师", "虚拟现实工程师", "VR技术工程师", "沉浸式技术工程师"], r: "VR 在教育、文旅和工业仿真中已有清晰应用，岗位名称也具有稳定搜索价值。", ss: "虚拟现实内容与系统开发场景", sf: "场景构建、交互实现、设备联调和体验优化", sc: "VR 内容制作、沉浸式体验项目和工业仿真开发场景", tk: "场景构建、交互实现、设备联调、性能优化和项目实施", di: "沉浸式场景开发、终端适配和交互实现能力", pc: "软件开发中的一般前端或图形实现工作", ms: "普通软件开发工程师" }),
  p({ t: "虚拟现实产品设计师", d: "虚拟现实产品设计师", e: "Virtual Reality Product Designer", s: "15-1255.00", pr: "P2", g: "AI/数据新职业", a: ["VR产品设计师", "沉浸式产品设计师", "虚拟现实交互设计师", "VR交互设计师"], r: "该岗位面向沉浸式交互和空间体验设计，职业边界明显区别于传统平面或网页设计。", ss: "沉浸式产品与空间交互设计场景", sf: "交互设计、体验流程、内容结构和终端适配", sc: "VR 产品团队、沉浸式展陈项目和交互体验设计场景", tk: "交互设计、体验流程、内容结构、终端适配和用户测试协同", di: "空间交互、沉浸式体验和 VR 产品设计能力", pc: "数字界面设计中的部分交互表达工作", ms: "普通网页与数字界面设计师" }),
  p({ t: "碳管理工程技术人员", d: "碳管理工程技术人员", e: "Carbon Management Engineering Technician", s: "17-3025.00", pr: "P2", g: "双碳/绿色经济", a: ["碳管理工程师", "碳管理技术员", "碳减排工程师", "碳治理工程技术"], r: "该岗位兼具工程实施和碳治理属性，适合作为双碳职业族群中的第二梯队重点补库对象。", ss: "企业减碳实施与碳管理场景", sf: "碳核算、减排项目、数据治理和履约协同", sc: "工业企业减碳项目、绿色咨询和碳管理实施场景", tk: "碳核算、减排项目、数据治理、履约协同和实施跟踪", di: "碳治理实施、项目工程化和排放数据闭环能力", pc: "环境工程支持中的局部监测或分析工作", ms: "普通环境工程技术员" }),
  p({ t: "储能电站运维管理员", d: "储能电站运维管理员", e: "Energy Storage Plant O&M Administrator", s: "51-8013.00", pr: "P2", g: "双碳/绿色经济", a: ["储能运维管理员", "储能电站运维", "储能站运维员", "储能电站管理员"], r: "新型电力系统建设带来稳定岗位需求，该岗位已明显区别于一般发电站值守或设备维修。", ss: "储能电站运行与维护场景", sf: "运行监控、调度协同、故障处理和安全管理", sc: "储能电站、源网荷储项目和电力运行保障场景", tk: "运行监控、调度协同、故障处理、安全管理和运维记录维护", di: "储能场站运行管理和电力系统协同能力", pc: "电站值守或设备维修中的局部运行工作", ms: "普通电力植物操作员" }),
  p({ t: "电力交易员", d: "电力交易员", e: "Electricity Trader", s: "51-8012.00", pr: "P2", g: "双碳/绿色经济", a: ["电力市场交易员", "电力交易专员", "售电交易员", "电力现货交易员"], r: "电力市场化改革后，该岗位已有明显独立认知和招聘需求，用户不会把它理解为一般调度员。", ss: "电力市场交易与结算场景", sf: "报价申报、交易策略、结算分析和市场协同", sc: "售电公司、电力现货市场和能源交易运营场景", tk: "报价申报、交易策略、结算分析、市场协同和风险跟踪", di: "电力市场规则理解和交易执行能力", pc: "电网调度中的部分时序与资源协调能力", ms: "普通电力分配与调度员" }),
  p({ t: "电力聚合运营员", d: "电力聚合运营员", e: "Power Aggregation Operations Specialist", s: "51-8012.00", pr: "P2", g: "双碳/绿色经济", a: ["聚合运营员", "虚拟电厂运营员", "电力聚合调度员", "聚合资源运营"], r: "虚拟电厂和聚合运营正在形成独立岗位名称，适合作为绿色电力新职业的早期入口。", ss: "虚拟电厂与分布式资源聚合场景", sf: "资源接入、调度协同、收益运营和响应执行", sc: "虚拟电厂平台、负荷聚合项目和分布式能源运营场景", tk: "资源接入、调度协同、收益运营、需求响应执行和平台运行管理", di: "分布式资源聚合和市场化运营能力", pc: "电力调度中的局部资源协调工作", ms: "普通电力分配与调度员" }),
  p({ t: "能源管理工程技术人员", d: "能源管理工程技术人员", e: "Energy Management Engineering Technician", s: "17-2081.00", pr: "P2", g: "双碳/绿色经济", a: ["能源管理工程师", "能源管理技术员", "节能管理工程师", "能源优化工程师"], r: "能源管理已从通用管理工作演进为技术密集岗位，值得作为绿色转型方向的基础卡片储备。", ss: "建筑与工业能效管理场景", sf: "能耗监测、节能优化、系统诊断和项目实施", sc: "工业节能改造、楼宇能效管理和综合能源服务项目场景", tk: "能耗监测、节能优化、系统诊断、项目实施和运行跟踪", di: "能效诊断、节能实施和能源系统协同能力", pc: "环境工程中的部分节能分析工作", ms: "普通环境工程师或一般能源管理员" }),
];

function splitCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      values.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  values.push(current);
  return values;
}

function parseCsv(text) {
  const rows = [];
  let current = "";
  let row = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        current += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(current);
      current = "";
    } else if (ch === "\n") {
      row.push(current);
      rows.push(row);
      row = [];
      current = "";
    } else if (ch !== "\r") {
      current += ch;
    }
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current);
    rows.push(row);
  }

  const [headerRow, ...dataRows] = rows;
  const header = headerRow.map((value, index) => (index === 0 ? value.replace(/^\uFEFF/, "") : value));
  return dataRows
    .filter((values) => values.some((value) => value !== ""))
    .map((values) => Object.fromEntries(header.map((key, index) => [key, values[index] ?? ""])));
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function writeCsv(filePath, rows, columns) {
  const lines = [columns.join(",")];
  for (const row of rows) {
    lines.push(columns.map((column) => csvEscape(row[column] ?? "")).join(","));
  }
  fs.writeFileSync(filePath, `${lines.join("\n")}\n`, "utf8");
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function dedupe(values) {
  return [...new Set(values.filter(Boolean))];
}

function countBy(rows, key) {
  const counts = new Map();
  for (const row of rows) {
    counts.set(row[key], (counts.get(row[key]) ?? 0) + 1);
  }
  return counts;
}

function parseSummaryStats(text) {
  const read = (label) => {
    const match = text.match(new RegExp(`- ${label}：([0-9]+)`));
    return match ? Number(match[1]) : null;
  };

  return {
    totalCn: read("中国职业总数"),
    exact: read("exact_match"),
    merged: read("merged_match"),
    oneToMany: read("one_to_many"),
    missing: read("missing"),
  };
}

function buildParentIndex(airsData) {
  const occupations = Array.isArray(airsData) ? airsData : airsData.occupations ?? [];
  return new Map(
    occupations
      .map((item) => [item.socCode ?? item.soc_code ?? item.onetCode ?? "", item])
      .filter(([code]) => code),
  );
}

function formatParentTitle(parent) {
  if (!parent) {
    return "";
  }
  const zh = parent.titleZh?.trim();
  const en = parent.title?.trim();
  if (zh && en && zh !== en) {
    return `${zh} / ${en}`;
  }
  return zh || en || "";
}

function formatParentDisplay(parent) {
  if (!parent) {
    return "—";
  }
  const title = parent.titleZh || parent.title || parent.socCode;
  return `${title}（${parent.socCode}）`;
}

function finalizeLength(text, min, max, extraText) {
  let result = text;
  if (result.length < min && extraText) {
    result = `${result}${extraText}`;
  }
  return result;
}

function assertLengthRange(title, fieldName, text, min, max) {
  if (text.length < min || text.length > max) {
    throw new Error(`${title} 的 ${fieldName} 长度为 ${text.length}，不在 ${min}-${max} 范围内。`);
  }
}

function buildIntroShort(item) {
  let text = `${item.d}主要活跃在${item.ss}，负责${item.sf}等工作，用户搜索心智独立，适合在中国职业层首批独立上线。`;
  if (text.length > 80) {
    text = `${item.d}面向${item.ss}，负责${item.sf}等工作，用户搜索心智独立，适合在中国职业层首批独立上线。`;
  }
  text = finalizeLength(text, 50, 80, "该岗位已具备稳定的中文职业认知。");
  assertLengthRange(item.t, "intro_short", text, 50, 80);
  return text;
}

function buildIntroLong(item, parent) {
  const parentTitle = parent ? `AIRS中的“${parent.titleZh || parent.title}”` : "AIRS 现有宽泛职业";
  let text;
  if (parent) {
    text = `${item.d}通常出现在${item.sc}中，核心工作包括${item.tk}。它与${parentTitle}存在部分能力交叉，但后者主要承接${item.pc}，无法完整表达${item.di}。由于该岗位在中国市场已有稳定招聘名称和独立使用场景，若不独立建卡，前端容易把它误解为${item.ms}。`;
    if (text.length > 200) {
      text = `${item.d}通常出现在${item.sc}中，核心工作包括${item.tk}。虽然它与${parentTitle}存在局部交叉，但后者主要覆盖${item.pc}，仍不足以表达${item.di}。由于该岗位在中国市场已有稳定招聘名称和使用场景，首批补库更适合独立建卡。`;
    }
  } else {
    text = `${item.d}通常出现在${item.sc}中，核心工作包括${item.tk}。AIRS 当前只有若干宽泛职业能零散覆盖${item.pc}，仍无法稳定表达${item.di}。由于该岗位在中国市场已有稳定招聘名称、明确服务对象和独立使用场景，首批补库更适合直接作为中国职业独立建卡。`;
    if (text.length > 200) {
      text = `${item.d}通常出现在${item.sc}中，核心工作包括${item.tk}。AIRS 现有职业只能零散覆盖${item.pc}，无法稳定表达${item.di}。由于该岗位在中国市场已形成独立使用场景和招聘名称，首批补库更适合直接独立建卡。`;
    }
  }
  text = finalizeLength(text, 120, 200, "同时也更利于前端搜索、关系说明和用户理解。");
  assertLengthRange(item.t, "intro_long", text, 120, 200);
  return text;
}

function buildWhyNotMerged(item, parent) {
  if (parent) {
    return `如果直接并入AIRS“${parent.titleZh || parent.title}”，只能表达${item.pc}，无法体现${item.di}，前端和用户更容易把该职业理解成${item.ms}。`;
  }
  return `AIRS 现有通用职业只能零散覆盖${item.pc}，无法稳定体现${item.di}，继续并入会让前端和用户把它理解成${item.ms}。`;
}

function buildProposalMarkdown(rows, stats) {
  const priorityCounts = countBy(rows, "priority");
  const trackCounts = [...countBy(rows, "track").entries()].sort((a, b) => b[1] - a[1]);
  const lines = [
    "# AIRS 中国职业层首批补库建议稿（前 50）",
    "",
    "## 提案范围",
    "- 本稿严格基于 `v3_clean` 结果，只从 `cn_missing_in_airs_v3_clean.csv` 中筛选首批 50 个中国职业。",
    "- 本批不追求方向平均分布，优先选择搜索价值高、独立社会认知强、传播性强、前端不宜继续隐藏在 AIRS 泛职业之下的职业。",
    "- 本批 50 个职业全部建议 `should_create_independent_card = true`，不建议用 `merged` 方式直接上线。",
    "",
    "## 基础盘点",
    `- v3_clean 总体结果：中国职业总数 ${stats.totalCn ?? "—"}，exact_match ${stats.exact ?? "—"}，merged_match ${stats.merged ?? "—"}，one_to_many ${stats.oneToMany ?? "—"}，missing ${stats.missing ?? "—"}。`,
    `- 本批优先级分布：P0 ${priorityCounts.get("P0") ?? 0} 个，P1 ${priorityCounts.get("P1") ?? 0} 个，P2 ${priorityCounts.get("P2") ?? 0} 个。`,
    `- 本批方向分布：${trackCounts.map(([track, count]) => `${track} ${count} 个`).join("；")}。`,
    "",
    "## 入选原则",
    "- 优先纳入平台经济、电商/直播/内容、双碳/绿色经济、BIM/数字建造、AI/数据新职业、健康照护、家庭服务和中国新职业。",
    "- 若职业已在中国市场形成稳定招聘词、服务词或用户搜索词，即使能找到某个 AIRS 邻近职业，也优先保留独立建卡。",
    "- 推荐挂靠 AIRS 主职业只用于建立关系说明和卡片跳转，不代表该职业已经被 AIRS 充分覆盖。",
    "",
    "## 前 50 总表",
    "",
    "| priority | cn_code | cn_title_display | en_title_recommended | track | recommended_parent | should_create_independent_card | reason |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |",
  ];

  for (const row of rows) {
    lines.push(
      `| ${row.priority} | ${row.cn_code} | ${row.cn_title_display} | ${row.en_title_recommended} | ${row.track} | ${row.parent_display_md} | ${row.should_create_independent_card} | ${row.reason} |`,
    );
  }

  for (const priority of ["P0", "P1", "P2"]) {
    const group = rows.filter((row) => row.priority === priority);
    lines.push("", `## ${priority} 详细说明（${group.length} 个）`, "");
    group.forEach((row, index) => {
      lines.push(`### ${index + 1}. ${row.cn_title_display}`);
      lines.push(`- 中国职业代码：${row.cn_code}`);
      lines.push(`- 建议英文名：${row.en_title_recommended}`);
      lines.push(`- 推荐挂靠 AIRS 主职业：${row.parent_display_md}`);
      lines.push(`- 搜索别名：${JSON.parse(row.search_aliases).join("、")}`);
      lines.push(`- 短介绍：${row.intro_short}`);
      lines.push(`- 长介绍：${row.intro_long}`);
      lines.push(`- 不应简单并入：${row.why_not_merged}`);
      lines.push(`- 入选原因：${row.reason}`);
      lines.push("");
    });
  }

  return `${lines.join("\n").trim()}\n`;
}

function buildSchemaDesignMarkdown() {
  return `# AIRS 中国职业层数据库字段方案

## 设计目标

- 在不破坏现有 AIRS 主职业表结构的前提下，新增一层“中国职业”数据，用来承接中国独立职业名、别名、搜索入口和映射说明。
- 既支持独立建卡，也支持 merged 和 one-to-many 的跳转型记录，避免以后重复改表。
- 让产品、搜索、后台审核和后续批量补库都能复用同一套主表。

## 建议主表

表名建议：\`china_occupations\`

| 字段 | 建议类型 | 必填 | 示例 | 说明 |
| --- | --- | --- | --- | --- |
| id | bigint / uuid | 是 | 100001 | 中国职业层主键。若现有 AIRS 用 bigint，建议继续沿用 bigint。 |
| cn_code | varchar(32) | 是 | 4-01-06-03 | 中国职业代码，建议唯一。 |
| cn_title | varchar(128) | 是 | 跨境电商运营管理师 | 原始中文职业名。 |
| en_title | varchar(256) | 否 | Cross-Border E-Commerce Operations Manager | 产品侧推荐英文名。 |
| aliases_json | json / jsonb | 是 | ["跨境电商运营","跨境运营"] | 中文搜索别名、常见缩写、倒装写法。 |
| mapped_soc_code | varchar(16) | 否 | 13-1161.00 | 推荐挂靠的 SOC 代码；没有可信父职业时可为空。 |
| mapped_airs_id | bigint | 否 | 867 | AIRS 内部职业 ID；若当前 AIRS 只稳定暴露 SOC，可先允许为空，后续补回。 |
| mapping_type | varchar(32) | 是 | independent_card | 中国职业与 AIRS 的关系类型。 |
| independent_card_flag | boolean | 是 | true | 是否独立建卡。 |
| priority | varchar(8) | 是 | P0 | 首批补库优先级。 |
| status | varchar(32) | 是 | reviewed | 数据状态，支持审核和上线流转。 |
| intro_short | varchar(256) | 否 | 50-80字摘要 | 列表页、搜索结果、卡片摘要。 |
| intro_long | text | 否 | 120-200字介绍 | 详情页长介绍。 |
| notes | text | 否 | 为什么不应简单并入现有职业 | 审核备注、映射解释、产品说明都放这里。 |
| created_at | timestamp | 是 | 2026-04-14 10:00:00 | 创建时间。 |
| updated_at | timestamp | 是 | 2026-04-14 10:00:00 | 最后更新时间。 |

## 推荐枚举

### mapping_type

- \`independent_card\`：应单独展示中国职业卡片。
- \`merged_redirect\`：不独立建卡，只展示映射说明并跳转到 AIRS 主职业。
- \`one_to_many_redirect\`：一个中国职业需要拆到多个 AIRS 主职业，先展示说明页或分流页。
- \`exact_linked\`：与 AIRS 主职业高度一致，直接复用 AIRS 卡片，但保留中国职业入口。

### status

- \`draft\`：初始导入或机器建议。
- \`reviewed\`：人工复核通过，待产品确认。
- \`ready\`：已可进入开发联调。
- \`online\`：已前台发布。
- \`archived\`：历史停用或合并后归档。

## 建议扩展字段

如果后续要把中国职业层真正做成长期资产，建议补以下字段：

| 字段 | 建议类型 | 用途 |
| --- | --- | --- |
| source_version | varchar(64) | 记录对应的《国家职业分类大典》版本或来源批次。 |
| source_definition | text | 保存中国职业原始定义，方便审核对照。 |
| relation_explainer | text | 用于前端展示“与 AIRS 主职业的关系说明”。 |
| why_not_merged | text | 用于前端展示“为什么不直接并入”。 |
| search_boost | integer | 搜索排序加权，如 P0 设为更高分。 |
| launch_batch | varchar(32) | 标识 first50、second100 等批次。 |

## 表关系建议

- \`china_occupations.mapped_soc_code\` 关联 AIRS 主职业表中的 \`socCode\`。
- 若 AIRS 已有内部职业主键，建议同步写入 \`mapped_airs_id\`，前端跳转优先用内部 ID，SOC 作为可读锚点。
- merged 和 one-to-many 场景建议再建一张 \`china_occupation_mappings\` 子表，避免一个中国职业只允许挂一个父职业。

## 索引建议

- 唯一索引：\`cn_code\`
- 普通索引：\`mapped_soc_code\`
- 组合索引：\`status, priority\`
- 全文或检索索引：\`cn_title + aliases_json\`

## 落地建议

- 第一阶段先落主表，满足独立建卡和搜索命中。
- 第二阶段增加映射子表，支持 one-to-many 和更复杂的关系说明。
- 第三阶段把审核流、搜索埋点和产品配置接入后台，形成持续补库机制。
`;
}

function buildSearchStrategyMarkdown(rows) {
  const p0Examples = rows
    .filter((row) => row.priority === "P0")
    .slice(0, 8)
    .map((row) => row.cn_title_display)
    .join("、");

  return `# AIRS 中国职业层搜索与展示策略

## 目标

- 用户搜索中国职业名时，优先命中中国职业层，而不是直接掉到 AIRS 的英文 SOC 职业。
- 对独立建卡职业，直接进入中国职业详情页。
- 对 merged 职业，只展示映射说明并跳转 AIRS 主职业，避免用户误以为 AIRS 已原生覆盖。
- 对 one-to-many 职业，先展示关系说明，再给出推荐去向。

## 搜索归一化规则

进入检索前，统一做以下处理：

1. 去首尾空格、多余空格和标点差异。
2. 去括号及括号内修饰词，如“（高级）”“(试行)”。
3. 统一全角半角、大小写、常见连字符。
4. 统一常见职业别名，如“BIM技术员/建筑信息模型技术员”“AIGC应用员/生成式AI应用员”“外卖骑手/网约配送员”。
5. 对中文简称做反向扩展，如“AI工程师”“VR设计师”“碳管理师”“跨境运营”。

## 检索优先级

建议按以下顺序执行：

1. 中国职业层 \`cn_title\` 精确匹配。
2. 中国职业层 \`aliases_json\` 精确匹配。
3. 中国职业层前缀匹配与分词匹配。
4. 中国职业层模糊匹配与同义词扩展。
5. 若中国职业层未命中，再进入 AIRS 主职业搜索。

## 排序规则

- 精确命中 \`cn_title\` 最高。
- 精确命中别名次高。
- P0 比 P1、P2 额外加权。
- 独立建卡职业优先于 merged 跳转职业。
- 若查询词明显属于中国新职业或中文平台岗位，如 ${p0Examples}，强制优先展示中国职业层结果。

## 结果路由规则

### 1. independent_card

- 搜索结果直接进入中国职业独立卡片页。
- 详情页显示中国职业主信息，并展示推荐挂靠的 AIRS 主职业作为“相关主职业”。

### 2. merged_redirect

- 搜索结果先展示中国职业名和一句映射说明。
- 点击后进入过渡页或侧边说明层，明确告诉用户“该职业当前并入 AIRS 主职业展示”。
- 用户确认后跳转到 AIRS 主职业卡片。

### 3. one_to_many_redirect

- 搜索结果进入中国职业说明页。
- 页面顶部解释“该中国职业涉及多个 AIRS 主职业”。
- 页面中部给出 2-3 个推荐 AIRS 去向，并说明各自适用场景。

### 4. exact_linked

- 搜索仍允许用中国职业名命中。
- 点击后可直接落到 AIRS 主职业详情页，但页面顶部保留“中国职业入口说明”。

## 中国职业详情页必备模块

页面上至少展示：

- 中国职业名
- 推荐挂靠的 AIRS 主职业
- 为什么单独展示 / 为什么映射
- 搜索别名
- 与 AIRS 主职业的关系说明
- 简介短文与长文

## 页面展示建议

### 独立建卡页

- 顶部主标题：\`中国职业名\`
- 副标题：\`建议英文名\`
- 状态标签：\`中国职业层\`、\`P0/P1/P2\`
- 关系卡片：\`推荐挂靠 AIRS 主职业：xxx（SOC）\`
- 解释卡片 1：\`为什么单独展示\`
- 解释卡片 2：\`为什么不直接并入现有 AIRS 职业\`
- 搜索别名区：列出常见中文搜索词

### merged 跳转页

- 顶部展示中国职业名
- 中部说明“该职业当前按 AIRS 主职业统一展示”
- 明确写出映射到哪个 AIRS 主职业，以及为什么暂不独立建卡
- 提供“查看 AIRS 主职业”主按钮

## 推荐交互文案

- 独立建卡：\`这是中国职业层中的独立职业卡片，便于承接中国市场常用职业名和搜索习惯。\`
- merged 映射：\`该职业当前未单独建卡，现阶段按 AIRS 主职业统一展示，以下为映射说明。\`
- one-to-many：\`该中国职业对应多个 AIRS 主职业，请根据工作内容选择更接近的主职业。\`

## 埋点与评估

建议同时记录以下指标：

- 中国职业名搜索量
- 别名命中率
- 独立卡片点击率
- merged 跳转点击率
- zero-result 查询词
- 用户在中国职业页继续跳去 AIRS 主职业的比例

## 首批上线建议

- 首批先覆盖独立认知最强、搜索价值最高的 50 个中国职业。
- 对高频别名先做人工白名单，避免搜索召回不稳定。
- 搜索默认优先中国职业层，只有无命中或用户改搜英文时才回退到 AIRS 主职业层。
`;
}

function priorityRank(priority) {
  return { P0: 0, P1: 1, P2: 2 }[priority] ?? 9;
}

function main() {
  ensureDir(OUTPUT_DIR);

  const missingRows = parseCsv(fs.readFileSync(MISSING_PATH, "utf8"));
  const summaryStats = fs.existsSync(SUMMARY_PATH)
    ? parseSummaryStats(fs.readFileSync(SUMMARY_PATH, "utf8"))
    : {};
  const airsIndex = buildParentIndex(JSON.parse(fs.readFileSync(AIRS_PATH, "utf8")));
  const missingByTitle = new Map(missingRows.map((row) => [row.cn_title, row]));

  if (ITEMS.length !== 50) {
    throw new Error(`ITEMS 长度应为 50，当前为 ${ITEMS.length}。`);
  }

  const seenTitles = new Set();
  const rows = ITEMS.map((item, index) => {
    if (seenTitles.has(item.t)) {
      throw new Error(`候选职业重复：${item.t}`);
    }
    seenTitles.add(item.t);

    const sourceRow = missingByTitle.get(item.t);
    if (!sourceRow) {
      throw new Error(`未在 missing 文件中找到职业：${item.t}`);
    }
    if (sourceRow.match_status !== "missing") {
      throw new Error(`${item.t} 当前不是 missing，而是 ${sourceRow.match_status}`);
    }

    const parent = item.s ? airsIndex.get(item.s) : null;
    if (item.s && !parent) {
      throw new Error(`${item.t} 的推荐父职业 ${item.s} 未在 AIRS 中找到`);
    }

    const searchAliases = dedupe([item.t, item.d, ...item.a]);
    const row = {
      order: index + 1,
      cn_code: sourceRow.cn_code,
      cn_title: item.t,
      cn_title_display: item.d,
      en_title_recommended: item.e,
      recommended_parent_soc_code: item.s,
      recommended_parent_airs_title: formatParentTitle(parent),
      should_create_independent_card: "true",
      priority: item.pr,
      track: item.g,
      reason: item.r,
      search_aliases: JSON.stringify(searchAliases),
      intro_short: buildIntroShort(item),
      intro_long: buildIntroLong(item, parent),
      why_not_merged: buildWhyNotMerged(item, parent),
      parent_display_md: formatParentDisplay(parent),
    };

    return row;
  }).sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority) || a.order - b.order);

  writeCsv(
    path.join(OUTPUT_DIR, "china_occupation_first50_proposal.csv"),
    rows,
    [
      "cn_code",
      "cn_title",
      "cn_title_display",
      "en_title_recommended",
      "recommended_parent_soc_code",
      "recommended_parent_airs_title",
      "should_create_independent_card",
      "priority",
      "track",
      "reason",
      "search_aliases",
      "intro_short",
      "intro_long",
      "why_not_merged",
    ],
  );

  fs.writeFileSync(
    path.join(OUTPUT_DIR, "china_occupation_first50_proposal.md"),
    buildProposalMarkdown(rows, summaryStats),
    "utf8",
  );
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "china_occupation_schema_design.md"),
    buildSchemaDesignMarkdown(),
    "utf8",
  );
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "china_occupation_search_strategy.md"),
    buildSearchStrategyMarkdown(rows),
    "utf8",
  );

  console.log(`Generated ${rows.length} first-batch China occupation proposals.`);
}

main();
