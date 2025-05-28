uniform vec3 glowColor;
varying vec3 vNormal;
varying vec3 vPosition;
void main() {
    vec3 viewDirection = normalize(-vPosition);
    float intensity = pow(0.68 - dot(vNormal, viewDirection), 8.0);
    gl_FragColor = vec4(glowColor*intensity, intensity);
}