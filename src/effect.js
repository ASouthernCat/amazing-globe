import { EffectComposer, EffectPass, SMAAEffect, VignetteEffect } from 'postprocessing';

/**
 * 
 * @param {EffectComposer} composer 
 * @param {*} camera 
 */
function initEffect(composer, camera) {
    // smaa
    const smaaEffect = new SMAAEffect();
    const smaaPass = new EffectPass(camera, smaaEffect);
    composer.addPass(smaaPass);
    // vignette
    const vignetteEffect = new VignetteEffect({
        offset: 0.45,
        darkness: 0.45
    })
    const vignettePass = new EffectPass(camera, vignetteEffect);
    composer.addPass(vignettePass);
}

export { initEffect }