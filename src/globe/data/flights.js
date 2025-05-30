// 飞机航线数据
export const flightRoutes = [
    {
        id: 'LAX-SHA',
        name: '洛杉矶--上海',
        startLat: 33.9425, // 洛杉矶
        startLng: -118.4081,
        endLat: 31.2304, // 上海
        endLng: 121.4737,
        color: '#00ff88',
        arcAlt: 0.3
    },
    {
        id: 'SIN-LHR',
        name: '新加坡--伦敦',
        startLat: 1.3521, // 新加坡
        startLng: 103.8198,
        endLat: 51.4700, // 伦敦
        endLng: -0.4543,
        color: '#cfff6d',
        arcAlt: 0.25
    },
    {
        id: 'NRT-JFK',
        name: '东京--纽约',
        startLat: 35.7647, // 东京成田
        startLng: 140.3864,
        endLat: 40.6413, // 纽约JFK
        endLng: -73.7781,
        color: '#70c1ff',
        arcAlt: 0.35
    }
]; 