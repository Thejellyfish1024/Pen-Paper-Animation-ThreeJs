import * as THREE from "three";

const vertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vUv = uv;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalMatrix * normal;
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  uniform sampler2D uTexture;
  uniform vec3 uLightPosition;
  uniform vec3 uLightColor;
  uniform vec3 uAmbientColor;

  void main() {
    vec4 texColor = texture2D(uTexture, vUv);
    
    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(uLightPosition + vViewPosition);

    // Lambertian lighting calculation
    float dotNL = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = dotNL * uLightColor;

    vec3 finalLighting = uAmbientColor + diffuse;
    
    gl_FragColor = vec4(texColor.rgb * finalLighting, texColor.a);
  }
`;

export function createCustomMaterial(texture) {
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uTexture: { value: texture },
      uLightPosition: { value: new THREE.Vector3(6, 12, 6) },
      uLightColor: { value: new THREE.Color(0xffffff) },
      uAmbientColor: { value: new THREE.Color(0.45, 0.45, 0.45) },
    },
    side: THREE.DoubleSide,
  });
}
