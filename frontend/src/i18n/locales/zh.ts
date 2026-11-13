import type en from "@/i18n/locales/en"

// Typed against the English file: a missing or misspelled key fails the type check.
const zh: typeof en = {
  nav: {
    label: "主导航",
    timeline: "时间线",
    map: "地图",
    stats: "统计",
  },
  language: {
    label: "语言",
  },
  home: {
    title: "我的飞行足迹",
    subtitle: "记录我坐过的每一趟航班：飞去哪里、什么时候、飞了多远。",
    emptyTitle: "还没有航班记录",
    emptyBody: "每一趟航班都会以卡片的形式出现在这里，最新的排在最前面。",
  },
  map: {
    title: "航线地图",
  },
  stats: {
    title: "飞行统计",
  },
  placeholder: {
    body: "这个页面还在建设中。",
  },
  status: {
    title: "系统状态",
    description: "实时检查这个页面、API 和数据库之间是否连通。",
    refresh: "刷新",
    backend: "后端 API",
    connected: "已连接",
    unreachable: "无法连接",
    airports: "数据库中的机场",
    errorHint: "Spring Boot 后端是否正在 8080 端口运行？",
  },
  notFound: {
    title: "找不到这个页面",
    body: "这个地址下没有内容。",
    back: "返回时间线",
  },
  footer: {
    tagline: "个人飞行记录。",
    airportData: "机场数据来自 <source>OurAirports</source>（公有领域）。",
  },
}

export default zh
