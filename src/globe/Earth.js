import * as THREE from 'three';
import earthFragmentShader from './shader/earth.fs';
import earthVertexShader from './shader/earth.vs';
import atmosphereFragmentShader from './shader/atmosphere.fs';
import atmosphereVertexShader from './shader/atmosphere.vs';

export default class Earth extends THREE.Object3D {

    /**
     * Earth
     * @param {{
      * radius?: number
      * segments?: number
      * glowColor?: THREE.Color
      * atmosphereColor?: THREE.Color
     * }} config 
     */
    constructor(config = {}) {
        const { radius = 1.5, segments = 64, glowColor = new THREE.Color(0x00aaff), atmosphereColor = new THREE.Color(0x00aaff)} = config;
        super();
        this.name = 'Earth'
        this.radius = radius;
        this.segments = segments;
        this.glowColor = glowColor;
        this.atmosphereColor = atmosphereColor;

        this.earthGeometry = new THREE.SphereGeometry(this.radius, this.segments, this.segments);
        this.earthMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                earthTexture: { value: new THREE.TextureLoader().load('texture/earth/day.jpg') },
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
        const atmosphereGeometry = new THREE.SphereGeometry(this.radius + 0.05, this.segments, this.segments);
        const atmosphereMaterial = new THREE.ShaderMaterial({
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide,
            transparent: true,
            uniforms: {
                glowColor: { value: this.atmosphereColor },
            },
            vertexShader: atmosphereVertexShader,
            fragmentShader: atmosphereFragmentShader,
        });
        this.atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        this.add(this.atmosphere);
    }

    update(delta){
        this.earthMaterial.uniforms.time.value += delta;
    }
}