varying vec3 vNormal;
varying vec3 vPosition;
void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vPosition = mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
}