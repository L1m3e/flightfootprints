/** An airline this site can paint an aircraft for. */
export interface Airline {
  /** Two-character IATA designator, the start of a flight number: CA in CA818. */
  iata: string
  /** Three-letter ICAO designator, used by air traffic control: CCA in CCA818. */
  icao: string
  name: string
  /** Other names people write for the same airline, in any language. */
  aliases: readonly string[]
}

/**
 * The airlines that are recognised. Mainland China is covered almost completely; for
 * Taiwan, the United States, Japan, South Korea and Australia it is the main carriers;
 * elsewhere only the best-known ones.
 */
export const AIRLINES: readonly Airline[] = [
  // Mainland China
  { iata: "CA", icao: "CCA", name: "Air China", aliases: ["中国国际航空", "中国国航", "国航"] },
  { iata: "MU", icao: "CES", name: "China Eastern Airlines", aliases: ["中国东方航空", "东方航空", "东航"] },
  { iata: "CZ", icao: "CSN", name: "China Southern Airlines", aliases: ["中国南方航空", "南方航空", "南航"] },
  { iata: "HU", icao: "CHH", name: "Hainan Airlines", aliases: ["海南航空", "海航"] },
  { iata: "3U", icao: "CSC", name: "Sichuan Airlines", aliases: ["四川航空", "川航"] },
  { iata: "MF", icao: "CXA", name: "Xiamen Airlines", aliases: ["XiamenAir", "厦门航空", "厦航"] },
  { iata: "ZH", icao: "CSZ", name: "Shenzhen Airlines", aliases: ["深圳航空", "深航"] },
  { iata: "SC", icao: "CDG", name: "Shandong Airlines", aliases: ["山东航空", "山航"] },
  { iata: "FM", icao: "CSH", name: "Shanghai Airlines", aliases: ["上海航空", "上航"] },
  { iata: "HO", icao: "DKH", name: "Juneyao Airlines", aliases: ["Juneyao Air", "吉祥航空"] },
  { iata: "9C", icao: "CQH", name: "Spring Airlines", aliases: ["春秋航空"] },
  { iata: "KN", icao: "CUA", name: "China United Airlines", aliases: ["中国联合航空", "中联航"] },
  { iata: "GS", icao: "GCR", name: "Tianjin Airlines", aliases: ["天津航空"] },
  { iata: "JD", icao: "CBJ", name: "Capital Airlines", aliases: ["Beijing Capital Airlines", "首都航空", "北京首都航空"] },
  { iata: "PN", icao: "CHB", name: "West Air", aliases: ["西部航空"] },
  { iata: "8L", icao: "LKE", name: "Lucky Air", aliases: ["祥鹏航空"] },
  { iata: "EU", icao: "UEA", name: "Chengdu Airlines", aliases: ["成都航空"] },
  { iata: "TV", icao: "TBA", name: "Tibet Airlines", aliases: ["Xizang Airlines", "西藏航空"] },
  { iata: "KY", icao: "KNA", name: "Kunming Airlines", aliases: ["昆明航空"] },
  { iata: "BK", icao: "OKA", name: "Okay Airways", aliases: ["Okay Air", "奥凯航空"] },
  { iata: "NS", icao: "HBH", name: "Hebei Airlines", aliases: ["河北航空"] },
  { iata: "G5", icao: "HXA", name: "China Express Airlines", aliases: ["华夏航空"] },
  { iata: "AQ", icao: "JYH", name: "9 Air", aliases: ["Nine Air", "九元航空"] },
  { iata: "DR", icao: "RLH", name: "Ruili Airlines", aliases: ["瑞丽航空", "苏南瑞丽航空"] },
  { iata: "QW", icao: "QDA", name: "Qingdao Airlines", aliases: ["青岛航空"] },
  { iata: "GJ", icao: "CDC", name: "Loong Air", aliases: ["Zhejiang Loong Airlines", "长龙航空", "浙江长龙航空"] },
  { iata: "DZ", icao: "EPA", name: "Donghai Airlines", aliases: ["东海航空"] },
  { iata: "FU", icao: "FZA", name: "Fuzhou Airlines", aliases: ["福州航空"] },
  { iata: "UQ", icao: "CUH", name: "Urumqi Air", aliases: ["乌鲁木齐航空"] },
  { iata: "GX", icao: "CBG", name: "GX Airlines", aliases: ["Guangxi Beibu Gulf Airlines", "北部湾航空", "广西北部湾航空"] },
  { iata: "Y8", icao: "YZR", name: "Suparna Airlines", aliases: ["金鹏航空"] },
  { iata: "9H", icao: "CGN", name: "Air Changan", aliases: ["长安航空"] },
  { iata: "GT", icao: "CGH", name: "Air Guilin", aliases: ["桂林航空"] },
  { iata: "LT", icao: "SNG", name: "LongJiang Airlines", aliases: ["龙江航空"] },
  { iata: "A6", icao: "OTC", name: "Air Travel", aliases: ["Hunan Airlines", "湖南航空", "红土航空"] },
  { iata: "RY", icao: "CJX", name: "Jiangxi Air", aliases: ["江西航空"] },
  { iata: "GY", icao: "CGZ", name: "Colorful Guizhou Airlines", aliases: ["多彩贵州航空"] },
  { iata: "CN", icao: "GDC", name: "Grand China Air", aliases: ["大新华航空"] },
  { iata: "OQ", icao: "CQN", name: "Chongqing Airlines", aliases: ["重庆航空"] },
  { iata: "9D", icao: "NMG", name: "Genghis Khan Airlines", aliases: ["Tianjiao Airlines", "天骄航空"] },

  // Hong Kong and Macau. Cathay Dragon stopped flying in 2020 but is in many flight logs.
  { iata: "CX", icao: "CPA", name: "Cathay Pacific", aliases: ["Cathay", "国泰航空"] },
  { iata: "KA", icao: "HDA", name: "Cathay Dragon", aliases: ["Dragonair", "国泰港龙航空", "港龙航空"] },
  { iata: "HX", icao: "CRK", name: "Hong Kong Airlines", aliases: ["香港航空"] },
  { iata: "UO", icao: "HKE", name: "HK Express", aliases: ["Hong Kong Express", "香港快运"] },
  { iata: "HB", icao: "HGB", name: "Greater Bay Airlines", aliases: ["大湾区航空"] },
  { iata: "NX", icao: "AMU", name: "Air Macau", aliases: ["澳门航空"] },

  // Taiwan
  { iata: "CI", icao: "CAL", name: "China Airlines", aliases: ["中华航空", "华航"] },
  { iata: "BR", icao: "EVA", name: "EVA Air", aliases: ["长荣航空"] },
  { iata: "JX", icao: "SJX", name: "Starlux Airlines", aliases: ["星宇航空"] },
  { iata: "IT", icao: "TTW", name: "Tigerair Taiwan", aliases: ["台湾虎航", "虎航"] },
  { iata: "AE", icao: "MDA", name: "Mandarin Airlines", aliases: ["华信航空"] },
  { iata: "B7", icao: "UIA", name: "Uni Air", aliases: ["立荣航空"] },

  // United States
  { iata: "UA", icao: "UAL", name: "United Airlines", aliases: ["美国联合航空", "联合航空", "美联航"] },
  { iata: "DL", icao: "DAL", name: "Delta Air Lines", aliases: ["达美航空"] },
  { iata: "AA", icao: "AAL", name: "American Airlines", aliases: ["美国航空", "美航"] },
  { iata: "WN", icao: "SWA", name: "Southwest Airlines", aliases: ["美国西南航空", "西南航空"] },
  { iata: "B6", icao: "JBU", name: "JetBlue", aliases: ["捷蓝航空"] },
  { iata: "AS", icao: "ASA", name: "Alaska Airlines", aliases: ["阿拉斯加航空"] },
  { iata: "NK", icao: "NKS", name: "Spirit Airlines", aliases: ["精神航空"] },
  { iata: "F9", icao: "FFT", name: "Frontier Airlines", aliases: ["边疆航空"] },
  { iata: "HA", icao: "HAL", name: "Hawaiian Airlines", aliases: ["夏威夷航空"] },
  { iata: "G4", icao: "AAY", name: "Allegiant Air", aliases: ["Allegiant", "忠实航空"] },
  { iata: "SY", icao: "SCX", name: "Sun Country Airlines", aliases: ["太阳城航空"] },

  // Japan
  { iata: "NH", icao: "ANA", name: "All Nippon Airways", aliases: ["ANA", "全日空", "全日本空输"] },
  { iata: "JL", icao: "JAL", name: "Japan Airlines", aliases: ["JAL", "日本航空", "日航"] },
  { iata: "MM", icao: "APJ", name: "Peach Aviation", aliases: ["Peach", "乐桃航空"] },
  { iata: "GK", icao: "JJP", name: "Jetstar Japan", aliases: ["捷星日本"] },
  { iata: "BC", icao: "SKY", name: "Skymark Airlines", aliases: ["天马航空"] },
  { iata: "ZG", icao: "TZP", name: "Zipair Tokyo", aliases: ["Zipair"] },
  { iata: "7G", icao: "SFJ", name: "StarFlyer", aliases: ["星悦航空"] },
  { iata: "HD", icao: "ADO", name: "Air Do", aliases: ["北海道国际航空"] },
  { iata: "6J", icao: "SNJ", name: "Solaseed Air", aliases: ["Solaseed"] },
  { iata: "IJ", icao: "SJO", name: "Spring Japan", aliases: ["Spring Airlines Japan", "春秋航空日本"] },

  // South Korea
  { iata: "KE", icao: "KAL", name: "Korean Air", aliases: ["Korean", "大韩航空"] },
  { iata: "OZ", icao: "AAR", name: "Asiana Airlines", aliases: ["韩亚航空"] },
  { iata: "7C", icao: "JJA", name: "Jeju Air", aliases: ["济州航空"] },
  { iata: "LJ", icao: "JNA", name: "Jin Air", aliases: ["真航空"] },
  { iata: "TW", icao: "TWB", name: "T'way Air", aliases: ["德威航空"] },
  { iata: "BX", icao: "ABL", name: "Air Busan", aliases: ["釜山航空"] },
  { iata: "ZE", icao: "ESR", name: "Eastar Jet", aliases: ["易斯达航空"] },
  { iata: "RS", icao: "ASV", name: "Air Seoul", aliases: ["首尔航空"] },
  { iata: "YP", icao: "APZ", name: "Air Premia", aliases: [] },

  // Australia
  { iata: "QF", icao: "QFA", name: "Qantas", aliases: ["澳洲航空", "澳航"] },
  { iata: "VA", icao: "VOZ", name: "Virgin Australia", aliases: ["维珍澳洲航空"] },
  { iata: "JQ", icao: "JST", name: "Jetstar Airways", aliases: ["捷星航空"] },

  // The best-known ones from elsewhere
  { iata: "SQ", icao: "SIA", name: "Singapore Airlines", aliases: ["新加坡航空", "新航"] },
  { iata: "TR", icao: "TGW", name: "Scoot", aliases: ["酷航"] },
  { iata: "TG", icao: "THA", name: "Thai Airways", aliases: ["Thai Airways International", "泰国国际航空", "泰国航空", "泰航"] },
  { iata: "MH", icao: "MAS", name: "Malaysia Airlines", aliases: ["马来西亚航空", "马航"] },
  { iata: "AK", icao: "AXM", name: "AirAsia", aliases: ["亚洲航空", "亚航"] },
  { iata: "VN", icao: "HVN", name: "Vietnam Airlines", aliases: ["越南航空"] },
  { iata: "GA", icao: "GIA", name: "Garuda Indonesia", aliases: ["印尼鹰航", "嘉鲁达印尼航空"] },
  { iata: "PR", icao: "PAL", name: "Philippine Airlines", aliases: ["菲律宾航空"] },
  { iata: "AI", icao: "AIC", name: "Air India", aliases: ["印度航空"] },
  { iata: "EK", icao: "UAE", name: "Emirates", aliases: ["阿联酋航空"] },
  { iata: "QR", icao: "QTR", name: "Qatar Airways", aliases: ["卡塔尔航空"] },
  { iata: "EY", icao: "ETD", name: "Etihad Airways", aliases: ["阿提哈德航空"] },
  { iata: "TK", icao: "THY", name: "Turkish Airlines", aliases: ["土耳其航空"] },
  { iata: "BA", icao: "BAW", name: "British Airways", aliases: ["英国航空", "英航"] },
  { iata: "VS", icao: "VIR", name: "Virgin Atlantic", aliases: ["维珍航空", "维珍大西洋航空"] },
  { iata: "LH", icao: "DLH", name: "Lufthansa", aliases: ["汉莎航空", "德国汉莎航空"] },
  { iata: "AF", icao: "AFR", name: "Air France", aliases: ["法国航空", "法航"] },
  { iata: "KL", icao: "KLM", name: "KLM", aliases: ["KLM Royal Dutch Airlines", "荷兰皇家航空", "荷航"] },
  { iata: "LX", icao: "SWR", name: "Swiss", aliases: ["Swiss International Air Lines", "瑞士国际航空", "瑞士航空"] },
  { iata: "AY", icao: "FIN", name: "Finnair", aliases: ["芬兰航空"] },
  { iata: "SU", icao: "AFL", name: "Aeroflot", aliases: ["俄罗斯航空", "俄航"] },
  { iata: "FR", icao: "RYR", name: "Ryanair", aliases: ["瑞安航空"] },
  { iata: "U2", icao: "EZY", name: "easyJet", aliases: ["易捷航空"] },
  { iata: "AC", icao: "ACA", name: "Air Canada", aliases: ["加拿大航空", "加航"] },
  { iata: "NZ", icao: "ANZ", name: "Air New Zealand", aliases: ["新西兰航空"] },
]

/**
 * Reduces an airline name to what tells airlines apart: lower case, no spaces or
 * punctuation, and without a closing "Airlines", "Airways" or "航空公司". This way
 * "Delta", "delta air lines" and "Delta Airlines" are the same name.
 */
function nameKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9一-鿿]/g, "")
    .replace(/(airlines?|airways|航空公司|航空)$/, "")
}

const BY_DESIGNATOR = new Map<string, Airline>()
const BY_NAME = new Map<string, Airline>()
for (const airline of AIRLINES) {
  BY_DESIGNATOR.set(airline.iata, airline)
  BY_DESIGNATOR.set(airline.icao, airline)
  for (const name of [airline.name, ...airline.aliases]) {
    BY_NAME.set(nameKey(name), airline)
  }
}

/**
 * The airline part of a flight number: "CA" in "CA818". A flight number that starts with
 * three letters carries an ICAO designator instead: "CCA" in "CCA818". IATA designators
 * may contain a digit ("9C8887", "3U8888"), so the first two characters are taken as
 * they are.
 */
export function airlineDesignator(flightNo: string | null | undefined): string | null {
  const code = (flightNo ?? "").replaceAll(" ", "").toUpperCase()
  if (/^[A-Z]{3}\d/.test(code)) return code.slice(0, 3)
  return code.length >= 2 ? code.slice(0, 2) : null
}

/**
 * The airline of a flight. The flight number decides; the name typed into the airline
 * field is only consulted when there is no flight number or its designator is unknown.
 */
export function airlineOf(flightNo: string | null | undefined, airlineName: string | null | undefined): Airline | null {
  const designator = airlineDesignator(flightNo)
  const byDesignator = designator ? BY_DESIGNATOR.get(designator) : undefined
  if (byDesignator) return byDesignator

  return (airlineName && BY_NAME.get(nameKey(airlineName))) || null
}
