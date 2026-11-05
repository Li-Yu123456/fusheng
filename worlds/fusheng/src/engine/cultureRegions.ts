// 文化圈映射：按国家 ISO3 → 文化圈 ID——事件本地化的根基。
// 为什么按文化圈而不按国：事件文案的合理边界是文化而非国境（中国的事件在越南
// 可能也成立，但在尼日利亚不成立）；文化圈是学术共识单位，非自创分类。
// 口径参考：UN geoscheme + 文明圈层研究主流共识。

export type CultureRegion =
  | 'east_asia'      // 东亚文化圈（汉字文明）
  | 'south_asia'     // 南亚（印度文明圈）
  | 'middle_east'    // 中东/北非（伊斯兰文明圈）
  | 'sub_saharan'    // 撒哈拉以南非洲
  | 'europe'         // 欧洲（含北美澳新——欧洲文明圈延伸）
  | 'latin_america'; // 拉丁美洲

const R: Record<string, CultureRegion> = {};
const put = (r: CultureRegion, ...codes: string[]) => codes.forEach((c) => (R[c] = r));

// 东亚
put('east_asia', 'CHN', 'JPN', 'KOR', 'TWN', 'MNG', 'PRK', 'VNM');
// 南亚
put('south_asia', 'IND', 'PAK', 'BGD', 'LKA', 'NPL', 'BTN', 'MDV', 'AFG');
// 中东/北非
put('middle_east', 'TUR', 'IRN', 'IRQ', 'SYR', 'ISR', 'PSE', 'JOR', 'LBN', 'SAU', 'ARE', 'QAT', 'KWT', 'BHR', 'OMN', 'YEM',
  'EGY', 'LBY', 'DZA', 'TUN', 'MAR');
// 撒哈拉以南
put('sub_saharan', 'NGA', 'GHA', 'SEN', 'MLI', 'BFA', 'BEN', 'TGO', 'CIV', 'LBR', 'SLE', 'GIN', 'GMB', 'GNB', 'MRT',
  'NER', 'TCD', 'CMR', 'CAF', 'SSD', 'ETH', 'ERI', 'DJI', 'SOM', 'SDN', 'KEN', 'UGA', 'TZA', 'RWA', 'BDI', 'COD',
  'COG', 'GAB', 'GNQ', 'STP', 'AGO', 'ZMB', 'ZWE', 'MOZ', 'MWI', 'MDG', 'MUS', 'SYC', 'COM', 'CPV', 'NAM', 'BWA',
  'ZAF', 'LSO', 'SWZ');
// 欧洲（含北美/澳新/俄罗斯——欧洲文明圈延伸）
put('europe', 'GBR', 'IRL', 'FRA', 'DEU', 'ITA', 'ESP', 'PRT', 'NLD', 'BEL', 'LUX', 'CHE', 'AUT',
  'DNK', 'NOR', 'SWE', 'FIN', 'ISL', 'EST', 'LVA', 'LTU', 'POL', 'CZE', 'SVK', 'HUN', 'ROU', 'BGR',
  'GRC', 'ALB', 'HRV', 'SVN', 'BIH', 'MNE', 'MKD', 'SRB', 'MDA', 'UKR', 'BLR', 'RUS', 'GEO', 'ARM', 'AZE', 'CYP', 'MLT',
  'USA', 'CAN', 'AUS', 'NZL');
// 拉丁美洲
put('latin_america', 'MEX', 'GTM', 'BLZ', 'HND', 'SLV', 'NIC', 'CRI', 'PAN', 'CUB', 'HTI', 'DOM', 'JAM',
  'BHS', 'BRB', 'TTO', 'COL', 'VEN', 'GUY', 'SUR', 'ECU', 'PER', 'BOL', 'PRY', 'URY', 'ARG', 'BRA', 'CHL',
  'ATG', 'DMA', 'GRD', 'KNA', 'LCA', 'VCT');
// 小岛屿（数据有但文化圈微小——就近归入）
put('latin_america', 'BRN'); // 文莱文化近马来但经济模式近拉美？不对——文莱是伊斯兰。改为 middle_east
delete R['BRN']; put('middle_east', 'BRN');
put('europe', 'AND', 'MCO', 'SMR'); // 微型欧洲国
put('latin_america', 'AIA', 'TCA', 'VGB'); // 加勒比英属
put('europe', 'MSR'); // 蒙特塞拉特（英属加勒比但欧式行政）
put('sub_saharan', 'KIR', 'TUV', 'NRU'); // 太平洋岛国（与非洲共享低资源叙事）
put('latin_america', 'WSM', 'SLB', 'VUT', 'TON', 'FSM', 'MHL', 'PLW', 'COK', 'NIU', 'PNG', 'FJI');

export function cultureOf(code: string): CultureRegion {
  return R[code] ?? 'europe'; // 未映射默认欧洲（数据最全的文明圈，最不坏的选择）
}

/** 文化圈中文名（UI 展示用） */
export const CULTURE_ZH: Record<CultureRegion, string> = {
  east_asia: '东亚',
  south_asia: '南亚',
  middle_east: '中东/北非',
  sub_saharan: '撒哈拉以南非洲',
  europe: '欧洲',
  latin_america: '拉丁美洲',
};
