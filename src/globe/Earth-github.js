import * as THREE from 'three';

import atmosphereFragmentShader from './shader/simple-earth/atmosphere.fs';
import atmosphereVertexShader from './shader/simple-earth/atmosphere.vs';

import countries from './data/globe.json';

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

const gltfLoader = new GLTFLoader()
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('/draco/')
gltfLoader.setDRACOLoader(dracoLoader)

export default class Earth extends THREE.Object3D {
    /**
     * EarthGlobe - 3D地球
     * @param {{
     *   radius?: number,
     *   segments?: number,
     *   pointSize?: number,
     *   globeColor?: string,
     *   showAtmosphere?: boolean,
     *   atmosphereColor?: string,
     *   atmosphereAltitude?: number,
     *   emissive?: string,
     *   emissiveIntensity?: number,
     *   shininess?: number,
     *   polygonColor?: string,
     *   polygonOpacity?: number,
     *   arcTime?: number,
     *   maxRings?: number,
     *   autoRotate?: boolean,
     *   autoRotateSpeed?: number,
     *   flyingLineLength?: number,
     *   showFlyingParticle?: boolean,
     *   particleSize?: number,
     *   waveCount?: number,
     *   waveDuration?: number,
     *   waveDelay?: number,
     *   baseCircleScale?: number,
     *   ringThickness?: number,
     *   countriesData?: any,
     *   arcsData?: any[],
     *   pointsData?: any[],
     *   showLandPoints?: boolean,
     *   landPointSize?: number,
     *   landPointColor?: string,
     *   landPointDensity?: number,
     *   landPointOpacity?: number,
     *   showFlightRoutes?: boolean,
     *   flightRoutesData?: any[],
     *   flightAnimationSpeed?: number,
     *   flightPauseTime?: number,
     *   airplaneScale?: number,
     *   airplaneRotationAdjustment?: number,
     * }} config 
     * @param {Function} onLoad - 加载完成回调函数
     */
    constructor(config = {}, onLoad = () => {}) {
        super();
        
        const {
            radius = 100,
            segments = 64,
            pointSize = 1,
            globeColor = '#1d072e',
            showAtmosphere = true,
            atmosphereColor = '#ffffff',
            atmosphereAltitude = 0.1,
            emissive = '#000000',
            emissiveIntensity = 0.1,
            shininess = 50,
            polygonColor = '#ffffff',
            polygonOpacity = 0.05,
            arcTime = 2000,
            maxRings = 3,
            autoRotate = true,
            autoRotateSpeed = 0.01,
            flyingLineLength = 20,
            showFlyingParticle = true,
            particleSize = 0.5,
            waveCount = 3,
            waveDuration = 2.5,
            waveDelay = 800,
            baseCircleScale = 0.3,
            ringThickness = 0.15,
            countriesData = countries,
            arcsData = [],
            pointsData = [],
            showLandPoints = true,
            landPointSize = 1.0,
            landPointColor = '#ffffff',
            landPointDensity = 1.0,
            landPointOpacity = 0.8,
            showFlightRoutes = false,
            flightRoutesData = [],
            flightAnimationSpeed = 0.01,
            flightPauseTime = 2000,
            airplaneScale = 0.01,
            airplaneRotationAdjustment = 0,
        } = config;

        this.name = 'EarthGlobe';
        this.radius = radius;
        this.segments = segments;
        this.config = config;

        this.hasLoaded = false;
        this.onLoad = ()=>{
            if(!this.hasLoaded){
                onLoad()
                this.hasLoaded = true
            }
        };
        
        // 为未设置的属性设置默认值
        Object.assign(this.config, {
            pointSize: this.config.pointSize ?? pointSize,
            globeColor: this.config.globeColor ?? globeColor,
            showAtmosphere: this.config.showAtmosphere ?? showAtmosphere,
            atmosphereColor: this.config.atmosphereColor ?? atmosphereColor,
            atmosphereAltitude: this.config.atmosphereAltitude ?? atmosphereAltitude,
            emissive: this.config.emissive ?? emissive,
            emissiveIntensity: this.config.emissiveIntensity ?? emissiveIntensity,
            shininess: this.config.shininess ?? shininess,
            polygonColor: this.config.polygonColor ?? polygonColor,
            polygonOpacity: this.config.polygonOpacity ?? polygonOpacity,
            arcTime: this.config.arcTime ?? arcTime,
            maxRings: this.config.maxRings ?? maxRings,
            autoRotate: this.config.autoRotate ?? autoRotate,
            autoRotateSpeed: this.config.autoRotateSpeed ?? autoRotateSpeed,
            flyingLineLength: this.config.flyingLineLength ?? flyingLineLength,
            showFlyingParticle: this.config.showFlyingParticle ?? showFlyingParticle,
            particleSize: this.config.particleSize ?? particleSize,
            waveCount: this.config.waveCount ?? waveCount,
            waveDuration: this.config.waveDuration ?? waveDuration,
            waveDelay: this.config.waveDelay ?? waveDelay,
            baseCircleScale: this.config.baseCircleScale ?? baseCircleScale,
            ringThickness: this.config.ringThickness ?? ringThickness,
            showLandPoints: this.config.showLandPoints ?? showLandPoints,
            landPointSize: this.config.landPointSize ?? landPointSize,
            landPointColor: this.config.landPointColor ?? landPointColor,
            landPointDensity: this.config.landPointDensity ?? landPointDensity,
            landPointOpacity: this.config.landPointOpacity ?? landPointOpacity,
            showFlightRoutes: this.config.showFlightRoutes ?? showFlightRoutes,
            flightRoutesData: this.config.flightRoutesData ?? flightRoutesData,
            flightAnimationSpeed: this.config.flightAnimationSpeed ?? flightAnimationSpeed,
            flightPauseTime: this.config.flightPauseTime ?? flightPauseTime,
            airplaneScale: this.config.airplaneScale ?? airplaneScale,
            airplaneRotationAdjustment: this.config.airplaneRotationAdjustment ?? airplaneRotationAdjustment,
        });

        this.airplaneModel = new THREE.Object3D();
        this.airplaneCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 10000);

        // 数据存储
        this.countriesData = countriesData;
        this.arcsData = arcsData;
        this.pointsData = pointsData;
        this.flightRoutesData = this.config.flightRoutesData || [];

        // 动画相关
        this.time = 0;
        
        // 弧线更新相关变量
        this.arcUpdateIndex = 0;

        // 材质复用管理器
        this.materialManager = this.createMaterialManager();

        // 缓存变量
        this.animationCache = {
            tempVector: new THREE.Vector3(),
            tempColor: new THREE.Color(),
        };

        this.initializeComponents();
    }

    /**
     * 创建材质管理器，复用相同或相似的材质
     */
    createMaterialManager() {
        const manager = {
            // 基础材质缓存
            materials: new Map(),
            
            // 获取或创建线材质
            getLineMaterial: (color, opacity = 1, transparent = false) => {
                const key = `line_${color}_${opacity}_${transparent}`;
                if (!manager.materials.has(key)) {
                    manager.materials.set(key, new THREE.LineBasicMaterial({
                        color: new THREE.Color(color),
                        transparent,
                        opacity,
                        vertexColors: false,
                        depthTest: true,
                        depthWrite: false
                    }));
                }
                return manager.materials.get(key);
            },

            // 获取或创建点材质
            getPointMaterial: (color, size = 1, transparent = false, opacity = 1) => {
                const key = `point_${color}_${size}_${transparent}_${opacity}`;
                if (!manager.materials.has(key)) {
                    manager.materials.set(key, new THREE.MeshBasicMaterial({
                        color: new THREE.Color(color),
                        transparent,
                        opacity,
                        depthWrite: false
                    }));
                }
                return manager.materials.get(key);
            },

            // 获取或创建环形材质
            getRingMaterial: (color, opacity = 1, side = THREE.DoubleSide) => {
                const key = `ring_${color}_${opacity}_${side}`;
                if (!manager.materials.has(key)) {
                    manager.materials.set(key, new THREE.MeshBasicMaterial({
                        color: new THREE.Color(color),
                        transparent: true,
                        opacity,
                        side,
                        depthTest: true,
                        depthWrite: false
                    }));
                }
                return manager.materials.get(key);
            },

            // 获取或创建圆形材质
            getCircleMaterial: (color, opacity = 1, side = THREE.DoubleSide) => {
                const key = `circle_${color}_${opacity}_${side}`;
                if (!manager.materials.has(key)) {
                    manager.materials.set(key, new THREE.MeshBasicMaterial({
                        color: new THREE.Color(color),
                        transparent: true,
                        opacity,
                        side,
                        depthWrite: false
                    }));
                }
                return manager.materials.get(key);
            },

            // 获取或创建飞线材质（支持顶点颜色）
            getFlyingLineMaterial: (color, vertexColors = true) => {
                const key = `flying_${color}_${vertexColors}`;
                if (!manager.materials.has(key)) {
                    manager.materials.set(key, new THREE.LineBasicMaterial({
                        color: new THREE.Color(color),
                        vertexColors: vertexColors,
                        depthWrite: false
                    }));
                }
                return manager.materials.get(key);
            },

            // 清理材质
            dispose: () => {
                manager.materials.forEach(material => {
                    if (material.dispose) material.dispose();
                });
                manager.materials.clear();
            }
        };

        return manager;
    }

    initializeComponents() {
        // 创建地球几何体和材质
        this.createEarth();
        
        // 创建大气层
        if (this.config.showAtmosphere) {
            this.createAtmosphere();
        }

        // 创建国家边界
        if (this.countriesData) {
            this.createCountries();
        }

        // 创建弧线
        if (this.arcsData.length > 0) {
            this.createArcs();
        }

        // 创建点
        if (this.pointsData.length > 0) {
            this.createPoints();
        }

        // 创建环形动画
        this.createRings();

        // 创建基于纹理的陆地点云
        if (this.config.showLandPoints) {
            this.createLandPoints();
        }

        // 创建飞机航线
        if (this.config.showFlightRoutes && this.flightRoutesData.length > 0) {
            this.createFlightRoutes().then(() => {
                // 如果没有陆地点云，在飞机航线创建完成后调用onLoad
                if (!this.config.showLandPoints) {
                    this.onLoad();
                }
            });
        } else if (!this.config.showLandPoints) {
            // 如果既没有陆地点云也没有飞机航线，直接调用onLoad
            this.onLoad();
        }
    }

    createEarth() {
        this.earthGeometry = new THREE.SphereGeometry(this.radius, this.segments, this.segments);
        
        this.earthMaterial = new THREE.MeshPhongMaterial({
            color: new THREE.Color(this.config.globeColor),
            emissive: new THREE.Color(this.config.emissive),
            emissiveIntensity: this.config.emissiveIntensity,
            shininess: this.config.shininess,
        });

        this.earthMesh = new THREE.Mesh(this.earthGeometry, this.earthMaterial);
        this.add(this.earthMesh);
    }

    createAtmosphere() {
        const atmosphereGeometry = new THREE.SphereGeometry(
            this.radius * (1 + this.config.atmosphereAltitude), 
            this.segments, 
            this.segments
        );

        const atmosphereMaterial = new THREE.ShaderMaterial({
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide,
            transparent: true,
            uniforms: {
                glowColor: { value: new THREE.Color(this.config.atmosphereColor), },
            },
            vertexShader: atmosphereVertexShader,
            fragmentShader: atmosphereFragmentShader,
        });

        this.atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        this.add(this.atmosphere);
    }

    createCountries() {
        if (!this.countriesData || !this.countriesData.features) return;

        this.countriesGroup = new THREE.Group();
        this.countriesGroup.name = 'Countries';

        const countryMaterial = this.materialManager.getLineMaterial(
            this.config.polygonColor, 
            this.config.polygonOpacity, 
            true
        );

        this.countriesData.features.forEach(feature => {
            if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
                this.createCountryPolygon(feature, countryMaterial);
            }
        });

        this.add(this.countriesGroup);
    }

    createCountryPolygon(feature, material) {
        const coordinates = feature.geometry.type === 'Polygon' 
            ? [feature.geometry.coordinates] 
            : feature.geometry.coordinates;

        coordinates.forEach(polygon => {
            polygon.forEach(ring => {
                if (ring.length < 3) return;

                const points = ring.map(coord => {
                    const [lng, lat] = coord;
                    return this.latLngToVector3(lat, lng, this.radius + 0.1);
                });

                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                
                const line = new THREE.Line(geometry, material);
                line.renderOrder = 1;
                this.countriesGroup.add(line);
            });
        });
    }

    createArcs() {
        this.arcsGroup = new THREE.Group();
        this.arcsGroup.name = 'Arcs';

        this.arcsData.forEach((arc, index) => {
            this.createArc(arc, index);
        });

        this.add(this.arcsGroup);
    }

    createArc(arc, index) {
        const startPos = this.latLngToVector3(arc.startLat, arc.startLng, this.radius);
        const endPos = this.latLngToVector3(arc.endLat, arc.endLng, this.radius);
        
        // 计算两点间的角度和弧线
        const angle = startPos.angleTo(endPos);
        const arcHeight = this.radius * (arc.arcAlt || 0.1);
        const angleThreshold = Math.PI / 3; // 60度
        
        // 根据角度选择曲线类型
        const curve = this.createCurve(startPos, endPos, angle, arcHeight, angleThreshold);
        const points = curve.getPoints(100);
        
        // 创建弧线组
        const arcGroup = new THREE.Group();
        
        // 创建静态弧线（背景轨迹）
        const staticGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const staticMaterial = this.materialManager.getLineMaterial(
            arc.color || '#ffffff', 
            0.2, 
            true
        );
        const staticLine = new THREE.Line(staticGeometry, staticMaterial);
        staticLine.renderOrder = 4;
        arcGroup.add(staticLine);
        
        // 创建动画飞线
        const flyingGeometry = new THREE.BufferGeometry();
        const flyingMaterial = this.materialManager.getFlyingLineMaterial(arc.color || '#ffffff');
        const flyingLine = new THREE.Line(flyingGeometry, flyingMaterial);
        flyingLine.renderOrder = 5;
        arcGroup.add(flyingLine);
        
        // 创建飞行粒子（可选）
        let particle = null;
        if (this.config.showFlyingParticle) {
            particle = this.createParticle(arc.color);
            arcGroup.add(particle);
        }
        
        arcGroup.userData = { 
            arc, 
            index,
            points,
            flyingGeometry,
            particle,
            animationOffset: index * (this.config.arcTime / this.arcsData.length),
            flyingLength: this.config.flyingLineLength,
            // 性能优化：缓存计算结果
            totalPoints: points.length,
            pointsPerProgress: points.length - 2,
            // 性能优化：预分配缓冲区
            positionBuffer: new Float32Array(this.config.flyingLineLength * 3),
            colorBuffer: new Float32Array(this.config.flyingLineLength * 3),
            lastVisibleCount: 0
        };
        
        this.arcsGroup.add(arcGroup);
    }

    createCurve(startPos, endPos, angle, arcHeight, angleThreshold) {
        if (angle > angleThreshold) {
            // 三次贝塞尔曲线
            const midPoint = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
            midPoint.normalize().multiplyScalar(this.radius + arcHeight);
            
            const controlPoint1 = new THREE.Vector3().lerpVectors(startPos, midPoint, 0.5);
            controlPoint1.normalize().multiplyScalar(this.radius + arcHeight);
            
            const controlPoint2 = new THREE.Vector3().lerpVectors(midPoint, endPos, 0.5);
            controlPoint2.normalize().multiplyScalar(this.radius + arcHeight);
            
            return new THREE.CubicBezierCurve3(startPos, controlPoint1, controlPoint2, endPos);
        } else {
            // 二次贝塞尔曲线
            const midPoint = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
            midPoint.normalize().multiplyScalar(this.radius + arcHeight);
            
            return new THREE.QuadraticBezierCurve3(startPos, midPoint, endPos);
        }
    }

    createParticle(color) {
        const geometry = new THREE.SphereGeometry(this.config.particleSize, 8, 8);
        
        const material = this.materialManager.getPointMaterial(
            color || '#ffffff',
            this.config.particleSize,
            true,
            0.8
        );
        return new THREE.Mesh(geometry, material);
    }

    createPoints() {
        this.pointsGroup = new THREE.Group();
        this.pointsGroup.name = 'Points';

        // 去重处理
        const uniquePoints = this.removeDuplicatePoints(this.pointsData);

        // 为不同颜色的点预创建材质
        const pointMaterials = new Map();

        const geometry = new THREE.SphereGeometry(this.config.pointSize);

        uniquePoints.forEach(point => {
            this.createPoint(point, geometry, pointMaterials);
        });

        this.add(this.pointsGroup);
    }

    createPoint(point, geometry, pointMaterials) {
        const position = this.latLngToVector3(point.lat, point.lng, this.radius + 0.5);
        
        const color = point.color || '#ffffff';
        if (!pointMaterials.has(color)) {
            pointMaterials.set(color, this.materialManager.getPointMaterial(color));
        }
        const material = pointMaterials.get(color);

        const pointMesh = new THREE.Mesh(geometry, material);
        pointMesh.position.copy(position);
        
        this.pointsGroup.add(pointMesh);
    }

    createRings() {
        this.ringsGroup = new THREE.Group();
        this.ringsGroup.name = 'Rings';
        
        // 为圆环预创建几何体和材质
        this.ringGeometries = {
            baseCircle: new THREE.CircleGeometry(this.config.maxRings * this.config.baseCircleScale),
            waveRing: new THREE.RingGeometry(
                this.config.maxRings * this.config.baseCircleScale + this.config.maxRings * 0.1,
                this.config.maxRings * this.config.baseCircleScale + this.config.maxRings * 0.1 + this.config.maxRings * this.config.ringThickness,
                32
            )
        };
        
        // 为环形预创建材质
        this.ringMaterials = {
            baseCircle: this.materialManager.getCircleMaterial('#ffffff', 0.9, THREE.DoubleSide),
            waveRing: this.materialManager.getRingMaterial('#ffffff', 0.8, THREE.DoubleSide)
        };
        
        // 为每个点创建圆环组
        if (this.pointsData && this.pointsData.length > 0) {
            this.pointsData.forEach((point, index) => {
                this.createRingForPoint(point, index);
            });
        }
        
        this.add(this.ringsGroup);
    }

    createRingForPoint(point, pointIndex) {
        const position = this.latLngToVector3(point.lat, point.lng, this.radius + 0.1);
        
        // 创建圆环组
        const ringGroup = new THREE.Group();
        ringGroup.position.copy(position);
        ringGroup.lookAt(new THREE.Vector3(0, 0, 0));
        
        // 创建底圆
        const baseCircle = this.createBaseCircle(point);
        ringGroup.add(baseCircle);
        
        // 创建波浪圆环
        const waves = this.createWaveRings();
        ringGroup.add(...waves)
        
        ringGroup.userData = { 
            waves,
            baseCircle,
            point,
            pointIndex,
            startTime: 0
        };

        this.ringsGroup.add(ringGroup);
    }

    createBaseCircle(point) {
        const geometry = this.ringGeometries.baseCircle;
        
        // 如果点有自定义颜色，创建对应材质，否则使用默认材质
        const color = point.color || this.config.polygonColor;
        const material = this.materialManager.getCircleMaterial(color, 0.9, THREE.DoubleSide);
        
        const baseCircle = new THREE.Mesh(geometry, material);
        baseCircle.name = 'baseCircle';
        baseCircle.renderOrder = 2;
        return baseCircle;
    }

    createWaveRings() {
        const waves = [];
        
        for (let i = 0; i < this.config.waveCount; i++) {

            const geometry = this.ringGeometries.waveRing;
            const material = this.ringMaterials.waveRing.clone(); // 克隆以便独立控制透明度
            
            const wave = new THREE.Mesh(geometry, material);
            wave.renderOrder = 3;
            wave.userData = {
                waveIndex: i,
                maxScale: 1.5,
                initialOpacity: 1.0 - (i * 0.1),
                initialScale: 0.1,
                animationOffset: i * (this.config.waveDelay / 1000)
            };
            
            waves.push(wave);
        }
        
        return waves;
    }

    // 工具方法
    latLngToVector3(lat, lng, radius) {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lng + 180) * (Math.PI / 180);

        const x = -(radius * Math.sin(phi) * Math.cos(theta));
        const z = radius * Math.sin(phi) * Math.sin(theta);
        const y = radius * Math.cos(phi);

        return new THREE.Vector3(x, y, z);
    }

    removeDuplicatePoints(points) {
        const seen = new Set();
        return points.filter(point => {
            const key = `${point.lat},${point.lng}`;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }

    // 动画更新方法
    update(delta) {
        this.time += delta;

        // 自动旋转
        if (this.config.autoRotate) {
            this.rotation.y += this.config.autoRotateSpeed * delta;
        }

        // 批量更新环形动画
        this.updateRingsAnimationBatch(this.time);

        // 批量更新弧线动画
        this.updateArcsAnimationBatch(this.time);

        // 更新飞机航线动画
        if (this.config.showFlightRoutes) {
            this.updateFlightRoutesAnimation(this.time * 1000); // 转换为毫秒
        }

        // 更新飞机相机的平滑跟随
        this.updateFlightCameraSmooth(delta);
    }

    /**
     * 批量更新环形动画，减少重复计算
     */
    updateRingsAnimationBatch(currentTime) {
        if (!this.ringsGroup || this.ringsGroup.children.length === 0) return;

        this.ringsGroup.children.forEach(ringGroup => {
            const userData = ringGroup.userData;
            if (!userData || !userData.waves) return;
            
            // 初始化startTime
            if (userData.startTime === 0) {
                userData.startTime = currentTime;
            }
            
            const groupElapsed = currentTime - userData.startTime;
            
            // 更新底圆的脉冲效果 - 使用预计算值
            if (userData.baseCircle) {
                const pulseScale = 1 + 0.15 * Math.sin(currentTime * 4);
                const pulseOpacity = 0.5 + 0.3 * Math.sin(currentTime * 2);
                userData.baseCircle.scale.setScalar(pulseScale);
                userData.baseCircle.material.opacity = pulseOpacity;
            }
            
            // 批量更新波浪圆环
            this.updateWavesBatch(userData.waves, groupElapsed, this.config.waveDuration);
        });
    }

    /**
     * 批量更新波浪动画
     */
    updateWavesBatch(waves, groupElapsed, waveDuration) {
        for (let i = 0; i < waves.length; i++) {
            const wave = waves[i];
            const waveData = wave.userData;
            const waveElapsed = groupElapsed - waveData.animationOffset;
            
            if (waveElapsed < 0) {
                wave.visible = false;
                continue;
            }
            
            wave.visible = true;
            const progress = (waveElapsed % waveDuration) / waveDuration;
            
            if (progress > 1) {
                wave.visible = false;
                continue;
            }
            
            // 缩放和透明度计算
            const scale = waveData.initialScale + progress * waveData.maxScale;
            const fadeOut = 1 - Math.pow(progress, 1.5);
            const opacity = Math.max(0, waveData.initialOpacity * fadeOut);
            
            wave.scale.setScalar(scale);
            wave.material.opacity = opacity;
        }
    }

    /**
     * 批量更新弧线动画
     */
    updateArcsAnimationBatch(currentTime) {
        if (!this.arcsGroup || this.arcsGroup.children.length === 0) return;

        // 性能优化：批量处理，分帧渲染大量弧线
        const maxArcsPerFrame = Math.max(5, Math.ceil(this.arcsGroup.children.length / 2));
        const startIndex = (this.arcUpdateIndex || 0) % this.arcsGroup.children.length;
        const endIndex = Math.min(startIndex + maxArcsPerFrame, this.arcsGroup.children.length);

        for (let i = startIndex; i < endIndex; i++) {
            const arcGroup = this.arcsGroup.children[i];
            const userData = arcGroup.userData;
            if (!userData || !userData.points) continue;
            
            const animationTime = (currentTime * 1000 + userData.animationOffset) % this.config.arcTime;
            const progress = animationTime / this.config.arcTime;
            
            // 更新飞线动画
            this.updateFlyingLineOptimized(arcGroup, progress);
            
            // 更新粒子位置
            if (userData.particle) {
                this.updateParticleOptimized(arcGroup, progress, Math.sin(currentTime * 30.0));
            }
        }

        // 更新下一帧处理的起始索引
        this.arcUpdateIndex = endIndex;
        if (this.arcUpdateIndex >= this.arcsGroup.children.length) {
            this.arcUpdateIndex = 0;
        }
    }

    /**
     * 飞线更新方法
     */
    updateFlyingLineOptimized(arcGroup, progress) {
        const userData = arcGroup.userData;
        const { points, flyingGeometry, flyingLength, totalPoints } = userData;
        
        if (!points || totalPoints === 0) return;
        
        // 使用缓存的计算结果
        const currentIndex = Math.floor(progress * totalPoints);
        const startIndex = Math.max(0, currentIndex - flyingLength);
        const endIndex = Math.min(totalPoints - 1, currentIndex);
        
        if (startIndex >= endIndex) {
            // 隐藏飞线而不是清空几何体
            if (userData.lastVisibleCount > 0) {
                userData.lastVisibleCount = 0;
                this.updateGeometryBuffers(flyingGeometry, [], []);
            }
            return;
        }
        
        const pointCount = endIndex - startIndex + 1;
        
        // 使用预分配的缓冲区
        const posBuffer = userData.positionBuffer;
        const colorBuffer = userData.colorBuffer;
        
        for (let i = 0; i < pointCount; i++) {
            const point = points[startIndex + i];
            const bufferIndex = i * 3;
            
            // 位置数据
            posBuffer[bufferIndex] = point.x;
            posBuffer[bufferIndex + 1] = point.y;
            posBuffer[bufferIndex + 2] = point.z;
            
            // 颜色渐变数据
            const intensity = i / (pointCount - 1);
            colorBuffer[bufferIndex] = intensity;
            colorBuffer[bufferIndex + 1] = intensity;
            colorBuffer[bufferIndex + 2] = intensity;
        }
        
        // 只在点数量发生变化时更新几何体
        if (userData.lastVisibleCount !== pointCount) {
            this.updateGeometryBuffers(
                flyingGeometry, 
                posBuffer.subarray(0, pointCount * 3),
                colorBuffer.subarray(0, pointCount * 3)
            );
            userData.lastVisibleCount = pointCount;
        } else {
            // 只更新位置和颜色数据，不重建几何体
            this.updateBufferAttributes(
                flyingGeometry,
                posBuffer.subarray(0, pointCount * 3),
                colorBuffer.subarray(0, pointCount * 3)
            );
        }
    }

    /**
     * 更新几何体缓冲区 - 重建属性（当点数量变化时）
     */
    updateGeometryBuffers(geometry, positions, colors) {
        if (positions.length === 0) {
            // 设置空几何体
            geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(0), 3));
            geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(0), 3));
            geometry.setDrawRange(0, 0);
        } else {
            geometry.setAttribute('position', new THREE.BufferAttribute(positions.slice(), 3));
            geometry.setAttribute('color', new THREE.BufferAttribute(colors.slice(), 3));
            geometry.setDrawRange(0, positions.length / 3);
        }
        
        // 标记需要更新
        geometry.attributes.position.needsUpdate = true;
        geometry.attributes.color.needsUpdate = true;
    }

    /**
     * 更新缓冲区属性数据 - 只更新数据（当点数量不变时）
     */
    updateBufferAttributes(geometry, positions, colors) {
        const positionAttr = geometry.attributes.position;
        const colorAttr = geometry.attributes.color;
        
        if (positionAttr && colorAttr) {
            // 直接更新缓冲区数据
            positionAttr.array.set(positions);
            colorAttr.array.set(colors);
            
            // 标记需要更新
            positionAttr.needsUpdate = true;
            colorAttr.needsUpdate = true;
        }
    }

    /**
     * 优化后的粒子更新方法
     */
    updateParticleOptimized(arcGroup, progress, sinParticleTime) {
        const userData = arcGroup.userData;
        const { points, particle, pointsPerProgress } = userData;
        
        if (!points || points.length === 0 || !particle) return;
        
        // 使用缓存的计算结果
        const currentIndex = Math.floor(progress * pointsPerProgress);
        const nextIndex = Math.min(currentIndex + 1, pointsPerProgress);
        
        if (currentIndex >= pointsPerProgress) {
            particle.visible = false;
            return;
        }
        
        particle.visible = true;
        
        // 插值计算
        const localProgress = (progress * pointsPerProgress) - currentIndex;
        const currentPoint = points[currentIndex];
        const nextPoint = points[nextIndex];
        
        // 使用缓存的临时向量避免创建新对象
        const tempVector = this.animationCache.tempVector;
        tempVector.lerpVectors(currentPoint, nextPoint, localProgress);
        particle.position.copy(tempVector);
        
        // 粒子效果
        const pulseScale = 1 + 0.5 * sinParticleTime;
        particle.scale.setScalar(pulseScale);
        
        // 透明度计算
        const fadeProgress = Math.sin(progress * Math.PI);
        particle.material.opacity = 0.8 * fadeProgress;
    }

    // 清理方法
    dispose() {
        // 清理材质管理器
        if (this.materialManager) {
            this.materialManager.dispose();
        }

        // 清理几何体
        if (this.ringGeometries) {
            Object.values(this.ringGeometries).forEach(geometry => {
                if (geometry.dispose) geometry.dispose();
            });
        }

        // 清理飞机航线资源
        if (this.flightRouteInstances) {
            this.flightRouteInstances.forEach(instance => {
                if (instance.airplane) {
                    instance.airplane.traverse(child => {
                        if (child.geometry) child.geometry.dispose();
                        if (child.material) {
                            if (Array.isArray(child.material)) {
                                child.material.forEach(mat => mat.dispose());
                            } else {
                                child.material.dispose();
                            }
                        }
                    });
                }
            });
        }

        // 清理几何体和材质
        this.traverse(child => {
            if (child.geometry) {
                child.geometry.dispose();
            }
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(material => material.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });
    }

    // 数据更新方法
    updateArcsData(newArcsData) {
        this.arcsData = newArcsData;
        if (this.arcsGroup) {
            this.remove(this.arcsGroup);
            // 清理旧的弧线资源
            this.arcsGroup.traverse(child => {
                if (child.geometry) child.geometry.dispose();
            });
        }
        if (newArcsData.length > 0) {
            this.createArcs();
        }
    }

    updatePointsData(newPointsData) {
        this.pointsData = newPointsData;
        
        // 清理旧资源
        if (this.pointsGroup) {
            this.remove(this.pointsGroup);
            this.pointsGroup.traverse(child => {
                if (child.geometry) child.geometry.dispose();
            });
        }
        if (this.ringsGroup) {
            this.remove(this.ringsGroup);
            // 清理环形几何体和材质引用
            this.ringsGroup.traverse(child => {
                if (child.geometry) child.geometry.dispose();
            });
        }
        
        if (newPointsData.length > 0) {
            this.createPoints();
            this.createRings();
        }
    }

    updateCountriesData(newCountriesData) {
        this.countriesData = newCountriesData;
        if (this.countriesGroup) {
            this.remove(this.countriesGroup);
            // 清理国家边界几何体
            this.countriesGroup.traverse(child => {
                if (child.geometry) child.geometry.dispose();
            });
        }
        if (newCountriesData) {
            this.createCountries();
        }
    }

    /**
     * 更新陆地点云显示状态
     */
    updateLandPointsVisibility(show) {
        this.config.showLandPoints = show;
        if (show && !this.landPoints) {
            this.createLandPoints();
        } else if (!show && this.landPoints) {
            this.remove(this.landPoints);
            if (this.landPoints.geometry) {
                this.landPoints.geometry.dispose();
            }
            if (this.landPoints.material) {
                this.landPoints.material.dispose();
            }
            this.landPoints = null;
        }
    }

    /**
     * 重新创建陆地点云（例如密度配置改变时）
     */
    async recreateLandPoints() {
        if (this.landPoints) {
            this.remove(this.landPoints);
            if (this.landPoints.geometry) {
                this.landPoints.geometry.dispose();
            }
            if (this.landPoints.material) {
                this.landPoints.material.dispose();
            }
            this.landPoints = null;
        }
        
        if (this.config.showLandPoints) {
            await this.createLandPoints();
        }
    }

    /**
     * 创建基于纹理的陆地点云
     */
    async createLandPoints() {
        try {
            // 创建canvas来读取纹理数据
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // 创建图像对象
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            return new Promise((resolve, reject) => {
                img.onload = () => {
                    // 设置canvas尺寸（密度越大分辨率越高）
                    const baseResolution = 512;
                    const resolution = baseResolution * this.config.landPointDensity;
                    canvas.width = resolution;
                    canvas.height = resolution / 2; // 2:1 比例的等矩形投影
                    
                    // 绘制图像到canvas
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    
                    // 获取像素数据
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const data = imageData.data;
                    
                    // 分析像素并创建点云
                    const landPositions = this.extractLandPositions(data, canvas.width, canvas.height);
                    
                    if (landPositions.length > 0) {
                        this.createLandPointsGeometry(landPositions);
                    }
                    
                    this.onLoad()
                    resolve();
                };
                
                img.onerror = () => {
                    console.warn('无法加载地球纹理，跳过陆地点云创建');
                    resolve();
                };
                
                img.src = '/texture/earth/github/earth.jpg';
            });
        } catch (error) {
            console.warn('创建陆地点云时出错:', error);
        }
    }

    /**
     * 从纹理数据中提取陆地位置
     */
    extractLandPositions(data, width, height) {
        const positions = [];
        const threshold = 128; // 黑白阈值
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = (y * width + x) * 4;
                const r = data[index];
                const g = data[index + 1];
                const b = data[index + 2];
                
                // 计算灰度值
                const grayscale = (r + g + b) / 3;
                
                // 如果是黑色区域（陆地），创建点
                if (grayscale < threshold) {
                    // 添加一些随机性以避免过于规则的网格
                    if (Math.random() < 0.3) continue;
                    
                    // 将像素坐标转换为经纬度
                    const lon = (x / width) * 360 - 180;
                    const lat = 90 - (y / height) * 180;
                    
                    // 转换为3D坐标
                    const position = this.latLngToVector3(lat, lon, this.radius + 0.5);
                    positions.push(position.x, position.y, position.z);
                }
            }
        }
        
        return positions;
    }

    /**
     * 创建陆地点云几何体
     */
    createLandPointsGeometry(positions) {
        // 创建几何体
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        
        // 加载点纹理
        const loader = new THREE.TextureLoader();
        const dotTexture = loader.load('/texture/earth/github/dot.png');
        
        // 使用材质管理器创建点云材质
        const material = new THREE.PointsMaterial({
            color: new THREE.Color(this.config.landPointColor),
            size: this.config.landPointSize,
            map: dotTexture,
            transparent: true,
            opacity: this.config.landPointOpacity,
            blending: THREE.AdditiveBlending,
            depthTest: true,
            depthWrite: false,
            vertexColors: false
        });
        
        // 创建点云对象
        this.landPoints = new THREE.Points(geometry, material);
        this.landPoints.name = 'LandPoints';
        
        // 添加到场景
        this.add(this.landPoints);
    }

    /**
     * 异步加载纹理的辅助方法
     */
    loadTexture(url) {
        return new Promise((resolve, reject) => {
            const loader = new THREE.TextureLoader();
            loader.load(
                url,
                resolve,
                undefined,
                reject
            );
        });
    }

    /**
     * 创建飞机航线
     */
    async createFlightRoutes() {
        this.flightRoutesGroup = new THREE.Group();
        this.flightRoutesGroup.name = 'FlightRoutes';
        
        // 存储飞机航线数据
        this.flightRouteInstances = [];

        // 加载飞机模型
        try {
            this.airplaneModel = await this.loadAirplaneModel();
            if (this.airplaneModel) {
                // 缩放飞机模型
                this.airplaneModel.scale.setScalar(this.config.airplaneScale);
                // 初始化飞机位置和可见性
                this.airplaneModel.visible = false;
            }
        } catch (error) {
            console.warn('Failed to load airplane model:', error);
        }
        
        // 为每条航线创建虚线轨迹和飞机
        for (let i = 0; i < this.flightRoutesData.length; i++) {
            const route = this.flightRoutesData[i];
            await this.createSingleFlightRoute(route, i);
        }
        
        this.add(this.flightRoutesGroup);
    }

    /**
     * 创建单条航线
     */
    async createSingleFlightRoute(route, index) {
        const routeGroup = new THREE.Group();
        routeGroup.name = `FlightRoute_${route.id}`;
        
        // 计算航线轨迹点
        const startPos = this.latLngToVector3(route.startLat, route.startLng, this.radius);
        const endPos = this.latLngToVector3(route.endLat, route.endLng, this.radius);
        const angle = startPos.angleTo(endPos);
        const arcHeight = this.radius * (route.arcAlt || 0.3);
        
        // 创建航线曲线
        const curve = this.createCurve(startPos, endPos, angle, arcHeight, Math.PI / 3);
        // 增加点数以获得更平滑的动画
        const routePoints = curve.getPoints(200);
        
        // 创建虚线轨迹
        this.createDashedTrack(routeGroup, routePoints, route.color);
        
        const airplane = this.airplaneModel.clone();
        airplane.name = 'airplane';
        const camera = this.airplaneCamera.clone();
        
        // 优化相机设置 - 设置更合适的距离和角度
        camera.position.set(0, 600, -800);
        camera.lookAt(0, 0, 100);
        
        airplane.add(camera);
        airplane.userData.camera = camera;

        airplane.position.copy(routePoints[0]);
        routeGroup.add(airplane);
        
        // 存储航线实例数据
        const routeInstance = {
            group: routeGroup,
            route: route,
            index: index,
            points: routePoints,
            airplane: airplane,
            animationProgress: 0,
            direction: 1, // 1: 正向, -1: 反向
            isReturning: false,
            pauseStartTime: 0,
            isPaused: false,
            opacity: 0,
            // 添加平滑插值缓存
            lastPosition: routePoints[0].clone(),
            lastQuaternion: new THREE.Quaternion(),
            targetPosition: routePoints[0].clone(),
            targetQuaternion: new THREE.Quaternion(),
            lastDirection: null,
            needsDirectionChange: false
        };
        
        this.flightRouteInstances.push(routeInstance);
        this.flightRoutesGroup.add(routeGroup);
    }

    /**
     * 创建虚线轨迹
     */
    createDashedTrack(routeGroup, points, color) {
        // 创建线段几何体
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        
        // 创建虚线材质
        const material = new THREE.LineDashedMaterial({
            color: new THREE.Color(color),
            dashSize: 3,
            gapSize: 1.5,
        });
        
        // 创建虚线对象
        const dashedLine = new THREE.Line(geometry, material);
        dashedLine.computeLineDistances(); // 计算线段距离，虚线效果需要
        dashedLine.renderOrder = 6;
        dashedLine.name = 'track';
        
        routeGroup.add(dashedLine);
    }

    /**
     * 加载飞机模型
     */
    async loadAirplaneModel() {
        return new Promise((resolve, reject) => {
            gltfLoader.load(
                '/models/airplane/airplane.glb',
                (gltf) => {
                    const airplane = gltf.scene.clone();
                    airplane.name = 'airplane';
                    
                    // 确保材质正确设置
                    airplane.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = false;
                            child.receiveShadow = false;
                            if (child.material) {
                                child.material.transparent = true;
                            }
                        }
                    });
                    
                    resolve(airplane);
                },
                (progress) => {
                    // 加载进度
                },
                (error) => {
                    reject(error);
                }
            );
        });
    }

    /**
     * 更新飞机航线动画
     */
    updateFlightRoutesAnimation(currentTime) {
        if (!this.flightRouteInstances || this.flightRouteInstances.length === 0) return;
        
        this.flightRouteInstances.forEach(routeInstance => {
            this.updateSingleFlightRoute(routeInstance, currentTime);
        });
    }

    /**
     * 更新单个航线动画
     */
    updateSingleFlightRoute(routeInstance, currentTime) {
        const { airplane, points, route } = routeInstance;
        if (!airplane || !points || points.length === 0) return;
        
        // 处理暂停逻辑
        if (routeInstance.isPaused) {
            const pauseDuration = currentTime - routeInstance.pauseStartTime;
            if (pauseDuration >= this.config.flightPauseTime) {
                routeInstance.isPaused = false;
                routeInstance.direction *= -1; // 切换方向
                routeInstance.isReturning = !routeInstance.isReturning;
                routeInstance.animationProgress = routeInstance.isReturning ? 1 : 0;
                routeInstance.needsDirectionChange = false; // 重置标记
                
                // 方向切换后，重新计算初始朝向以避免突变
                const newProgress = routeInstance.animationProgress;
                const newPosition = this.getSplineInterpolatedPosition(points, newProgress);
                
                // 计算新方向的初始朝向
                const lookAheadDistance = 0.01; // 稍大一点的前瞻距离
                const lookAheadProgress = Math.max(0, Math.min(1, newProgress + lookAheadDistance * routeInstance.direction));
                const lookAheadPosition = this.getSplineInterpolatedPosition(points, lookAheadProgress);
                const newDirection = new THREE.Vector3().subVectors(lookAheadPosition, newPosition).normalize();
                
                if (newDirection.length() > 0) {
                    routeInstance.lastDirection = newDirection.clone();
                }
            } else {
                // 在暂停期间，保持飞机朝向稳定，避免视角突变
                return; // 仍在暂停中
            }
        }
        
        // 更新动画进度 - 使用固定的时间步长确保平滑
        const speed = this.config.flightAnimationSpeed / 1000;
        const deltaProgress = speed * routeInstance.direction;
        routeInstance.animationProgress += deltaProgress;
        
        // 检查是否到达端点
        if (routeInstance.animationProgress >= 1 || routeInstance.animationProgress <= 0) {
            routeInstance.animationProgress = Math.max(0, Math.min(1, routeInstance.animationProgress));
            routeInstance.isPaused = true;
            routeInstance.pauseStartTime = currentTime;
            // 标记需要方向切换，但不立即执行
            routeInstance.needsDirectionChange = true;
        }
        
        // 确保progress始终在有效范围内，防止插值计算错误
        const progress = Math.max(0, Math.min(1, routeInstance.animationProgress));
        
        // 使用样条插值获得更平滑的位置
        const position = this.getSplineInterpolatedPosition(points, progress);
        
        // 改进的方向计算 - 避免在端点处的突变
        let direction;
        
        // 在端点附近时使用特殊的方向计算
        const endpointThreshold = 0.02; // 端点阈值
        if (progress <= endpointThreshold || progress >= (1 - endpointThreshold)) {
            // 在端点附近，使用更稳定的方向计算
            if (routeInstance.lastDirection && routeInstance.lastDirection.length() > 0) {
                // 如果有上一个有效方向，继续使用它保持稳定
                direction = routeInstance.lastDirection.clone();
            } else {
                // 使用轨迹的总体方向
                const startPoint = points[0];
                const endPoint = points[points.length - 1];
                direction = new THREE.Vector3().subVectors(endPoint, startPoint).normalize();
                if (routeInstance.direction < 0) {
                    direction.negate(); // 如果是返回方向，反转
                }
            }
        } else {
            // 在轨迹中间时，使用正常的前瞻计算
            const lookAheadDistance = 0.005;
            const lookAheadProgress = Math.max(0, Math.min(1, progress + lookAheadDistance * routeInstance.direction));
            const lookAheadPosition = this.getSplineInterpolatedPosition(points, lookAheadProgress);
            direction = new THREE.Vector3().subVectors(lookAheadPosition, position).normalize();
            
            // 验证并保存有效的方向
            if (direction.length() > 0 && isFinite(direction.x) && isFinite(direction.y) && isFinite(direction.z)) {
                routeInstance.lastDirection = direction.clone();
            } else if (routeInstance.lastDirection && routeInstance.lastDirection.length() > 0) {
                direction = routeInstance.lastDirection.clone();
            } else {
                // 使用默认方向
                direction = new THREE.Vector3().subVectors(points[Math.min(1, points.length - 1)], points[0]).normalize();
                if (routeInstance.direction < 0) {
                    direction.negate();
                }
            }
        }
        
        // 平滑更新飞机位置
        const smoothingFactor = 0.15; // 平滑系数，值越小越平滑但延迟越大
        routeInstance.targetPosition.copy(position);
        routeInstance.lastPosition.lerp(routeInstance.targetPosition, smoothingFactor);
        airplane.position.copy(routeInstance.lastPosition);
        
        // 设置飞机朝向 - 使用更平滑的旋转方法
        this.setAirplaneOrientationSmooth(airplane, direction, position, routeInstance);
        
        // 计算透明度（渐显渐隐效果）
        const fadeDistance = 0.15; // 渐变区域占总长度的比例
        let opacity = 1;
        
        if (progress < fadeDistance) {
            // 起始渐显
            opacity = progress / fadeDistance;
        } else if (progress > (1 - fadeDistance)) {
            // 结束渐隐
            opacity = (1 - progress) / fadeDistance;
        }
        
        // 应用透明度
        airplane.traverse((child) => {
            if (child.isMesh && child.material) {
                child.material.opacity = opacity;
                child.material.transparent = true;
            }
        });
        
        // 控制可见性
        airplane.visible = opacity > 0.01;
        
        routeInstance.opacity = opacity;
    }

    /**
     * 使用样条插值获得更平滑的位置
     */
    getSplineInterpolatedPosition(points, progress) {
        if (!points || points.length === 0) {
            console.warn('getSplineInterpolatedPosition: points array is empty or undefined');
            return new THREE.Vector3();
        }

        // 确保progress在有效范围内
        progress = Math.max(0, Math.min(1, progress));

        if (points.length === 1) {
            return points[0].clone();
        }

        if (points.length < 4) {
            // 如果点数不足，使用线性插值
            const index = progress * (points.length - 1);
            const currentIndex = Math.floor(index);
            const nextIndex = Math.min(currentIndex + 1, points.length - 1);
            const localProgress = index - currentIndex;
            
            // 确保索引在有效范围内
            const safeCurrentIndex = Math.max(0, Math.min(currentIndex, points.length - 1));
            const safeNextIndex = Math.max(0, Math.min(nextIndex, points.length - 1));
            
            return new THREE.Vector3().lerpVectors(points[safeCurrentIndex], points[safeNextIndex], localProgress);
        }
        
        // 使用Catmull-Rom样条插值
        const totalSegments = points.length - 1;
        const segmentProgress = progress * totalSegments;
        const segmentIndex = Math.floor(segmentProgress);
        const localProgress = segmentProgress - segmentIndex;
        
        // 确保索引在有效范围内
        const safeSegmentIndex = Math.max(0, Math.min(segmentIndex, points.length - 2));
        const p0Index = Math.max(0, safeSegmentIndex - 1);
        const p1Index = safeSegmentIndex;
        const p2Index = Math.min(safeSegmentIndex + 1, points.length - 1);
        const p3Index = Math.min(safeSegmentIndex + 2, points.length - 1);
        
        const p0 = points[p0Index];
        const p1 = points[p1Index];
        const p2 = points[p2Index];
        const p3 = points[p3Index];
        
        // 验证所有点都存在
        if (!p0 || !p1 || !p2 || !p3) {
            console.warn('getSplineInterpolatedPosition: One or more control points are undefined', {
                p0Index, p1Index, p2Index, p3Index,
                pointsLength: points.length,
                progress: progress
            });
            // 降级到线性插值
            const fallbackIndex = Math.min(p1Index, points.length - 1);
            const fallbackNextIndex = Math.min(p1Index + 1, points.length - 1);
            return new THREE.Vector3().lerpVectors(
                points[fallbackIndex] || new THREE.Vector3(),
                points[fallbackNextIndex] || points[fallbackIndex] || new THREE.Vector3(),
                localProgress
            );
        }
        
        // Catmull-Rom插值公式
        const t = localProgress;
        const t2 = t * t;
        const t3 = t2 * t;
        
        const result = new THREE.Vector3();
        result.x = 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
        result.y = 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);
        result.z = 0.5 * ((2 * p1.z) + (-p0.z + p2.z) * t + (2 * p0.z - 5 * p1.z + 4 * p2.z - p3.z) * t2 + (-p0.z + 3 * p1.z - 3 * p2.z + p3.z) * t3);
        
        return result;
    }

    /**
     * 设置飞机的朝向，使用更平滑的旋转方法
     */
    setAirplaneOrientationSmooth(airplane, direction, position, routeInstance) {
        // 计算从地心到飞机位置的向量（用作up向量）
        const up = position.clone().normalize();
        
        // 计算right向量（垂直于direction和up的向量）
        const right = new THREE.Vector3().crossVectors(up, direction).normalize();
        
        // 重新计算up向量确保正交
        const correctedUp = new THREE.Vector3().crossVectors(direction, right).normalize();
        
        // 创建目标旋转矩阵
        const rotationMatrix = new THREE.Matrix4();
        rotationMatrix.makeBasis(right, correctedUp, direction);
        
        // 从旋转矩阵提取四元数
        routeInstance.targetQuaternion.setFromRotationMatrix(rotationMatrix);
        
        // 应用旋转调整（如果需要）
        const adjustmentAngle = this.config.airplaneRotationAdjustment || 0;
        if (adjustmentAngle !== 0) {
            const adjustmentQuaternion = new THREE.Quaternion().setFromAxisAngle(
                correctedUp,
                adjustmentAngle
            );
            routeInstance.targetQuaternion.multiplyQuaternions(routeInstance.targetQuaternion, adjustmentQuaternion);
        }
        
        // 动态调整旋转平滑系数 - 在端点附近使用更强的平滑
        const progress = routeInstance.animationProgress;
        const endpointThreshold = 0.05; // 端点阈值
        let rotationSmoothingFactor = 0.2; // 默认旋转平滑系数
        
        if (progress <= endpointThreshold || progress >= (1 - endpointThreshold)) {
            // 在端点附近，使用更强的平滑
            rotationSmoothingFactor = 0.05;
        } else if (progress <= endpointThreshold * 2 || progress >= (1 - endpointThreshold * 2)) {
            // 在端点附近的缓冲区，使用中等平滑
            rotationSmoothingFactor = 0.1;
        }
        
        // 如果飞机正在暂停或即将改变方向，进一步降低平滑系数
        if (routeInstance.isPaused || routeInstance.needsDirectionChange) {
            rotationSmoothingFactor = 0.02; // 更强的平滑以避免突变
        }
        
        // 平滑插值到目标旋转
        routeInstance.lastQuaternion.slerp(routeInstance.targetQuaternion, rotationSmoothingFactor);
        
        // 应用旋转
        airplane.quaternion.copy(routeInstance.lastQuaternion);
    }

    /**
     * 平滑更新飞机相机
     */
    updateFlightCameraSmooth(delta) {
        if (!this.flightRouteInstances) return;

        this.flightRouteInstances.forEach(routeInstance => {
            const camera = routeInstance.airplane.userData.camera;
            if (!camera) return;

            // 为相机添加平滑的振动减少
            const dampingFactor = 0.05;
            if (camera.userData.lastPosition) {
                const targetPosition = routeInstance.airplane.position.clone();
                camera.userData.lastPosition.lerp(targetPosition, dampingFactor);
            } else {
                camera.userData.lastPosition = routeInstance.airplane.position.clone();
            }

            // 应用额外的相机稳定
            if (camera.userData.stabilizer) {
                camera.userData.stabilizer += delta * 0.001;
                // 添加轻微的相机摆动抑制
                const stabilizationOffset = new THREE.Vector3(
                    Math.sin(camera.userData.stabilizer * 0.5) * 0.1,
                    Math.cos(camera.userData.stabilizer * 0.3) * 0.05,
                    0
                );
                camera.position.add(stabilizationOffset);
            } else {
                camera.userData.stabilizer = 0;
            }
        });
    }
} 