uniform vec3 glowColor;
varying vec3 vNormal;
void main() {
    float intensity = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 6.0);
    gl_FragColor = vec4(glowColor * intensity, 1.0);
}