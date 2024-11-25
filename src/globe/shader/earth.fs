uniform float time;
uniform sampler2D earthTexture;
uniform vec3 glowColor;
varying vec3 vNormal;
varying vec2 vUv;
void main() {
    // 地球表面贴图
    vec4 textureColor = texture2D(earthTexture, vUv);
    float glow = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
    vec3 color = textureColor.rgb + glow * glowColor;
    gl_FragColor = vec4(color, 1.0);
}