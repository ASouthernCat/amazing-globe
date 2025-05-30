import * as THREE from 'three';

import atmosphereFragmentShader from './shader/simple-earth/atmosphere.fs';
import atmosphereVertexShader from './shader/simple-earth/atmosphere.vs';

import countries from './data/globe.json';

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
     *   landPointOpacity?: number
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
            landPointOpacity = 0.8
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
            landPointOpacity: this.config.landPointOpacity ?? landPointOpacity
        });

        // 数据存储
        this.countriesData = countriesData;
        this.arcsData = arcsData;
        this.pointsData = pointsData;

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
        }else{
            this.onLoad()
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
} 