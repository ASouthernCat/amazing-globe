import * as THREE from 'three';
import earthFragmentShader from './shader/simple-earth/earth.fs';
import earthVertexShader from './shader/simple-earth/earth.vs';
import atmosphereFragmentShader from './shader/simple-earth/atmosphere.fs';
import atmosphereVertexShader from './shader/simple-earth/atmosphere.vs';

export default class Earth extends THREE.Object3D {

    /**
     * Earth
     * @param {{
      * radius?: number
      * segments?: number
      * glowColor?: THREE.Color
      * atmosphereColor?: THREE.Color
     * }} config 
     * @param {Function} onLoad - 加载完成回调函数
     */
    constructor(config = {}, onLoad = () => {}) {
        const { radius = 2, segments = 64, glowColor = new THREE.Color(0x00aaff), atmosphereColor = new THREE.Color(0x00aaff)} = config;
        super();

        this.hasLoaded = false;
        this.onLoad = ()=>{
            if(!this.hasLoaded){
                onLoad()
                this.hasLoaded = true
            }
        };

        this.name = 'Earth'
        this.radius = radius;
        this.segments = segments;
        this.glowColor = glowColor;
        this.atmosphereColor = atmosphereColor;

        this.earthGeometry = new THREE.SphereGeometry(this.radius, this.segments, this.segments);
        this.earthTexture = new THREE.TextureLoader().load('texture/earth/day.jpg',()=>{
            this.onLoad()
        })
        this.earthMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                earthTexture: { value: this.earthTexture },
                glowColor: { value: this.glowColor },
            },
            vertexShader: earthVertexShader,
            fragmentShader: earthFragmentShader,
        });

        this.earthMesh = new THREE.Mesh(this.earthGeometry, this.earthMaterial);
        this.add(this.earthMesh);
        this.createAtmosphere();
    }

    createAtmosphere() {
        this.atmosphereMaterial = new THREE.ShaderMaterial({
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide,
            transparent: true,
            uniforms: {
                glowColor: { value: this.atmosphereColor },
            },
            vertexShader: atmosphereVertexShader,
            fragmentShader: atmosphereFragmentShader,
        });
        this.atmosphere = new THREE.Mesh(this.earthGeometry, this.atmosphereMaterial);
        this.atmosphere.scale.set(1.05, 1.05, 1.05);
        this.add(this.atmosphere);
    }

    update(delta){
        this.earthMaterial.uniforms.time.value += delta;
    }

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
        this.earthMesh.geometry.dispose();
        this.atmosphere.geometry.dispose();
        this.earthGeometry.dispose();
        this.earthMaterial.dispose();
        this.atmosphereMaterial.dispose();
    }
}