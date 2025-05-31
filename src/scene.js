import * as THREE from 'three';
import { pane } from './system/gui';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { sizes, initSizes } from './system/sizes';
import { clearResizeEventListener, initResizeEventListener } from './system/resize';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer, RenderPass } from 'postprocessing';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { initEffect } from './effect';
import { arcsData, majorTradeCities } from './globe/data/arcs';
import { flightRoutes } from './globe/data/flights';
import gsap from 'gsap';

function initScene() {
    console.log('initScene');

    const stats = new Stats();
    stats.showPanel(0);
    document.body.appendChild(stats.dom);

    const canvas = document.getElementById('webgl');
    initSizes(canvas);

    const sceneParameters = {
        bgColor: '#000',
    }
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(sceneParameters.bgColor);
    scene.backgroundBlurriness = 1;
    const envMapUrl = '/texture/royal_esplanade_1k.hdr' // 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/equirectangular/royal_esplanade_1k.hdr'
    const envMap = new RGBELoader().load(envMapUrl, (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.environment = texture;
        scene.environmentIntensity = 1;
    })
    const sceneFolder = pane.addFolder({title: 'scene'})
    sceneFolder.expanded = false
    sceneFolder.addBinding(scene, 'backgroundBlurriness', { step: 0.1, min: 0, max: 2 })
    sceneFolder.addBinding(sceneParameters, 'bgColor').on('change', ev=>{
        scene.background = new THREE.Color(ev.value);
    })
    sceneFolder.addBinding({ background: 'color'}, 'background', {
        options: { envMap: 'envMap', color: 'color'}
    }).on('change', (ev)=>{
        if (ev.value === 'envMap') scene.background = envMap;
        else scene.background = new THREE.Color(sceneParameters.bgColor);
    })

    let renderCamera = null;
    const camera = new THREE.PerspectiveCamera(65, sizes.width / sizes.height, 0.1, 1000);
    camera.position.set(0, 0, 6);
    renderCamera = camera;

    const controls = new OrbitControls(renderCamera, canvas);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.maxDistance = 980;
    sceneFolder.addBinding(controls, 'autoRotate', { label: 'controls.autoRotate' })

    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);
    const light = new THREE.DirectionalLight(0xffffff, 3);
    light.castShadow = false;
    light.position.set(-3, 2, -1);
    scene.add(light);
    sceneFolder.addBinding(light, 'intensity', { step: 0.1, min:0.1, max: 10, label: 'lightIntensity' });
    sceneFolder.addBinding(ambientLight, 'intensity', { step: 0.1, min:0.1, max: 5, label: 'ambientIntensity' });

    const renderer = new THREE.WebGLRenderer({
        canvas,
        powerPreference: "high-performance",
        antialias: true,
        // stencil: false,
        // depth: false,
        // alpha: false
    })
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = false

    // postprocessing
    const composer = new EffectComposer(renderer, {
        multisampling: 0
    })
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);
    // effect
    initEffect(composer, camera)

    function resetSceneSettings(){
        renderCamera = camera;
        camera.position.set(0, 0, 6);
        sceneParameters.bgColor = '#000';
        scene.background = new THREE.Color(sceneParameters.bgColor);
        ambientLight.intensity = 1;
        light.intensity = 3;
        sceneFolder.refresh();
    }

    // earth
    let earth = null;
    const earthTypes = {
        "earth-simple": ceateEarthSimple,
        "earth-threejs-journey": createEarthThreejsJourney,
        "earth-github": createEarthGithub
    }
    const defaultEarthType = 'earth-github';
    
    // 根据 earthTypes 动态生成 options
    const generateEarthOptions = () => {
        return Object.keys(earthTypes).map(key => ({
            text: key,
            value: key
        }));
    }

    earthTypes[defaultEarthType]() // default

    const earthFolder = pane.addFolder({title: 'earth'})
    earthFolder.addBlade({
        view: 'list',
        label: 'type',
        options: generateEarthOptions(),
        value: defaultEarthType, // default
    }).on('change', (ev)=>{
        for (let i=0; i< earthFolder.children.length; i++){
            if(i!=0) {
                earthFolder.children[i]?.dispose()
                earthFolder.children[i]?.element?.remove()
            }
        }
        if(earth) {
            scene.remove(earth)
            earth.dispose()
        }
        resetSceneSettings()
        earthTypes[ev.value]()
    })

    async function ceateEarthSimple() {
        const { default: Earth } = await import('./globe/Earth-simple');
        earth = new Earth(undefined, ()=>{
            earthEnterAnimation(earth)
        })
        onEarthLoading(earth)
        scene.add(earth)
    }

    async function createEarthThreejsJourney() {
        const { default: Earth } = await import('./globe/Earth-threejs-journey');
        const earthParameters = {}
        earthParameters.atmosphereDayColor = '#00aaff'
        earthParameters.atmosphereTwilightColor = '#ffa365'
        earth = new Earth({
            atmosphereDayColor: earthParameters.atmosphereDayColor,
            atmosphereTwilightColor: earthParameters.atmosphereTwilightColor
        }, ()=>{
            earthEnterAnimation(earth)
        })
        onEarthLoading(earth)
        scene.add(earth)
        earthFolder.addBinding(earthParameters, 'atmosphereDayColor').on('change', ev=>{
            earth.earthMaterial.uniforms.uAtmosphereDayColor.value.set(earthParameters.atmosphereDayColor)
            earth.atmosphereMaterial.uniforms.uAtmosphereDayColor.value.set(earthParameters.atmosphereDayColor)
        })
        earthFolder.addBinding(earthParameters, 'atmosphereTwilightColor').on('change', ev=>{
            earth.earthMaterial.uniforms.uAtmosphereTwilightColor.value.set(earthParameters.atmosphereTwilightColor)
            earth.atmosphereMaterial.uniforms.uAtmosphereTwilightColor.value.set(earthParameters.atmosphereTwilightColor)
        })
    }

    async function createEarthGithub() {
        try {
            const { default: Earth } = await import('./globe/Earth-github');

            camera.position.set(0, 100, -280)
            sceneParameters.bgColor = '#262f4c'
            scene.background = new THREE.Color(sceneParameters.bgColor)
            light.intensity = 4
            sceneFolder.refresh()

            // 从弧线数据生成点数据
            const pointsData = [];
            
            // 添加主要贸易城市
            majorTradeCities.forEach(city => {
                const color = city.importance === 'high' ? '#58fff3' : 
                             city.importance === 'medium' ? '#eaff4e' : '#c184ff';
                pointsData.push({
                    lat: city.lat,
                    lng: city.lng,
                    color: color,
                    size: city.importance === 'high' ? 1.5 : 1,
                    name: city.name,
                    region: city.region
                });
            });
            
            // 确保弧线端点也有对应的点
            arcsData.forEach(arc => {
                // 检查起点是否已存在
                const startExists = pointsData.some(point => 
                    Math.abs(point.lat - arc.startLat) < 0.01 && 
                    Math.abs(point.lng - arc.startLng) < 0.01
                );
                if (!startExists) {
                    pointsData.push({
                        lat: arc.startLat,
                        lng: arc.startLng,
                        color: arc.color,
                        size: 1
                    });
                }
                
                // 检查终点是否已存在
                const endExists = pointsData.some(point => 
                    Math.abs(point.lat - arc.endLat) < 0.01 && 
                    Math.abs(point.lng - arc.endLng) < 0.01
                );
                if (!endExists) {
                    pointsData.push({
                        lat: arc.endLat,
                        lng: arc.endLng,
                        color: arc.color,
                        size: 1
                    });
                }
            });

            const globeConfig = {
                radius: 100,
                segments: 64,
                pointSize: 0.5,
                globeColor: '#26398c',
                showAtmosphere: true,
                atmosphereColor: '#a6e6ff',
                atmosphereAltitude: 0.05,
                emissive: '#000000',
                emissiveIntensity: 0.1,
                shininess: 100,
                polygonColor: '#7df9ff',
                polygonOpacity: 0.1,
                arcTime: 2000,
                maxRings: 1.5,
                autoRotate: true,
                autoRotateSpeed: 0.05,
                // 飞线动画配置
                flyingLineLength: 20,
                showFlyingParticle: true,
                particleSize: 0.5,
                // 光波动画配置
                waveCount: 6,
                waveDuration: 2,
                waveDelay: 400,
                baseCircleScale: 1.0,
                ringThickness: 0.05,
                // 陆地点云配置
                showLandPoints: true,
                landPointSize: 1.0,
                landPointColor: '#9afaff',
                landPointDensity: 1.0,
                landPointOpacity: 0.8,
                // 飞机航线配置
                showFlightRoutes: true,
                flightRoutesData: flightRoutes,
                flightAnimationSpeed: 0.1,
                flightPauseTime: 2000,
                airplaneScale: 0.01,
                arcsData: arcsData,
                pointsData: pointsData,
                airplaneRotationAdjustment: 0
            };
            earth = new Earth(globeConfig, ()=>{
                earthEnterAnimation(earth)
            })
            onEarthLoading(earth)
            scene.add(earth)

            // 调试            
            // 地球基本控制
            const basicFolder = earthFolder.addFolder({title: '地球基本设置'})
            // 地球颜色
            basicFolder.addBinding(globeConfig, 'globeColor').on('change', ev => {
                earth.earthMaterial.color.set(ev.value)
            })
            // 大气颜色
            basicFolder.addBinding(globeConfig, 'atmosphereColor').on('change', ev => {
                earth.atmosphere.material.uniforms.glowColor.value.set(ev.value)
            })
            basicFolder.addBinding(globeConfig, 'autoRotate')
            basicFolder.addBinding(globeConfig, 'autoRotateSpeed', {min: 0.001, max: 0.1, step: 0.001})
            basicFolder.addBinding(globeConfig, 'showAtmosphere').on('change', ev => {
                earth.atmosphere.visible = ev.value
            })
            basicFolder.addBinding(globeConfig, 'atmosphereAltitude', {min: 0.01, max: 0.3, step: 0.01}).on('change', ev => {
                // 重新创建大气层
                if (earth.atmosphere) {
                    earth.remove(earth.atmosphere)
                    earth.createAtmosphere()
                }
            })
            basicFolder.addBinding(globeConfig, 'pointSize', {min: 0.1, max: 2.0, step: 0.1}).on('change', ev => {
                // 重新创建点以应用新设置
                if (earth.pointsGroup) {
                    earth.remove(earth.pointsGroup)
                    earth.createPoints()
                }
            })
            basicFolder.addBinding(globeConfig, 'maxRings', {min: 0.5, max: 5.0, step: 0.1}).on('change', ev => {
                // 重新创建圆环以应用新设置
                if (earth.ringsGroup) {
                    earth.remove(earth.ringsGroup)
                    earth.createRings()
                }
            })
            
            // 国家边界控制
            const borderFolder = earthFolder.addFolder({title: '国家边界'})
            borderFolder.expanded = false
            
            // 边界颜色控制
            borderFolder.addBinding(globeConfig, 'polygonColor', {
                label: '边界颜色'
            }).on('change', ev => {
                if (earth.countriesGroup) {
                    earth.countriesGroup.children.forEach(child => {
                        if (child.material && child.material.color) {
                            child.material.color.set(ev.value);
                        }
                    });
                }
            });
            
            // 边界透明度控制
            borderFolder.addBinding(globeConfig, 'polygonOpacity', {
                min: 0.01,
                max: 1.0,
                step: 0.01,
                label: '边界透明度'
            }).on('change', ev => {
                if (earth.countriesGroup) {
                    earth.countriesGroup.children.forEach(child => {
                        if (child.material && child.material.opacity !== undefined) {
                            child.material.opacity = ev.value;
                            child.material.needsUpdate = true;
                        }
                    });
                }
            });
            
            // 显示/隐藏国家边界
            const borderVisibility = { showBorders: true };
            borderFolder.addBinding(borderVisibility, 'showBorders', {
                label: '显示边界'
            }).on('change', ev => {
                if (earth.countriesGroup) {
                    earth.countriesGroup.visible = ev.value;
                }
            });
            
            // 光波动画控制
            const waveFolder = earthFolder.addFolder({title: '光波动画'})
            waveFolder.expanded = false
            waveFolder.addBinding(globeConfig, 'waveCount', {min: 1, max: 6, step: 1}).on('change', ev => {
                // 重新创建圆环以应用新设置
                if (earth.ringsGroup) {
                    earth.remove(earth.ringsGroup)
                    earth.createRings()
                }
            })
            waveFolder.addBinding(globeConfig, 'waveDuration', {min: 1.0, max: 5.0, step: 0.1})
            waveFolder.addBinding(globeConfig, 'waveDelay', {min: 200, max: 1500, step: 50}).on('change', ev => {
                // 重新创建圆环以应用新设置
                if (earth.ringsGroup) {
                    earth.remove(earth.ringsGroup)
                    earth.createRings()
                }
            })
            waveFolder.addBinding(globeConfig, 'baseCircleScale', {min: 0.1, max: 1.5, step: 0.05}).on('change', ev => {
                // 重新创建圆环以应用新设置
                if (earth.ringsGroup) {
                    earth.remove(earth.ringsGroup)
                    earth.createRings()
                }
            })
            waveFolder.addBinding(globeConfig, 'ringThickness', {min: 0.05, max: 0.5, step: 0.01}).on('change', ev => {
                // 重新创建圆环以应用新设置
                if (earth.ringsGroup) {
                    earth.remove(earth.ringsGroup)
                    earth.createRings()
                }
            })
            
            // 飞线动画控制
            const flyingFolder = earthFolder.addFolder({title: '飞线动画'})
            flyingFolder.expanded = false
            flyingFolder.addBinding(globeConfig, 'arcTime', {min: 500, max: 4000, step: 10})
            flyingFolder.addBinding(globeConfig, 'flyingLineLength', {min: 5, max: 50, step: 1}).on('change', ev => {
                // 重新创建弧线以应用新设置
                if (earth.arcsGroup) {
                    earth.remove(earth.arcsGroup)
                    earth.createArcs()
                }
            })
            flyingFolder.addBinding(globeConfig, 'showFlyingParticle').on('change', ev => {
                // 重新创建弧线以应用新设置
                if (earth.arcsGroup) {
                    earth.remove(earth.arcsGroup)
                    earth.createArcs()
                }
            })
            flyingFolder.addBinding(globeConfig, 'particleSize', {min: 0.1, max: 2.0, step: 0.1}).on('change', ev => {
                // 重新创建弧线以应用新设置
                if (earth.arcsGroup) {
                    earth.remove(earth.arcsGroup)
                    earth.createArcs()
                }
            })

            // 陆地点云控制
            const landPointsFolder = earthFolder.addFolder({title: '陆地点云'})
            landPointsFolder.expanded = false
            
            // 显示/隐藏陆地点云
            landPointsFolder.addBinding(globeConfig, 'showLandPoints').on('change', ev => {
                earth.updateLandPointsVisibility(ev.value);
            });
            
            // 点云大小控制
            landPointsFolder.addBinding(globeConfig, 'landPointSize', {
                min: 0.1, 
                max: 3.0, 
                step: 0.1,
                label: '点大小'
            }).on('change', async (ev) => {
                if (earth.landPoints && earth.landPoints.material) {
                    earth.landPoints.material.size = ev.value;
                    earth.landPoints.material.needsUpdate = true;
                }
            });
            
            // 点云颜色控制
            landPointsFolder.addBinding(globeConfig, 'landPointColor', {
                label: '点颜色'
            }).on('change', async (ev) => {
                if (earth.landPoints && earth.landPoints.material) {
                    earth.landPoints.material.color.set(ev.value);
                    earth.landPoints.material.needsUpdate = true;
                }
            });
            
            // 点云密度控制（需要重新生成）
            landPointsFolder.addBinding(globeConfig, 'landPointDensity', {
                min: 0.5, 
                max: 3.0, 
                step: 0.1,
                label: '点密度'
            }).on('change', async (ev) => {
                // 密度改变需要重新创建点云
                if (earth.config.showLandPoints) {
                    await earth.recreateLandPoints();
                }
            });
            
            // 点云透明度控制
            landPointsFolder.addBinding(globeConfig, 'landPointOpacity', {
                min: 0.1,
                max: 1.0,
                step: 0.05,
                label: '透明度'
            }).on('change', (ev) => {
                if (earth.landPoints && earth.landPoints.material) {
                    earth.landPoints.material.opacity = ev.value;
                    earth.landPoints.material.needsUpdate = true;
                }
            });

            // 点云统计信息
            const landPointStats = { pointCount: 0 };
            landPointsFolder.addBinding(landPointStats, 'pointCount', {
                readonly: true,
                label: '点数量'
            });
            
            // 更新点云统计的函数
            const updateLandPointStats = () => {
                if (earth.landPoints && earth.landPoints.geometry) {
                    const positions = earth.landPoints.geometry.attributes.position;
                    landPointStats.pointCount = positions ? positions.count : 0;
                    landPointsFolder.refresh();
                }
            };
            
            // 重置陆地点云参数
            landPointsFolder.addButton({
                title: '重置参数'
            }).on('click', async () => {
                // 重置配置到默认值
                globeConfig.showLandPoints = true;
                globeConfig.landPointSize = 1.0;
                globeConfig.landPointColor = '#ffffff';
                globeConfig.landPointDensity = 1.0;
                globeConfig.landPointOpacity = 0.8;
                
                // 刷新控制面板
                landPointsFolder.refresh();
                
                // 重新创建陆地点云
                await earth.recreateLandPoints();
                updateLandPointStats();
            });
            
            // 强制刷新陆地点云
            landPointsFolder.addButton({
                title: '刷新点云'
            }).on('click', async () => {
                await earth.recreateLandPoints();
                updateLandPointStats();
            });
            
            // 初始统计更新
            setTimeout(updateLandPointStats, 1000);

            // 飞机航线控制
            const flightFolder = earthFolder.addFolder({title: '飞机航线'})
            flightFolder.expanded = false
            
            // 显示/隐藏飞机航线
            flightFolder.addBinding(globeConfig, 'showFlightRoutes', {
                label: '显示航线'
            }).on('change', ev => {
                if (earth.flightRoutesGroup) {
                    earth.flightRoutesGroup.visible = ev.value;
                }
            });
            
            // 飞行速度控制
            flightFolder.addBinding(globeConfig, 'flightAnimationSpeed', {
                min: 0.001,
                max: 1,
                step: 0.001,
                label: '飞行速度'
            });
            
            // 暂停时间控制
            flightFolder.addBinding(globeConfig, 'flightPauseTime', {
                min: 1000,
                max: 5000,
                step: 100,
                label: '暂停时间(ms)'
            });
            
            // 飞机大小控制
            flightFolder.addBinding(globeConfig, 'airplaneScale', {
                min: 0.05,
                max: 0.3,
                step: 0.01,
                label: '飞机大小'
            }).on('change', ev => {
                if (earth.flightRouteInstances) {
                    earth.flightRouteInstances.forEach(instance => {
                        if (instance.airplane) {
                            instance.airplane.scale.setScalar(ev.value);
                        }
                    });
                }
            });

            // 飞机朝向调整控制
            flightFolder.addBinding(globeConfig, 'airplaneRotationAdjustment', {
                min: -Math.PI,
                max: Math.PI,
                step: 0.1,
                label: '朝向调整',
                format: (v) => `${(v * 180 / Math.PI).toFixed(1)}°`
            });
            
            // 航线统计信息
            const flightStats = {
                activeRoutes: flightRoutes.length,
                totalDistance: '约45,000公里'
            };
            
            flightFolder.addBinding(flightStats, 'activeRoutes', {
                readonly: true,
                label: '活跃航线',
                format: (v) => v.toFixed(0),
            });
            
            flightFolder.addBinding(flightStats, 'totalDistance', {
                readonly: true,
                label: '总里程'
            });

            const flightOpitons = flightRoutes.map(route => {
                return {
                    text: route.name,
                    value: route.id
                }
            })
            flightOpitons.push({
                text: '默认视角',
                value: 'default'
            })
            flightFolder.addBlade({
                view: 'list',
                label: '飞行视角',
                options: flightOpitons,
                value: 'default',
            }).on('change', (ev)=>{
                if(ev.value === 'default'){
                    renderCamera = camera;
                    globeConfig.pointSize = 0.5;
                    globeConfig.showFlyingParticle = true;
                }else{
                    renderCamera = earth.flightRouteInstances.find(instance => instance.route.id === ev.value).airplane.userData.camera;
                    globeConfig.pointSize = 0.2;
                    globeConfig.showFlyingParticle = false;
                }
                // 重新创建弧线以应用新设置
                if (earth.arcsGroup) {
                    earth.remove(earth.arcsGroup)
                    earth.createArcs()
                }
                // 重新创建点以应用新设置
                if (earth.pointsGroup) {
                    earth.remove(earth.pointsGroup)
                    earth.createPoints()
                }
            })

            // 贸易数据统计
            const tradeFolder = earthFolder.addFolder({title: '贸易数据统计'})
            tradeFolder.expanded = false
            // 创建统计数据对象
            const tradeStats = {
                totalRoutes: arcsData.length,
                totalCities: majorTradeCities.length,
                highImportanceCities: majorTradeCities.filter(c => c.importance === 'high').length,
                regions: [...new Set(majorTradeCities.map(c => c.region))].length
            };
            
            // 使用 addBinding 显示只读统计信息
            tradeFolder.addBinding(tradeStats, 'totalRoutes', {
                readonly: true,
                label: '贸易路线总数'
            });
            tradeFolder.addBinding(tradeStats, 'totalCities', {
                readonly: true,
                label: '贸易城市总数'
            });
            tradeFolder.addBinding(tradeStats, 'highImportanceCities', {
                readonly: true,
                label: '重要城市数量'
            });
            tradeFolder.addBinding(tradeStats, 'regions', {
                readonly: true,
                label: '覆盖地区数'
            });

        } catch (error) {
            console.error('Error creating Earth:', error);
        }
    }

    function onEarthLoading(earth){
        document.querySelector('.loader-container').classList.remove('loaded')
        earth.visible = false
    }

    /**
     * 
     * @param {THREE.Object3D} earth 
     */
    function earthEnterAnimation(earth) {
        earth.visible = false
        document.querySelector('.loader-container').classList.add('loaded')

        const earthTimeline = gsap.timeline()
        earthTimeline.delay(0.5)
        earthTimeline.eventCallback('onStart', ()=>{
            earth.scale.set(0.01, 0.01, 0.01)
            earth.visible = true
        })
        
        // 第一阶段：从极小放大到超过正常大小（1.3倍）
        earthTimeline.to(earth.scale, {
            duration: 1.0,
            ease: 'power2.inOut',
            x: 1.3,
            y: 1.3,
            z: 1.3
        })
        
        // 第二阶段：快速收缩到正常大小（1倍），形成弹性效果
        earthTimeline.to(earth.scale, {
            duration: 0.6,
            ease: 'back.out(3.0)',
            x: 1,
            y: 1,
            z: 1
        }, '-=0.2') // 稍微重叠开始时间，使动画更流畅
        
        // 旋转动画：在整个缩放过程中持续旋转
        earthTimeline.to(earth.rotation, {
            duration: 2.5,
            ease: 'power3.out',
            y: Math.PI * 10
        }, 0) // 从动画开始时就开始旋转
    }

    initResizeEventListener([camera], [renderer, composer]);

    const clock = new THREE.Clock();
    let delta = 0;
    let tickId = null;
    const render = (t) => {
        delta = clock.getDelta();

        stats.update();
        
        controls.update();

        earth && earth.update(delta);
        
        renderer.render(scene, renderCamera);
        // composer.render();

        tickId = requestAnimationFrame(render);
    }

    render();

    function dispose(){
        stats.dom.remove()
        clearResizeEventListener()
        cancelAnimationFrame(tickId)
        scene.traverse(child => {
            if (child instanceof THREE.Mesh) {
                child.geometry.dispose()
                child.material.dispose()
            }
        })
        scene.clear()
        renderer.dispose()
        controls.dispose()
        composer.dispose()
    }

    return {
        dispose
    }
}

export { initScene };
