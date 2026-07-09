window.CITY_QUEST_DATA = {
  city: {
    name: "上海",
    area: "衡复风貌区",
    weather: "多云 31C",
    center: "31.2104, 121.4387"
  },
  users: {
    guest: {
      label: "未登录",
      name: "未登录游客",
      userCode: "",
      membership: "未开通",
      expiresAt: "",
      compass: 0
    },
    normal: {
      label: "普通用户",
      name: "林墨",
      userCode: "CQ-839204",
      membership: "普通用户",
      expiresAt: "",
      compass: 0
    },
    pending: {
      label: "待激活会员",
      name: "林墨",
      userCode: "CQ-839204",
      membership: "待开始探索",
      expiresAt: "开始探索后计算",
      compass: 3
    },
    member: {
      label: "有效会员",
      name: "林墨",
      userCode: "CQ-839204",
      membership: "有效会员",
      expiresAt: "2026-08-18 21:00",
      compass: 3
    },
    expired: {
      label: "过期会员",
      name: "林墨",
      userCode: "CQ-839204",
      membership: "会员已过期",
      expiresAt: "2026-07-01 20:30",
      compass: 1
    },
    admin: {
      label: "超级管理员",
      name: "许亭",
      userCode: "ADMIN-001",
      membership: "有效会员 / 管理员",
      expiresAt: "2026-12-31 23:59",
      compass: 5
    }
  },
  membershipPlans: [
    {
      id: "plan-weekend",
      title: "周末城市探秘",
      duration: "3 天",
      compass: 3,
      welcomeExpires: "7 天"
    },
    {
      id: "plan-month",
      title: "月度城市探秘",
      duration: "30 天",
      compass: 8,
      welcomeExpires: "14 天"
    }
  ],
  decryptMaps: [
    {
      id: "map-lane",
      title: "消失的弄堂门牌",
      area: "衡复风貌区",
      difficulty: "中等",
      duration: "90 分钟",
      questId: "quest-lane",
      coverUrl: "assets/img/cover-map-lane.svg"
    },
    {
      id: "map-river",
      title: "邮轮码头的旧暗号",
      area: "北外滩",
      difficulty: "轻量",
      duration: "60 分钟",
      questId: "quest-river"
    }
  ],
  welcomeCodes: {
    membership: {
      title: "欢迎来到城市探秘",
      subtitle: "周末城市探秘 / 待激活",
      description: "从这里开始本次探索。到期时间将在开始后计算。",
      button: "开始探索",
      expiresAt: "2026-07-16 20:00",
      coverUrl: "assets/img/cover-membership.svg"
    },
    map: {
      title: "消失的弄堂门牌",
      subtitle: "解密地图 / 中等 / 衡复风貌区",
      description: "从一块旧门牌开始，找出三段被城市更新掩住的线索。",
      button: "开始解密",
      expiresAt: "2026-07-20 20:00",
      coverUrl: "assets/img/cover-map-lane.svg"
    },
    bundle: {
      title: "VIP 探索已准备好",
      subtitle: "月度城市探秘 + 消失的弄堂门牌",
      description: "开始后进入这张解密地图的起点。",
      button: "开始探索",
      expiresAt: "2026-07-20 20:00",
      coverUrl: "assets/img/cover-map-lane.svg"
    }
  },
  encyclopedias: [
    {
      id: "enc-001",
      title: "武康大楼的转角",
      area: "衡复风貌区",
      tags: ["建筑", "公开"],
      distance: "420m",
      favorite: true,
      coverUrl: "assets/img/encyclopedia-wukang.svg",
      summary: "一道贴着街角转过去的弧线，是这片街区最容易被认出的城市标记。"
    },
    {
      id: "enc-002",
      title: "旧路牌上的法租界痕迹",
      area: "复兴西路",
      tags: ["路牌", "公开"],
      distance: "680m",
      favorite: false,
      coverUrl: "assets/img/encyclopedia-sign.svg",
      summary: "路牌、门牌和街角铭牌，保存了比攻略更细的城市细节。"
    },
    {
      id: "enc-003",
      title: "花园住宅的铁艺门",
      area: "湖南路",
      tags: ["需解锁"],
      distance: "920m",
      favorite: false,
      coverUrl: "assets/img/encyclopedia-gate.svg",
      summary: "一段线索解锁后可见的百科条目。"
    }
  ],
  chests: [
    {
      id: "chest-184206",
      opsCode: "184206",
      area: "武康路",
      displayDistance: "约 320m",
      range: "10m",
      drift: "漂移坐标已展示",
      precise: "花砖墙右侧第三块铜牌下方",
      status: "已投放",
      unlocked: false
    },
    {
      id: "chest-391774",
      opsCode: "391774",
      area: "复兴西路",
      displayDistance: "约 840m",
      range: "10m",
      drift: "漂移坐标已展示",
      precise: "旧路牌背面，靠近梧桐树一侧",
      status: "已投放",
      unlocked: true
    }
  ],
  inventory: {
    boxes: [
      {
        id: "inv-box-001",
        title: "衡复风貌区实体宝箱",
        status: "未打开",
        source: "扫码领取",
        obtainedAt: "07-09 16:18"
      },
      {
        id: "inv-box-002",
        title: "副本奖励虚拟宝箱",
        status: "已打开",
        source: "副本完成",
        obtainedAt: "07-08 19:22"
      }
    ],
    props: [
      {
        title: "寻宝罗盘",
        count: 3,
        detail: "用于查看指定宝箱或线索的精确指引"
      },
      {
        title: "解密地图：消失的弄堂门牌",
        count: 1,
        detail: "已开始，可继续副本"
      }
    ],
    clues: [
      {
        title: "门牌背后的缩写",
        quest: "消失的弄堂门牌",
        status: "进行中"
      },
      {
        title: "铜牌上的年份",
        quest: "消失的弄堂门牌",
        status: "已完成"
      }
    ],
    empty: [
      {
        title: "空箱记录",
        source: "武康路实体宝箱",
        obtainedAt: "07-06 15:02"
      }
    ]
  },
  cards: [
    {
      id: "card-apartment",
      no: "CQ-CARD-001",
      title: "城市记忆：转角公寓",
      rarity: "普通",
      series: "海派建筑",
      seriesProgress: "2/4",
      owned: true,
      obtainedAt: "2026-07-09 16:21",
      source: "武康路实体宝箱",
      description: "一张记录街角弧线和公寓立面的图鉴。它对应用户在现场发现的建筑观察点。",
      imageUrl: "assets/img/card-apartment.svg"
    },
    {
      id: "card-doorplate",
      no: "CQ-CARD-002",
      title: "门牌编号 27",
      rarity: "稀有",
      series: "海派建筑",
      seriesProgress: "2/4",
      owned: true,
      obtainedAt: "2026-07-08 19:22",
      source: "副本线索奖励",
      description: "旧门牌上的编号是副本线索的一部分。获得后会点亮海派建筑系列进度。",
      imageUrl: "assets/img/card-doorplate.svg"
    },
    {
      id: "card-plaque",
      no: "CQ-CARD-003",
      title: "旧铜铭牌",
      rarity: "史诗",
      series: "海派建筑",
      seriesProgress: "2/4",
      owned: false,
      obtainedAt: "",
      source: "未获得",
      description: "未获得图鉴只展示剪影，不展示完整内容。获得后可查看完整卡面和来源。",
      imageUrl: "assets/img/card-plaque.svg"
    },
    {
      id: "card-plane",
      no: "CQ-CARD-004",
      title: "梧桐影",
      rarity: "普通",
      series: "街角细节",
      seriesProgress: "0/3",
      owned: false,
      obtainedAt: "",
      source: "未获得",
      description: "未获得图鉴只展示剪影，用于提示系列中仍有可收集内容。",
      imageUrl: "assets/img/card-plane.svg"
    }
  ],
  quests: [
    {
      id: "quest-lane",
      title: "消失的弄堂门牌",
      area: "衡复风貌区",
      difficulty: "中等",
      progress: "2/5",
      unlockMode: "线性解锁",
      status: "进行中",
      clues: [
        { title: "找到门牌的缩写", status: "已完成" },
        { title: "核对铜牌年份", status: "进行中" },
        { title: "前往第二处折角", status: "未解锁" },
        { title: "解读墙面刻痕", status: "未解锁" },
        { title: "提交最终地点", status: "未解锁" }
      ]
    }
  ],
  adminOps: [
    "16:18 为 CQ-839204 开通周末城市探秘",
    "15:43 投放宝箱 184206",
    "14:05 生成组合入口码 WC-8F23"
  ]
};
