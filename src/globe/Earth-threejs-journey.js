import * as THREE from 'three';
import earthFragmentShader from './shader/threejs-journey-earth/earth/fragment.glsl';
import earthVertexShader from './shader/threejs-journey-earth/earth/vertex.glsl';
import atmosphereFragmentShader from './shader/threejs-journey-earth/atmosphere/fragment.glsl';
import atmosphereVertexShader from './shader/threejs-journey-earth/atmosphere/vertex.glsl';

const textureLoader = new THREE.TextureLoader();
textureLoader.setPath('texture/earth/')

export default class Earth extends THREE.Object3D {

    /**
     * Earth
     * @param {{
      * radius?: number
      * segments?: number
      * atmosphereDayColor?: string
      * atmosphereTwilightColor?: string
     * }} config 
     * @param {Function} onLoad - 加载完成回调函数
     */
    constructor(config = {}, onLoad = () => {}) {
        const { radius = 2, segments = 64, atmosphereDayColor = '#00aaff', atmosphereTwilightColor = '#ff6600' } = config;
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
        this.atmosphereDayColor = atmosphereDayColor;
        this.atmosphereTwilightColor = atmosphereTwilightColor;

        this.createEarth();
        this.createAtmosphere();
    }

    createEarth() {
        let textureCount = 0
        const checkTextureLoaded = ()=>{
            textureCount++
            if(textureCount === 3){
                this.onLoad()
            }
        }
        // Textures
        const earthDayTexture = textureLoader.load('day.jpg', checkTextureLoaded)
        earthDayTexture.colorSpace = THREE.SRGBColorSpace
        earthDayTexture.anisotropy = 8

        const earthNightTexture = textureLoader.load('night.jpg', checkTextureLoaded)
        earthNightTexture.colorSpace = THREE.SRGBColorSpace
        earthNightTexture.anisotropy = 8

        const earthSpecularCloudsTexture = textureLoader.load('specularClouds.jpg', checkTextureLoaded)
        earthSpecularCloudsTexture.anisotropy = 8

        // Mesh
        this.earthGeometry = new THREE.SphereGeometry(this.radius, this.segments, this.segments);
        this.earthMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uDayTexture: new THREE.Uniform(earthDayTexture),
                uNightTexture: new THREE.Uniform(earthNightTexture),
                uSpecularCloudsTexture: new THREE.Uniform(earthSpecularCloudsTexture),
                uSunDirection: new THREE.Uniform(new THREE.Vector3(-1, 0, 0)),
                uAtmosphereDayColor: new THREE.Uniform(new THREE.Color(this.atmosphereDayColor)),
                uAtmosphereTwilightColor: new THREE.Uniform(new THREE.Color(this.atmosphereTwilightColor))
            },
            vertexShader: earthVertexShader,
            fragmentShader: earthFragmentShader,
        });

        this.earthMesh = new THREE.Mesh(this.earthGeometry, this.earthMaterial);
        this.add(this.earthMesh);
    }

    createAtmosphere() {
        this.atmosphereMaterial = new THREE.ShaderMaterial({
            side: THREE.BackSide,
            transparent: true,
            uniforms: {
                uSunDirection: new THREE.Uniform(new THREE.Vector3(-1, 0, 0)),
                uAtmosphereDayColor: new THREE.Uniform(new THREE.Color(this.atmosphereDayColor)),
                uAtmosphereTwilightColor: new THREE.Uniform(new THREE.Color(this.atmosphereTwilightColor))        
            },
            vertexShader: atmosphereVertexShader,
            fragmentShader: atmosphereFragmentShader,
        });
        this.atmosphere = new THREE.Mesh(this.earthGeometry, this.atmosphereMaterial);
        this.atmosphere.scale.set(1.04, 1.04, 1.04);
        this.add(this.atmosphere);
    }

    update(delta) {
        this.earthMesh.rotation.y += 0.1 * delta;
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
        this.earthMaterial.dispose();
        this.atmosphereMaterial.dispose();
        this.earthGeometry.dispose();
    }
}