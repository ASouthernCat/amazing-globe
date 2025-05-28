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
     *   pointsData?: any[]
     * }} config 
     */
    constructor(config = {}) {
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
            pointsData = []
        } = config;

        this.name = 'EarthGlobe';
        this.radius = radius;
        this.segments = segments;
        this.config = config;
        
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
            ringThickness: this.config.ringThickness ?? ringThickness
        });

        // 数据存储
        this.countriesData = countriesData;
        this.arcsData = arcsData;
        this.pointsData = pointsData;

        // 动画相关
        this.time = 0;
        this.clock = new THREE.Clock();

        this.initializeComponents();
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

        this.countriesData.features.forEach(feature => {
            if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
                this.createCountryPolygon(feature);
            }
        });

        this.add(this.countriesGroup);
    }

    createCountryPolygon(feature) {
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
                const material = new THREE.LineBasicMaterial({
                    color: this.config.polygonColor,
                    transparent: true,
                    opacity: 0.1,
                });

                const line = new THREE.Line(geometry, material);
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
        const staticMaterial = new THREE.LineBasicMaterial({
            color: arc.color || '#ffffff',
            transparent: true,
            opacity: 0.2
        });
        arcGroup.add(new THREE.Line(staticGeometry, staticMaterial));
        
        // 创建动画飞线
        const flyingGeometry = new THREE.BufferGeometry();
        const flyingMaterial = new THREE.LineBasicMaterial({
            color: arc.color || '#ffffff',
            vertexColors: true
        });
        arcGroup.add(new THREE.Line(flyingGeometry, flyingMaterial));
        
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
            flyingLength: this.config.flyingLineLength
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
        const material = new THREE.MeshBasicMaterial({
            color: color || '#ffffff',
            transparent: true,
            opacity: 0.8
        });
        return new THREE.Mesh(geometry, material);
    }

    createPoints() {
        this.pointsGroup = new THREE.Group();
        this.pointsGroup.name = 'Points';

        // 去重处理
        const uniquePoints = this.removeDuplicatePoints(this.pointsData);

        uniquePoints.forEach(point => {
            this.createPoint(point);
        });

        this.add(this.pointsGroup);
    }

    createPoint(point) {
        const position = this.latLngToVector3(point.lat, point.lng, this.radius + 0.5);
        
        const geometry = new THREE.SphereGeometry(this.config.pointSize);
        const material = new THREE.MeshBasicMaterial({
            color: point.color || '#ffffff',
            transparent: false,
        });

        const pointMesh = new THREE.Mesh(geometry, material);
        pointMesh.position.copy(position);
        
        this.pointsGroup.add(pointMesh);
    }

    createRings() {
        this.ringsGroup = new THREE.Group();
        this.ringsGroup.name = 'Rings';
        
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
        waves.forEach(wave => ringGroup.add(wave));
        
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
        const geometry = new THREE.CircleGeometry(this.config.maxRings * this.config.baseCircleScale);
        const material = new THREE.MeshBasicMaterial({
            color: point.color || this.config.polygonColor,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
        });
        const baseCircle = new THREE.Mesh(geometry, material);
        baseCircle.name = 'baseCircle';
        return baseCircle;
    }

    createWaveRings() {
        const waves = [];
        const ringThickness = this.config.maxRings * this.config.ringThickness;
        const baseRadius = this.config.maxRings * this.config.baseCircleScale;
        const gap = this.config.maxRings * 0.1;
        const innerRadius = baseRadius + gap;
        const outerRadius = innerRadius + ringThickness;
        
        for (let i = 0; i < this.config.waveCount; i++) {
            const geometry = new THREE.RingGeometry(innerRadius, outerRadius, 32);
            const material = new THREE.MeshBasicMaterial({
                color: '#ffffff',
                transparent: true,
                opacity: 0.8,
                side: THREE.DoubleSide,
                depthTest: true,
                depthWrite: false
            });
            
            const wave = new THREE.Mesh(geometry, material);
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

    // 更新方法
    update(delta) {
        this.time += delta;

        // 自动旋转
        if (this.config.autoRotate) {
            this.rotation.y += this.config.autoRotateSpeed * delta;
        }

        // 更新环形动画
        if (this.ringsGroup) {
            this.ringsGroup.children.forEach(ringGroup => {
                const userData = ringGroup.userData;
                if (!userData || !userData.waves) return;
                
                // 初始化startTime
                if (userData.startTime === 0) {
                    userData.startTime = this.time;
                }
                
                const groupElapsed = this.time - userData.startTime;
                
                // 更新底圆的脉冲效果
                if (userData.baseCircle) {
                    const pulseScale = 1 + 0.15 * Math.sin(groupElapsed * 4);
                    const pulseOpacity = 0.5 + 0.3 * Math.sin(groupElapsed * 2);
                    userData.baseCircle.scale.setScalar(pulseScale);
                    userData.baseCircle.material.opacity = pulseOpacity;
                }
                
                // 更新每个波浪圆环
                userData.waves.forEach(wave => {
                    const waveElapsed = groupElapsed - wave.userData.animationOffset;
                    const waveDuration = this.config.waveDuration;
                    
                    if (waveElapsed < 0) {
                        // 还没开始
                        wave.visible = false;
                        return;
                    }
                    
                    wave.visible = true;
                    const progress = (waveElapsed % waveDuration) / waveDuration;
                    
                    if (progress > 1) {
                        wave.visible = false;
                        return;
                    }
                    
                    // 计算缩放和透明度
                    const scale = wave.userData.initialScale + progress * wave.userData.maxScale;
                    const fadeOut = 1 - Math.pow(progress, 1.5); // 更平滑的衰减
                    const opacity = Math.max(0, wave.userData.initialOpacity * fadeOut);
                    
                    // 使用缩放而不是重新创建几何体（性能更好）
                    wave.scale.setScalar(scale);
                    wave.material.opacity = opacity;
                });
            });
        }

        // 更新弧线动画
        if (this.arcsGroup) {
            this.arcsGroup.children.forEach(arcGroup => {
                const userData = arcGroup.userData;
                if (!userData || !userData.points) return;
                
                const animationTime = (this.time * 1000 + userData.animationOffset) % this.config.arcTime;
                const progress = animationTime / this.config.arcTime;
                
                // 更新飞线动画
                this.updateFlyingLine(arcGroup, progress);
                
                // 更新粒子位置
                if (userData.particle) {
                    this.updateParticle(arcGroup, progress);
                }
            });
        }
    }

    updateFlyingLine(arcGroup, progress) {
        const userData = arcGroup.userData;
        const { points, flyingGeometry, flyingLength } = userData;
        
        if (!points || points.length === 0) return;
        
        // 计算当前飞线的起始和结束索引
        const totalPoints = points.length;
        const currentIndex = Math.floor(progress * totalPoints);
        const startIndex = Math.max(0, currentIndex - flyingLength);
        const endIndex = Math.min(totalPoints - 1, currentIndex);
        
        // 如果飞线还没开始或已经结束，隐藏飞线
        if (startIndex >= endIndex) {
            flyingGeometry.setFromPoints([]);
            return;
        }
        
        // 创建飞线的点数组
        const flyingPoints = points.slice(startIndex, endIndex + 1);
        
        // 添加渐变颜色效果
        if (flyingPoints.length > 1) {
            const colors = [];
            flyingPoints.forEach((point, index) => {
                const intensity = index / (flyingPoints.length - 1);
                colors.push(intensity, intensity, intensity);
            });
            
            flyingGeometry.setFromPoints(flyingPoints);
            flyingGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        } else {
            flyingGeometry.setFromPoints(flyingPoints);
        }
    }

    updateParticle(arcGroup, progress) {
        const userData = arcGroup.userData;
        const { points, particle } = userData;
        
        if (!points || points.length === 0 || !particle) return;
        
        // 计算粒子在曲线上的位置
        const totalPoints = points.length;
        const currentIndex = Math.floor(progress * (totalPoints - 1));
        const nextIndex = Math.min(currentIndex + 1, totalPoints - 1);
        
        if (currentIndex >= totalPoints - 1) {
            // 动画结束时隐藏粒子
            particle.visible = false;
            return;
        }
        
        particle.visible = true;
        
        // 在两个点之间进行插值以获得平滑的运动
        const localProgress = (progress * (totalPoints - 1)) - currentIndex;
        const currentPoint = points[currentIndex];
        const nextPoint = points[nextIndex];
        
        particle.position.lerpVectors(currentPoint, nextPoint, localProgress);
        
        // 添加粒子的脉冲效果
        const pulseScale = 1 + 0.5 * Math.sin(this.clock.getElapsedTime() * 30.0);
        particle.scale.setScalar(pulseScale);
        
        // 粒子透明度动画
        const fadeProgress = Math.sin(progress * Math.PI); // 在起点和终点处更透明
        particle.material.opacity = 0.8 * fadeProgress;
    }

    // 清理方法
    dispose() {
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
        }
        if (newArcsData.length > 0) {
            this.createArcs();
        }
    }

    updatePointsData(newPointsData) {
        this.pointsData = newPointsData;
        if (this.pointsGroup) {
            this.remove(this.pointsGroup);
        }
        if (this.ringsGroup) {
            this.remove(this.ringsGroup);
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
        }
        if (newCountriesData) {
            this.createCountries();
        }
    }
} 