import * as THREE from 'three';
import { pane } from './system/gui';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { sizes, initSizes } from './system/sizes';
import { clearResizeEventListener, initResizeEventListener } from './system/resize';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer, RenderPass } from 'postprocessing';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { initEffect } from './effect';

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
    light.position.set(3, 2, 1);
    scene.add(light);

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

    // earth
    let earth = null;
    const earthTypes = {
        "earth-simple": ceateEarthSimple,
        "earth-threejs-journey": createEarthThreejsJourney
    }
    earthTypes['earth-threejs-journey']() // default

    const earthFolder = pane.addFolder({title: 'earth'})
    earthFolder.addBlade({
        view: 'list',
        label: 'type',
        options: [
          {text: 'earth-simple', value: 'earth-simple'},
          {text: 'earth-threejs-journey', value: 'earth-threejs-journey'},
        ],
        value: 'earth-threejs-journey',
    }).on('change', (ev)=>{
        for (let i=0; i< earthFolder.children.length; i++){
            if(i!=0) {
                earthFolder.children[i]?.dispose()
                earthFolder.children[i]?.element?.remove()
            }
        }
        earth && scene.remove(earth)
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
