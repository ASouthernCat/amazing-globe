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

    const camera = new THREE.PerspectiveCamera(65, sizes.width / sizes.height, 0.1, 500);
    camera.position.set(0, 0, 6);

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    const controlsFolder = pane.addFolder({title: 'controls'})
    controlsFolder.addBinding(controls, 'autoRotate')

    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);
    const light = new THREE.DirectionalLight(0xffffff, 3);
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

    // postprocessing
    const composer = new EffectComposer(renderer, {
        multisampling: 0
    })
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);
    // effect
    initEffect(composer, camera)

    function resetSceneSettings(){
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
    earthTypes['earth-github']() // default

    const earthFolder = pane.addFolder({title: 'earth'})
    earthFolder.addBlade({
        view: 'list',
        label: 'type',
        options: [
          {text: 'earth-simple', value: 'earth-simple'},
          {text: 'earth-threejs-journey', value: 'earth-threejs-journey'},
          {text: 'earth-github', value: 'earth-github'},
        ],
        value: 'earth-github',
    }).on('change', (ev)=>{
        for (let i=0; i< earthFolder.children.length; i++){
            if(i!=0) {
                earthFolder.children[i]?.dispose()
                earthFolder.children[i]?.element?.remove()
            }
        }
        earth && scene.remove(earth)
        resetSceneSettings()
        earthTypes[ev.value]()
    })

    async function ceateEarthSimple() {
        const { default: Earth } = await import('./globe/Earth-simple');
        earth = new Earth()
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
        })
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
                atmosphereColor: '#d0f2ff',
                atmosphereAltitude: 0.05,
                emissive: '#000000',
                emissiveIntensity: 0.1,
                shininess: 100,
                polygonColor: '#ffffff',
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
                arcsData: arcsData,
                pointsData: pointsData
            };
            earth = new Earth(globeConfig)
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
            basicFolder.addBinding(globeConfig, 'autoRotate').on('change', ev => {
                // autoRotate 配置已经通过共享的 config 对象自动更新
                console.log('自动旋转设置已更新:', ev.value)
            })
            basicFolder.addBinding(globeConfig, 'autoRotateSpeed', {min: 0.001, max: 0.1, step: 0.001}).on('change', ev => {
                // autoRotateSpeed 配置已经通过共享的 config 对象自动更新
                console.log('自动旋转速度已更新:', ev.value)
            })
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
            waveFolder.addBinding(globeConfig, 'waveDuration', {min: 1.0, max: 5.0, step: 0.1}).on('change', ev => {
                // waveDuration 配置已经通过共享的 config 对象自动更新
                console.log('波浪持续时间已更新:', ev.value)
            })
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
            flyingFolder.addBinding(globeConfig, 'arcTime', {min: 500, max: 4000, step: 10}).on('change', ev => {
                // arcTime 配置已经通过共享的 config 对象自动更新
                console.log('弧线动画时间已更新:', ev.value)
            })
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

    initResizeEventListener([camera], [renderer, composer]);

    const clock = new THREE.Clock();
    let delta = 0;
    let tickId = null;
    const render = (t) => {
        delta = clock.getDelta();

        stats.update();
        
        controls.update();

        earth && earth.update(delta);
        
        renderer.render(scene, camera);
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
