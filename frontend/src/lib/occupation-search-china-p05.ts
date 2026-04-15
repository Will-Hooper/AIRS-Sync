type P05AliasType = "common" | "spoken" | "recruitment" | "task_based" | "abbreviation" | "wrong_variant";

interface P05SearchSeedAliasInput {
  alias: string;
  aliasType?: P05AliasType;
  weight?: number;
  source?: "seed_manual" | "seed_generated" | "log_derived";
}

interface P05SearchSeedEntry {
  id: string;
  occupationId: string;
  label: string;
  labelEn?: string;
  categoryLv1: string;
  categoryLv2: string;
  analysisTemplateId: string;
  searchPriority: number;
  aliases: P05SearchSeedAliasInput[];
}

type AliasBuckets = Partial<Record<P05AliasType, string[]>>;
type P05SeedTuple = [
  id: string,
  occupationId: string,
  label: string,
  labelEn: string,
  categoryLv1: string,
  categoryLv2: string,
  searchPriority: number,
  aliases: AliasBuckets
];

const WEIGHT_BASE: Record<P05AliasType, number> = {
  common: 96,
  recruitment: 92,
  spoken: 86,
  task_based: 84,
  abbreviation: 88,
  wrong_variant: 80
};

function buildAliases(aliases: AliasBuckets) {
  return (Object.entries(aliases) as Array<[P05AliasType, string[]]>).flatMap(([aliasType, values]) =>
    values.map((alias, index) => ({
      alias,
      aliasType,
      weight: Math.max(76, WEIGHT_BASE[aliasType] - index * 2),
      source: "seed_manual" as const
    }))
  );
}

function entry(tuple: P05SeedTuple): P05SearchSeedEntry {
  const [id, occupationId, label, labelEn, categoryLv1, categoryLv2, searchPriority, aliases] = tuple;
  return {
    id: `china-p05:${id}`,
    occupationId,
    label,
    labelEn,
    categoryLv1,
    categoryLv2,
    analysisTemplateId: `soc:${occupationId}`,
    searchPriority,
    aliases: buildAliases(aliases)
  };
}

const P05_SEED_TUPLES: P05SeedTuple[] = [
  ["journalist", "27-3023.00", "记者", "Journalist", "内容", "新闻采编", 128, { common: ["新闻记者", "媒体记者", "采编"], recruitment: ["采访记者", "采编记者", "新闻采编"], spoken: ["跑新闻的", "做采访的"] }],
  ["editor", "27-3041.00", "编辑", "Editor", "内容", "新闻采编", 124, { common: ["文字编辑", "内容编辑", "网站编辑"], recruitment: ["新闻编辑", "公众号编辑", "内容编辑专员"], spoken: ["改稿子的", "做编辑的"] }],
  ["director-editor", "27-2012.00", "编导", "Producer and Director", "内容", "影视制作", 122, { common: ["影视编导", "内容编导", "视频编导"], recruitment: ["电视编导", "节目编导", "短视频编导"], spoken: ["写脚本的", "做节目策划的"] }],
  ["host", "27-3011.00", "主持人", "Broadcast Announcer", "内容", "播音主持", 122, { common: ["节目主持人", "播音主持", "主播主持"], recruitment: ["电台主持人", "电视主持人", "活动主持人"], spoken: ["主持的", "做主持的"] }],
  ["photographer", "27-4021.00", "摄影师", "Photographer", "内容", "影像拍摄", 124, { common: ["人像摄影师", "拍照摄影师", "摄影"], recruitment: ["商业摄影师", "婚礼摄影师", "摄影助理"], spoken: ["拍照片的", "拍照的"] }],
  ["camera-operator", "27-4031.00", "摄像师", "Camera Operator", "内容", "影像拍摄", 124, { common: ["视频摄像师", "摄像", "摄影摄像"], recruitment: ["婚礼摄像师", "活动摄像师", "拍摄助理"], spoken: ["扛摄像机的", "拍摄视频的"], task_based: ["拍视频摄像"] }],
  ["animation-designer", "27-1014.00", "动画设计师", "Animator", "设计", "动画", 100, { common: ["动画师", "动画设计", "动画制作"], recruitment: ["二维动画师", "三维动画师", "动效设计师"], abbreviation: ["3d动画师"], spoken: ["做动画的"] }],
  ["illustrator", "27-1013.00", "插画师", "Illustrator", "设计", "插画", 100, { common: ["插画设计师", "插画设计", "原画插画"], recruitment: ["商业插画师", "绘本插画师", "插画助理"], spoken: ["画插画的", "画画的"] }],
  ["voice-actor", "27-2011.00", "配音员", "Voice Actor", "内容", "播音配音", 120, { common: ["配音演员", "配音师", "声音演员"], recruitment: ["广告配音", "有声书配音", "录音配音"], spoken: ["做配音的", "录声音的"], task_based: ["旁白配音"] }],
  ["post-production-specialist", "27-4032.00", "后期制作师", "Post Production Specialist", "内容", "视频后期", 116, { common: ["后期制作", "影视后期制作", "后期包装"], recruitment: ["影视后期", "视频包装", "后期制作助理"], spoken: ["做后期的", "做视频包装的"] }],

  ["lawyer", "23-1011.00", "律师", "Lawyer", "法律", "律师", 128, { common: ["执业律师", "律师顾问", "法律律师"], recruitment: ["诉讼律师", "非诉律师", "律所律师"], spoken: ["打官司律师", "做律师的"] }],
  ["prosecutor", "23-1023.00", "检察官", "Prosecutor", "法律", "司法", 128, { common: ["公诉人", "检察院检察官", "检察人员"], recruitment: ["检察院工作人员", "检察官助理", "公诉检察官"], spoken: ["做检察的", "在检察院上班的"], wrong_variant: ["检察员"] }],
  ["judge", "23-1023.00", "法官", "Judge", "法律", "司法", 128, { common: ["法院法官", "审判员", "审判法官"], recruitment: ["人民法院法官", "法院审判人员", "法官助理"], spoken: ["做审判的", "在法院判案的"], task_based: ["司法审判"] }],
  ["court-clerk", "43-4031.00", "书记员", "Court Clerk", "法律", "司法辅助", 118, { common: ["法院书记员", "司法书记员", "书记官"], recruitment: ["庭审书记员", "法庭书记员", "法院文员"], spoken: ["做庭审记录的", "庭上记录的"], task_based: ["庭审记录员"] }],
  ["notary", "23-2099.00", "公证员", "Notary", "法律", "司法辅助", 118, { common: ["公证人员", "公证岗", "公证业务"], recruitment: ["公证处工作人员", "公证专员", "公证助理"], spoken: ["办理公证的", "做公证的"] }],
  ["compliance-specialist", "13-1041.00", "合规专员", "Compliance Specialist", "法律", "合规", 120, { common: ["合规", "合规岗", "企业合规"], recruitment: ["风控合规", "内控合规", "合规管理"], spoken: ["做合规的", "管合规的"], task_based: ["合规审查"] }],
  ["ip-specialist", "23-2011.00", "知识产权专员", "Intellectual Property Specialist", "法律", "知识产权", 118, { common: ["知识产权", "知产专员", "知识产权助理"], recruitment: ["商标专员", "专利专员", "版权专员"], abbreviation: ["ip专员"], spoken: ["做专利商标的"] }],
  ["legal-counsel", "23-1011.00", "法律顾问", "Legal Counsel", "法律", "顾问", 116, { common: ["法顾", "合同顾问", "法律咨询师"], recruitment: ["企业法律顾问", "公司法律顾问", "企业法务顾问"], spoken: ["做法律咨询的", "给公司看合同的"], task_based: ["法律咨询顾问"] }],
  ["arbitrator", "23-1022.00", "仲裁员", "Arbitrator", "法律", "仲裁调解", 116, { common: ["仲裁人员", "调解仲裁", "争议仲裁"], recruitment: ["劳动仲裁员", "商事仲裁员", "仲裁秘书"], spoken: ["做仲裁的", "调解纠纷的"] }],
  ["judicial-police", "33-3051.00", "司法警察", "Judicial Police", "公共服务", "司法警务", 120, { common: ["法警", "法院法警", "检察院法警"], recruitment: ["司法警务", "司法警务人员", "司法警察岗位"], spoken: ["做法警的", "法院警察"], task_based: ["警务保障"] }],

  ["primary-school-teacher", "25-2021.00", "小学教师", "Elementary School Teacher", "教育", "中小学", 124, { common: ["小学老师", "小学班主任", "小学任课老师"], recruitment: ["小学语文老师", "小学数学老师", "小学教师编"], spoken: ["教小学生的", "小学教书的"], task_based: ["小学教学"] }],
  ["middle-school-teacher", "25-2022.00", "初中教师", "Middle School Teacher", "教育", "中小学", 122, { common: ["初中老师", "中学教师", "初中班主任"], recruitment: ["初中语文老师", "初中数学老师", "初中教师编"], spoken: ["教初中的", "初中教书的"], task_based: ["初中教学"] }],
  ["high-school-teacher", "25-2031.00", "高中教师", "High School Teacher", "教育", "中小学", 122, { common: ["高中老师", "高中班主任", "高中任课老师"], recruitment: ["高中语文老师", "高中数学老师", "高中教师编"], spoken: ["教高中的", "高中教书的"], task_based: ["高中教学"] }],
  ["college-teacher", "25-1199.00", "大学教师", "College Teacher", "教育", "高校", 120, { common: ["高校教师", "大学老师", "高校老师"], recruitment: ["大学讲师", "高校讲师", "高校教学岗"], spoken: ["教大学的", "大学教书的"], task_based: ["大学任课老师"] }],
  ["teaching-researcher", "25-9031.00", "教研员", "Instructional Coordinator", "教育", "教研", 116, { common: ["教学研究员", "教研老师", "课程教研"], recruitment: ["教研专员", "学科教研员", "教学研发"], spoken: ["做教研的", "研究课程的"], task_based: ["教材教研"] }],
  ["student-counselor", "21-1012.00", "辅导员", "School Counselor", "教育", "学生事务", 116, { common: ["高校辅导员", "大学辅导员", "学工老师"], recruitment: ["学生辅导员", "学生工作老师", "辅导员老师"], spoken: ["做学生工作的", "管学生的"], task_based: ["班级辅导员"] }],
  ["lab-technician", "29-2012.00", "实验员", "Laboratory Technician", "教育", "实验室", 116, { common: ["实验室实验员", "实验室人员", "实验操作员"], recruitment: ["实验室技术员", "实验室助理", "科研实验员"], spoken: ["做实验的", "在实验室上班的"], task_based: ["实验技术岗"] }],
  ["researcher", "19-4061.00", "研究员", "Researcher", "科研", "研究", 116, { common: ["科研人员", "科研工作者", "研究人员"], recruitment: ["课题研究员", "研究助理", "科研助理"], spoken: ["做研究的", "搞科研的"], task_based: ["项目研究员"] }],
  ["librarian", "25-4022.00", "图书管理员", "Librarian", "文化机构", "图书馆", 116, { common: ["图书馆管理员", "图书馆员", "馆员"], recruitment: ["图书馆工作人员", "图书管理", "图书馆文员"], spoken: ["整理图书的", "在图书馆上班的"], task_based: ["借阅管理员"] }],
  ["museum-docent", "39-7011.00", "博物馆讲解员", "Museum Docent", "文化机构", "讲解导览", 116, { common: ["博物馆讲解", "展馆讲解员", "讲解员"], recruitment: ["展厅讲解员", "文博讲解员", "导览员"], spoken: ["做讲解的", "在博物馆讲解的"], task_based: ["博物馆导览"] }],

  ["doctor", "29-1229.00", "医生", "Physician", "医疗", "临床", 128, { common: ["大夫", "医师", "临床医生"], recruitment: ["门诊医生", "住院医生", "医务人员"], spoken: ["看病医生", "做医生的"], task_based: ["临床诊疗"] }],
  ["traditional-chinese-medicine-doctor", "29-1229.00", "中医师", "Traditional Chinese Medicine Doctor", "医疗", "中医", 124, { common: ["中医医生", "中医大夫", "中医"], recruitment: ["中医科医生", "中医执业医师", "中医馆医生"], spoken: ["看中医的", "做中医的"] }],
  ["pharmacist", "29-1051.00", "药剂师", "Pharmacist", "医疗", "医药", 90, { common: ["药房药剂师", "药师", "药房人员"], recruitment: ["门诊药剂师", "执业药师", "药店药师"], spoken: ["发药的", "药店上班的"] }],
  ["medical-lab-technologist", "29-2011.00", "检验师", "Medical Laboratory Technologist", "医疗", "检验", 120, { common: ["医学检验师", "检验技师", "检验科"], recruitment: ["临床检验师", "医学检验技术", "检验科人员"], spoken: ["做化验的", "在检验科上班的"], wrong_variant: ["化验员"] }],
  ["rehabilitation-therapist", "29-1123.00", "康复治疗师", "Physical Therapist", "医疗", "康复", 120, { common: ["康复师", "康复治疗", "康复理疗师"], recruitment: ["康复技师", "康复科治疗师", "康复训练师"], spoken: ["做康复的", "帮人康复训练的"] }],
  ["dentist", "29-1021.00", "口腔医生", "Dentist", "医疗", "口腔", 124, { common: ["牙医", "口腔医师", "牙科医生"], recruitment: ["口腔科医生", "口腔门诊医生", "口腔执业医师"], spoken: ["看牙医生", "做牙科的"] }],
  ["radiologic-technologist", "29-2034.00", "影像技师", "Radiologic Technologist", "医疗", "影像", 118, { common: ["医学影像技师", "放射技师", "医学影像技术"], recruitment: ["影像科技师", "核磁技师", "放射科技术员"], abbreviation: ["ct技师"], spoken: ["拍片技师", "做影像检查的"] }],
  ["nutritionist", "29-1031.00", "营养师", "Nutritionist", "医疗", "营养", 118, { common: ["公共营养师", "营养顾问", "营养咨询师"], recruitment: ["临床营养师", "配餐营养师", "营养管理师"], spoken: ["做营养咨询的", "配餐建议的"] }],
  ["psychological-counselor", "19-3033.00", "心理咨询师", "Psychological Counselor", "医疗", "心理", 120, { common: ["心理咨询", "心理医生", "心理师"], recruitment: ["心理顾问", "心理辅导师", "心理咨询助理"], spoken: ["做心理咨询的", "帮人做心理疏导的"], task_based: ["心理治疗师"] }],
  ["caregiver", "31-1121.00", "护工", "Caregiver", "医疗", "照护", 118, { common: ["病区护工", "护理员", "陪护"], recruitment: ["老人护工", "护工阿姨", "病人陪护"], spoken: ["做陪护的", "照顾病人的"] }],

  ["civil-servant", "43-4061.00", "公务员", "Civil Servant", "公共服务", "政务", 128, { common: ["公职人员", "机关单位工作人员", "政府工作人员"], recruitment: ["行政机关人员", "事业单位工作人员", "公务员岗位"], spoken: ["体制内", "考公的"] }],
  ["police-officer", "33-3051.00", "警察", "Police Officer", "公共服务", "警务", 128, { common: ["民警", "公安", "警务人员"], recruitment: ["派出所警察", "人民警察", "公安民警"], spoken: ["做警察的", "在派出所上班的"], task_based: ["警员"] }],
  ["auxiliary-police", "33-3051.00", "辅警", "Auxiliary Police", "公共服务", "警务", 120, { common: ["辅助警察", "协警", "警务辅助人员"], recruitment: ["公安辅警", "派出所辅警", "辅警队员"], abbreviation: ["警辅"], spoken: ["做辅警的"] }],
  ["firefighter", "33-2011.00", "消防员", "Firefighter", "公共服务", "消防", 126, { common: ["消防", "消防队员", "灭火救援"], recruitment: ["消防战斗员", "专职消防员", "政府专职消防员"], spoken: ["救火的", "做消防的"] }],
  ["community-worker", "21-1093.00", "社区工作者", "Community Worker", "公共服务", "基层治理", 120, { common: ["社区工作人员", "居委会工作人员", "社区干事"], recruitment: ["社区专职工作者", "社区岗", "基层社区工作者"], spoken: ["做社区工作的", "在居委会上班的"], task_based: ["社区服务人员"] }],
  ["social-worker", "21-1029.00", "社工", "Social Worker", "公共服务", "社会服务", 120, { common: ["社会工作者", "社工师", "社会工作"], recruitment: ["社区社工", "一线社工", "社工岗位"], spoken: ["做社工的", "做社会服务的"], task_based: ["社会服务人员"] }],
  ["grid-worker", "21-1093.00", "网格员", "Grid Worker", "公共服务", "基层治理", 118, { common: ["社区网格员", "网格工作人员", "网格管理员"], recruitment: ["网格管理人员", "基层网格员", "巡查网格员"], spoken: ["做网格的", "社区巡查的"], task_based: ["网格化管理"] }],
  ["urban-management-officer", "33-3051.00", "城管", "Urban Management Officer", "公共服务", "城市管理", 118, { common: ["城市管理执法", "城管执法", "城管队员"], recruitment: ["城市管理人员", "执法队员", "城市管理岗"], spoken: ["做城管的", "街上执法的"], task_based: ["综合执法"] }],
  ["subdistrict-office-worker", "43-4061.00", "街道办工作人员", "Subdistrict Office Worker", "公共服务", "政务", 116, { common: ["街道办", "街道工作人员", "街道办事处工作人员"], recruitment: ["街道办文员", "基层政务工作人员", "街道办岗位"], spoken: ["在街道办上班的", "街道办上班"] }],
  ["security-inspector", "33-9093.00", "安检员", "Security Inspector", "公共服务", "安检", 120, { common: ["安全检查员", "交通安检", "安检人员"], recruitment: ["地铁安检员", "机场安检员", "安全检查岗"], spoken: ["做安检的", "查包安检的"], task_based: ["安检岗"] }],

  ["auditor", "13-2011.00", "审计", "Auditor", "金融财税", "审计", 128, { common: ["审计师", "内部审计", "财务审计"], recruitment: ["审计专员", "审计助理", "内审"], spoken: ["审账的", "做审计的"] }],
  ["bank-teller", "43-3071.00", "银行柜员", "Bank Teller", "金融财税", "银行", 126, { common: ["银行柜台", "银行窗口人员", "银行柜面"], recruitment: ["银行前台柜员", "银行综合柜员", "银行柜面人员"], spoken: ["做银行柜台的", "银行窗口上班的"] }],
  ["financial-advisor", "13-2052.00", "理财顾问", "Financial Advisor", "金融财税", "理财", 120, { common: ["理财经理", "财富顾问", "投资顾问"], recruitment: ["财富管理顾问", "银行理财经理", "理财销售"], spoken: ["做理财的", "卖理财的"], task_based: ["资产配置顾问"] }],
  ["insurance-advisor", "41-3021.00", "保险顾问", "Insurance Advisor", "金融财税", "保险", 120, { common: ["保险销售", "保险代理人", "保险业务员"], recruitment: ["保险经纪人", "保险规划师", "保险客户经理"], spoken: ["卖保险的", "做保险的"] }],
  ["securities-analyst", "13-2051.00", "证券分析师", "Securities Analyst", "金融财税", "证券", 120, { common: ["股票分析师", "金融分析师", "券商分析师"], recruitment: ["投研分析师", "证券研究员", "行业研究员"], spoken: ["做证券研究的", "看股票行情的"], task_based: ["卖方分析师"] }],
  ["fund-sales", "41-3031.00", "基金销售", "Fund Sales", "金融财税", "基金", 116, { common: ["基金顾问", "基金业务员", "基金理财销售"], recruitment: ["基金销售顾问", "基金客户经理", "基金渠道销售"], spoken: ["卖基金的", "做基金销售的"] }],
  ["finance-manager", "11-3031.00", "财务经理", "Finance Manager", "金融财税", "财务管理", 120, { common: ["财务负责人", "财务管理", "会计经理"], recruitment: ["财务主管", "财务部经理", "财务管理岗"], abbreviation: ["财务leader"], spoken: ["管财务的"] }],
  ["tax-specialist", "13-2081.00", "税务专员", "Tax Specialist", "金融财税", "税务", 118, { common: ["税务", "税务师", "办税员"], recruitment: ["税务会计", "税务助理", "税务申报员"], spoken: ["做税务的", "报税的"], task_based: ["纳税申报"] }],
  ["cost-accountant", "13-2011.00", "成本会计", "Cost Accountant", "金融财税", "成本", 118, { common: ["成本核算", "成本财务", "成本管理会计"], recruitment: ["成本核算会计", "成本专员", "成本分析会计"], spoken: ["核算成本的", "做成本会计的"] }],
  ["risk-control-specialist", "13-2054.00", "风控专员", "Risk Control Specialist", "金融财税", "风控", 118, { common: ["风控", "风险控制", "风控岗"], recruitment: ["金融风控", "信贷风控", "风险管理专员"], spoken: ["做风控的", "看风险的"], task_based: ["风控审核"] }],

  ["network-engineer", "15-1244.00", "网络工程师", "Network Engineer", "技术", "网络运维", 122, { common: ["网络管理员", "网络维护", "网络支持工程师"], recruitment: ["网络运维工程师", "网络技术员", "机房网络工程师"], abbreviation: ["网工"], spoken: ["做网络的"] }],
  ["information-security-engineer", "15-1212.00", "信息安全工程师", "Information Security Engineer", "技术", "安全", 124, { common: ["信息安全", "安全工程师", "安全分析师"], recruitment: ["网络安全工程师", "安全运维", "信息安全专员"], abbreviation: ["网安工程师"], spoken: ["做网安的"] }],
  ["algorithm-engineer", "15-2051.00", "算法工程师", "Algorithm Engineer", "技术", "算法", 128, { common: ["算法", "算法开发", "模型算法工程师"], recruitment: ["机器学习工程师", "ai算法工程师", "推荐算法工程师"], spoken: ["做算法的", "调模型的"], task_based: ["深度学习工程师"] }],
  ["system-administrator", "15-1244.00", "系统管理员", "System Administrator", "技术", "运维", 120, { common: ["系统运维", "服务器管理员", "系统维护"], recruitment: ["系统运维工程师", "运维管理员", "机房管理员"], abbreviation: ["it管理员"], spoken: ["做系统维护的"] }],
  ["database-administrator", "15-1242.00", "数据库管理员", "Database Administrator", "技术", "数据库", 120, { common: ["数据库运维", "数据库管理", "数据库维护"], recruitment: ["数据库工程师", "数据库专员", "mysql dba"], abbreviation: ["dba"], spoken: ["做数据库的"] }],
  ["software-engineer", "15-1252.00", "软件工程师", "Software Engineer", "技术", "软件开发", 90, { common: ["软件开发工程师", "软件开发", "软件研发"], recruitment: ["软件项目工程师", "软件研发工程师", "应用开发工程师"], spoken: ["写代码的", "做软件研发的"] }],
  ["game-planner", "13-1082.00", "游戏策划", "Game Planner", "互联网", "游戏", 120, { common: ["游戏策划师", "手游策划", "游戏产品策划"], recruitment: ["游戏系统策划", "游戏数值策划", "关卡策划"], spoken: ["做游戏策划的", "做游戏玩法的"], task_based: ["游戏文案策划"] }],
  ["game-artist", "27-1014.00", "游戏美术", "Game Artist", "互联网", "游戏", 100, { common: ["游戏美术设计师", "手游美术", "游戏视觉设计"], recruitment: ["游戏原画师", "游戏角色美术", "游戏场景美术"], spoken: ["做游戏美术的", "画游戏角色的"], task_based: ["游戏ui美术"] }],
  ["interaction-designer", "15-1255.00", "交互设计师", "Interaction Designer", "设计", "交互", 100, { common: ["用户体验设计师", "体验设计师", "产品体验设计"], recruitment: ["产品交互设计", "交互岗", "ux设计师"], abbreviation: ["ux"], spoken: ["做交互的"] }],
  ["implementation-engineer", "15-1232.00", "实施工程师", "Implementation Engineer", "技术", "实施交付", 120, { common: ["系统实施", "交付工程师", "实施顾问"], recruitment: ["系统交付工程师", "项目实施工程师", "客户现场实施"], spoken: ["做实施的", "去客户现场装系统的"], task_based: ["上线实施"] }],

  ["mechanical-engineer", "17-2141.00", "机械工程师", "Mechanical Engineer", "工程", "机械", 100, { common: ["机械设计", "机械工程", "机械结构工程师"], recruitment: ["机械设计工程师", "机械研发工程师", "设备机械工程师"], spoken: ["做机械的", "画机械图的"], task_based: ["机械技术员"] }],
  ["electrical-engineer", "17-2071.00", "电气工程师", "Electrical Engineer", "工程", "电气", 100, { common: ["电气设计", "电控工程师", "电气工程"], recruitment: ["电气设计工程师", "电气自动化工程师", "强弱电工程师"], spoken: ["做电气的", "接电气图的"], task_based: ["电气技术员"] }],
  ["civil-engineer", "17-2051.00", "土木工程师", "Civil Engineer", "工程", "土木", 120, { common: ["土建工程师", "土木工程", "结构工程师"], recruitment: ["土建技术员", "现场土建工程师", "土木技术员"], spoken: ["做土木的", "跑土建项目的"], task_based: ["土建岗"] }],
  ["architectural-designer", "17-1011.00", "建筑设计师", "Architect", "工程", "建筑设计", 100, { common: ["建筑师", "建筑设计", "建筑设计岗"], recruitment: ["方案设计师", "建筑方案设计", "建筑施工图设计"], spoken: ["做建筑设计的", "画建筑图的"], task_based: ["建筑设计助理"] }],
  ["construction-worker-supervisor", "11-9021.00", "施工员", "Construction Site Technician", "工程", "施工现场", 122, { common: ["现场施工员", "建筑施工员", "工地施工员"], recruitment: ["土建施工员", "施工管理", "施工现场管理"], spoken: ["跑工地的", "做施工的"] }],
  ["supervision-engineer", "47-4011.00", "监理工程师", "Construction Inspector", "工程", "工程监理", 120, { common: ["工程监理", "监理员", "监理工程"], recruitment: ["土建监理", "现场监理", "项目监理"], spoken: ["做监理的", "盯工地质量的"], task_based: ["监理岗位"] }],
  ["cost-engineer", "13-1051.00", "造价工程师", "Cost Estimator", "工程", "造价", 120, { common: ["工程造价", "造价员", "预算员"], recruitment: ["土建造价工程师", "安装造价工程师", "造价专员"], spoken: ["做造价的", "算工程预算的"], task_based: ["工程预算"] }],
  ["safety-officer", "19-5011.00", "安全员", "Safety Specialist", "工程", "安全", 118, { common: ["工地安全员", "安全管理人员", "安全生产管理员"], recruitment: ["安全专员", "施工安全员", "安全管理岗"], abbreviation: ["ehs专员"], spoken: ["管安全的"] }],
  ["materials-clerk", "17-2131.00", "材料员", "Materials Specialist", "工程", "材料", 116, { common: ["工地材料员", "材料管理", "材料岗"], recruitment: ["材料管理员", "建筑材料员", "材料专员"], spoken: ["管材料的", "收材料的"], task_based: ["材料进场管理"] }],
  ["process-engineer", "17-2199.00", "工艺工程师", "Process Engineer", "工程", "工艺", 120, { common: ["工艺", "制程工程师", "工艺员"], recruitment: ["制造工艺工程师", "生产工艺工程师", "工艺技术员"], abbreviation: ["pe工程师"], spoken: ["做工艺的"] }],

  ["bus-driver", "53-3052.00", "公交车司机", "Bus Driver", "交通物流", "司机", 101, { common: ["公交司机", "公交驾驶员", "巴士司机"], recruitment: ["城市公交司机", "公交车驾驶员", "客运公交司机"], spoken: ["开公交的", "公交车师傅"] }],
  ["taxi-driver", "53-3054.00", "出租车司机", "Taxi Driver", "交通物流", "司机", 101, { common: ["出租司机", "的士司机", "出租车师傅"], recruitment: ["出租车驾驶员", "巡游出租车司机", "出租车运营司机"], spoken: ["开出租的", "开出租车的"] }],
  ["subway-station-attendant", "53-4041.00", "地铁站务员", "Subway Station Attendant", "交通物流", "轨道交通", 120, { common: ["地铁站务", "地铁工作人员", "站务员"], recruitment: ["轨道站务员", "地铁客服", "地铁站务客服"], spoken: ["在地铁站上班的", "地铁站上班"], task_based: ["地铁站厅服务"] }],
  ["forklift-driver", "53-7051.00", "叉车司机", "Forklift Driver", "交通物流", "仓储运输", 100, { common: ["叉车工", "叉车驾驶员", "叉车操作员"], recruitment: ["物流叉车工", "叉车岗位", "叉车操作岗位"], spoken: ["开叉车的", "叉车师傅"] }],
  ["train-attendant", "53-6061.00", "列车乘务员", "Train Attendant", "交通物流", "铁路客运", 120, { common: ["列车员", "火车乘务员", "列车服务员"], recruitment: ["铁路乘务员", "高铁乘务员", "动车乘务员"], spoken: ["在高铁上班的", "列车上服务的"], task_based: ["铁路客运员"] }],
  ["freight-dispatcher", "43-5032.00", "货运调度员", "Freight Dispatcher", "交通物流", "调度", 118, { common: ["物流调度员", "运输调度", "货运调度"], recruitment: ["货车调度", "车辆调度员", "运输计划调度"], spoken: ["调车的", "安排车辆的"] }],
  ["customs-declarer", "43-5011.00", "报关员", "Customs Declarer", "交通物流", "口岸物流", 120, { common: ["报关", "关务", "进出口报关"], recruitment: ["报关专员", "报关文员", "关务专员"], spoken: ["做报关的", "跑海关的"], task_based: ["海关申报"] }],
  ["seafarer", "53-5011.00", "船员", "Seafarer", "交通物流", "航运", 118, { common: ["海员", "水手", "船舶船员"], recruitment: ["远洋船员", "航运船员", "船上工作人员"], spoken: ["跑船的", "在船上工作的"] }],
  ["aircraft-maintenance-worker", "49-3011.00", "飞机维修员", "Aircraft Maintenance Technician", "交通物流", "航空维修", 120, { common: ["飞机维修", "航空维修员", "机务维修"], recruitment: ["飞机维修技师", "航空机务维修", "飞机检修员"], spoken: ["修飞机的", "做飞机机务的"], task_based: ["飞机机务"] }],
  ["airport-ground-staff", "53-6032.00", "机场地勤", "Airport Ground Staff", "交通物流", "航空地勤", 120, { common: ["机场地勤人员", "航空地勤", "机场工作人员"], recruitment: ["值机地勤", "机场值机", "地勤服务"], spoken: ["在机场上班的", "机场服务的"], task_based: ["机场服务员"] }],

  ["hotel-front-desk", "43-4081.00", "酒店前台", "Hotel Front Desk Clerk", "服务", "酒店", 128, { common: ["酒店接待", "酒店前台接待", "酒店总台"], recruitment: ["前厅接待", "酒店前台文员", "前厅部接待"], spoken: ["在酒店前台上班的", "酒店接待客人的"], task_based: ["酒店入住登记"] }],
  ["greeter", "35-9031.00", "迎宾员", "Host", "服务", "餐旅门店", 116, { common: ["迎宾", "礼宾迎宾", "接待迎宾"], recruitment: ["餐厅迎宾", "酒店迎宾", "迎宾接待"], spoken: ["站门口迎宾的", "做迎宾的"] }],
  ["lobby-manager", "11-9081.00", "大堂经理", "Lobby Manager", "服务", "酒店", 118, { common: ["酒店大堂经理", "大堂副理", "大堂管理"], recruitment: ["银行大堂经理", "前厅经理", "酒店前厅管理"], spoken: ["管大堂的", "在大厅接待的"], task_based: ["前厅主管"] }],
  ["homestay-steward", "39-6012.00", "民宿管家", "Homestay Steward", "服务", "民宿", 120, { common: ["民宿运营管家", "民宿接待", "客栈管家"], recruitment: ["民宿前台", "民宿店长", "民宿服务管家"], spoken: ["做民宿的", "在民宿上班的"], task_based: ["民宿客服"] }],
  ["bartender", "35-3011.00", "调酒师", "Bartender", "服务", "餐饮", 120, { common: ["酒吧调酒师", "调酒", "酒水师"], recruitment: ["吧台调酒", "鸡尾酒调酒师", "酒吧吧台"], spoken: ["做调酒的", "在酒吧吧台的"], task_based: ["吧员"] }],
  ["barista", "35-3023.00", "咖啡师", "Barista", "服务", "咖啡茶饮", 128, { common: ["咖啡", "咖啡店员", "咖啡拉花师"], recruitment: ["咖啡制作师", "咖啡吧员", "咖啡店上班"], abbreviation: ["barista"], spoken: ["做咖啡的", "咖啡店上班的"] }],
  ["tea-specialist", "35-3023.00", "茶艺师", "Tea Specialist", "服务", "咖啡茶饮", 118, { common: ["茶艺", "茶艺员", "茶饮师"], recruitment: ["茶馆茶艺师", "茶叶店员", "茶文化讲师"], spoken: ["泡茶师", "做茶艺的"] }],
  ["baker", "51-3011.00", "烘焙师", "Baker", "服务", "烘焙", 120, { common: ["面包师", "烘焙", "烘焙技师"], recruitment: ["面包烘焙师", "烘焙学徒", "面包房师傅"], spoken: ["做面包的", "烤面包的"] }],
  ["pastry-chef", "51-3011.00", "西点师", "Pastry Chef", "服务", "烘焙", 120, { common: ["西点", "蛋糕师", "甜品师"], recruitment: ["西点烘焙师", "裱花师", "西点学徒"], spoken: ["做蛋糕的", "做甜品的"], task_based: ["蛋糕烘焙师"] }],
  ["fitness-coach", "39-9031.00", "健身教练", "Fitness Coach", "服务", "健身", 122, { common: ["健身私教", "私人教练", "私教"], recruitment: ["团课教练", "健身房教练", "运动教练"], spoken: ["带人健身的", "做健身教练的"] }]
];

export const CHINA_P05_SEARCH_SEEDS: P05SearchSeedEntry[] = P05_SEED_TUPLES.map(entry);
export const CHINA_P05_SEARCH_ENTRY_COUNT = CHINA_P05_SEARCH_SEEDS.length;
export const CHINA_P05_SEARCH_ALIAS_COUNT = CHINA_P05_SEARCH_SEEDS.reduce((count, seed) => count + seed.aliases.length, 0);
