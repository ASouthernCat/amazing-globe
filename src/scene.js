import * as THREE from 'three';
import { gui } from './system/gui';
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

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#eee')
    const envMapUrl = '/royal_esplanade_1k.hdr' // 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/equirectangular/royal_esplanade_1k.hdr'
    new RGBELoader().load(envMapUrl, (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.environment = texture;
        scene.environmentIntensity = 1;
        scene.background = texture;
        scene.backgroundBlurriness = 1;
        mesh.material.envMap = scene.environment;
        mesh.material.needsUpdate = true;
    })

    const camera = new THREE.PerspectiveCamera(65, sizes.width / sizes.height, 0.1, 500);
    camera.position.set(0, 0, 6);

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    gui.add(controls, 'autoRotate')

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

    // object
    const mesh = new THREE.Mesh(
        new THREE.TorusKnotGeometry(1,0.35, 128, 64),
        new THREE.MeshLambertMaterial({
            color: 'yellow',
            combine: THREE.AddOperation,
            reflectivity: 0.15
        })
    )
    scene.add(mesh)

    initResizeEventListener([camera], [renderer, composer]);

    const clock = new THREE.Clock();
    let delta = 0;
    let tickId = null;
    const render = (t) => {
        delta = clock.getDelta();

        stats.update();
        
        controls.update();
        
        // renderer.render(scene, camera);
        composer.render();

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
