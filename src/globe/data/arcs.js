// 世界主要贸易城市交易数据
// 模拟全球贸易网络中的主要航线和贸易连接

export const arcsData = [
    // 亚太地区主要贸易路线
    {
        order: 1,
        startLat: 31.2304, // 上海
        startLng: 121.4737,
        endLat: 35.6762, // 东京
        endLng: 139.6503,
        arcAlt: 0.2,
        color: '#58fff3',
        tradeName: '上海-东京'
    },
    {
        order: 2,
        startLat: 22.3193, // 香港
        startLng: 114.1694,
        endLat: 1.3521, // 新加坡
        endLng: 103.8198,
        arcAlt: 0.25,
        color: '#3fffb5',
        tradeName: '香港-新加坡'
    },
    {
        order: 3,
        startLat: 37.5665, // 首尔
        startLng: 126.9780,
        endLat: -33.8688, // 悉尼
        endLng: 151.2093,
        arcAlt: 0.3,
        color: '#eaff4e',
        tradeName: '首尔-悉尼'
    },
    
    // 跨太平洋贸易路线
    {
        order: 4,
        startLat: 37.7749, // 旧金山
        startLng: -122.4194,
        endLat: 31.2304, // 上海
        endLng: 121.4737,
        arcAlt: 0.32,
        color: '#6b81ff',
        tradeName: '旧金山-上海'
    },
    {
        order: 5,
        startLat: 34.0522, // 洛杉矶
        startLng: -118.2437,
        endLat: 35.6762, // 东京
        endLng: 139.6503,
        arcAlt: 0.28,
        color: '#58fff3',
        tradeName: '洛杉矶-东京'
    },
    {
        order: 6,
        startLat: 47.6062, // 西雅图
        startLng: -122.3321,
        endLat: 37.5665, // 首尔
        endLng: 126.9780,
        arcAlt: 0.3,
        color: '#3fffb5',
        tradeName: '西雅图-首尔'
    },
    
    // 跨大西洋贸易路线
    {
        order: 7,
        startLat: 40.7128, // 纽约
        startLng: -74.0060,
        endLat: 51.5074, // 伦敦
        endLng: -0.1278,
        arcAlt: 0.25,
        color: '#eaff4e',
        tradeName: '纽约-伦敦'
    },
    {
        order: 8,
        startLat: 52.5200, // 柏林
        startLng: 13.4050,
        endLat: 40.7128, // 纽约
        endLng: -74.0060,
        arcAlt: 0.28,
        color: '#6b81ff',
        tradeName: '柏林-纽约'
    },
    {
        order: 9,
        startLat: 48.8566, // 巴黎
        startLng: 2.3522,
        endLat: 25.7617, // 迈阿密
        endLng: -80.1918,
        arcAlt: 0.32,
        color: '#58fff3',
        tradeName: '巴黎-迈阿密'
    },
    
    // 欧亚贸易路线
    {
        order: 10,
        startLat: 55.7558, // 莫斯科
        startLng: 37.6176,
        endLat: 39.9042, // 北京
        endLng: 116.4074,
        arcAlt: 0.22,
        color: '#3fffb5',
        tradeName: '莫斯科-北京'
    },
    {
        order: 11,
        startLat: 52.5200, // 柏林
        startLng: 13.4050,
        endLat: 28.6139, // 德里
        endLng: 77.2090,
        arcAlt: 0.3,
        color: '#eaff4e',
        tradeName: '柏林-德里'
    },
    {
        order: 12,
        startLat: 41.9028, // 罗马
        startLng: 12.4964,
        endLat: 25.2048, // 迪拜
        endLng: 55.2708,
        arcAlt: 0.25,
        color: '#6b81ff',
        tradeName: '罗马-迪拜'
    },
    
    // 中东-亚洲贸易路线
    {
        order: 13,
        startLat: 25.2048, // 迪拜
        startLng: 55.2708,
        endLat: 19.0760, // 孟买
        endLng: 72.8777,
        arcAlt: 0.18,
        color: '#58fff3',
        tradeName: '迪拜-孟买'
    },
    {
        order: 14,
        startLat: 25.2048, // 迪拜
        startLng: 55.2708,
        endLat: 1.3521, // 新加坡
        endLng: 103.8198,
        arcAlt: 0.32,
        color: '#3fffb5',
        tradeName: '迪拜-新加坡'
    },
    
    // 南美-北美贸易路线
    {
        order: 15,
        startLat: -23.5505, // 圣保罗
        startLng: -46.6333,
        endLat: 25.7617, // 迈阿密
        endLng: -80.1918,
        arcAlt: 0.28,
        color: '#eaff4e',
        tradeName: '圣保罗-迈阿密'
    },
    {
        order: 16,
        startLat: -34.6037, // 布宜诺斯艾利斯
        startLng: -58.3816,
        endLat: 40.7128, // 纽约
        endLng: -74.0060,
        arcAlt: 0.32,
        color: '#6b81ff',
        tradeName: '布宜诺斯艾利斯-纽约'
    },
    
    // 非洲-欧洲贸易路线
    {
        order: 17,
        startLat: -33.9249, // 开普敦
        startLng: 18.4241,
        endLat: 51.5074, // 伦敦
        endLng: -0.1278,
        arcAlt: 0.34,
        color: '#58fff3',
        tradeName: '开普敦-伦敦'
    },
    {
        order: 18,
        startLat: 30.0444, // 开罗
        startLng: 31.2357,
        endLat: 41.9028, // 罗马
        endLng: 12.4964,
        arcAlt: 0.2,
        color: '#3fffb5',
        tradeName: '开罗-罗马'
    },
    
    // 澳洲-亚洲贸易路线
    {
        order: 19,
        startLat: -37.8136, // 墨尔本
        startLng: 144.9631,
        endLat: 22.3193, // 香港
        endLng: 114.1694,
        arcAlt: 0.32,
        color: '#eaff4e',
        tradeName: '墨尔本-香港'
    },
    {
        order: 20,
        startLat: -33.8688, // 悉尼
        startLng: 151.2093,
        endLat: 1.3521, // 新加坡
        endLng: 103.8198,
        arcAlt: 0.28,
        color: '#6b81ff',
        tradeName: '悉尼-新加坡'
    },
    
    // 加拿大-欧洲贸易路线
    {
        order: 21,
        startLat: 43.6532, // 多伦多
        startLng: -79.3832,
        endLat: 52.5200, // 柏林
        endLng: 13.4050,
        arcAlt: 0.3,
        color: '#58fff3',
        tradeName: '多伦多-柏林'
    },
    {
        order: 22,
        startLat: 49.2827, // 温哥华
        startLng: -123.1207,
        endLat: 35.6762, // 东京
        endLng: 139.6503,
        arcAlt: 0.32,
        color: '#3fffb5',
        tradeName: '温哥华-东京'
    },
    
    // 印度-东南亚贸易路线
    {
        order: 23,
        startLat: 19.0760, // 孟买
        startLng: 72.8777,
        endLat: 13.7563, // 曼谷
        endLng: 100.5018,
        arcAlt: 0.15,
        color: '#eaff4e',
        tradeName: '孟买-曼谷'
    },
    {
        order: 24,
        startLat: 28.6139, // 德里
        startLng: 77.2090,
        endLat: -6.2088, // 雅加达
        endLng: 106.8456,
        arcAlt: 0.28,
        color: '#6b81ff',
        tradeName: '德里-雅加达'
    }
];

// 主要贸易城市数据
export const majorTradeCities = [
    // 亚洲
    { name: '上海', lat: 31.2304, lng: 121.4737, region: 'Asia', importance: 'high' },
    { name: '东京', lat: 35.6762, lng: 139.6503, region: 'Asia', importance: 'high' },
    { name: '香港', lat: 22.3193, lng: 114.1694, region: 'Asia', importance: 'high' },
    { name: '新加坡', lat: 1.3521, lng: 103.8198, region: 'Asia', importance: 'high' },
    { name: '首尔', lat: 37.5665, lng: 126.9780, region: 'Asia', importance: 'medium' },
    { name: '北京', lat: 39.9042, lng: 116.4074, region: 'Asia', importance: 'high' },
    { name: '孟买', lat: 19.0760, lng: 72.8777, region: 'Asia', importance: 'medium' },
    { name: '德里', lat: 28.6139, lng: 77.2090, region: 'Asia', importance: 'medium' },
    
    // 北美
    { name: '纽约', lat: 40.7128, lng: -74.0060, region: 'North America', importance: 'high' },
    { name: '旧金山', lat: 37.7749, lng: -122.4194, region: 'North America', importance: 'medium' },
    { name: '洛杉矶', lat: 34.0522, lng: -118.2437, region: 'North America', importance: 'medium' },
    { name: '西雅图', lat: 47.6062, lng: -122.3321, region: 'North America', importance: 'medium' },
    { name: '多伦多', lat: 43.6532, lng: -79.3832, region: 'North America', importance: 'medium' },
    { name: '温哥华', lat: 49.2827, lng: -123.1207, region: 'North America', importance: 'medium' },
    
    // 欧洲
    { name: '伦敦', lat: 51.5074, lng: -0.1278, region: 'Europe', importance: 'high' },
    { name: '柏林', lat: 52.5200, lng: 13.4050, region: 'Europe', importance: 'medium' },
    { name: '巴黎', lat: 48.8566, lng: 2.3522, region: 'Europe', importance: 'high' },
    { name: '罗马', lat: 41.9028, lng: 12.4964, region: 'Europe', importance: 'medium' },
    { name: '莫斯科', lat: 55.7558, lng: 37.6176, region: 'Europe', importance: 'medium' },
    
    // 中东
    { name: '迪拜', lat: 25.2048, lng: 55.2708, region: 'Middle East', importance: 'high' },
    
    // 大洋洲
    { name: '悉尼', lat: -33.8688, lng: 151.2093, region: 'Oceania', importance: 'medium' },
    { name: '墨尔本', lat: -37.8136, lng: 144.9631, region: 'Oceania', importance: 'medium' }
];