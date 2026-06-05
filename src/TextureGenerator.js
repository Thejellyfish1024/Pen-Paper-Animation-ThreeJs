import * as THREE from "three";

// paper texture
export function createPaperTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");

  // Base off-white color
  ctx.fillStyle = "#fcfbfa";
  ctx.fillRect(0, 0, 1024, 1024);

  // Draw  horizontal lines
  ctx.strokeStyle = "rgba(0, 150, 255, 0.15)";
  ctx.lineWidth = 2;
  for (let y = 100; y < 1024; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();
  }

  for (let i = 0; i < 20000; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const alpha = Math.random() * 0.04;
    ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    ctx.fillRect(x, y, 1, 1);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

// pen texture
export function createPenTexture(baseHexColor) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = baseHexColor;
  ctx.fillRect(0, 0, 256, 512);

  const gradient = ctx.createLinearGradient(0, 0, 256, 0);
  gradient.addColorStop(0, "rgba(255, 255, 255, 0.4)");
  gradient.addColorStop(0.3, "rgba(255, 255, 255, 0.0)");
  gradient.addColorStop(0.7, "rgba(0, 0, 0, 0.3)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0.1)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 512);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}
