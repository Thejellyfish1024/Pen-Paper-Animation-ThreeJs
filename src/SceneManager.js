import * as THREE from "three";
import { createCustomMaterial } from "./CustomShaderMaterial.js";
import { CanvasManager } from "./CanvasManager.js";
import {
  createProceduralPaperTexture,
  createProceduralPenTexture,
} from "./TextureGenerator.js";

export class SceneManager {
  constructor(container) {
    this.container = container;
    this.isWriting = false;

    // Camera angles tracking (Spherical Coordinates)
    this.theta = 0; // Horizontal angle (Left/Right)
    this.phi = Math.PI / 3; // Vertical angle (Up/Down) - start at an angled view
    this.radius = 16; // Camera distance

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.paperBG = createProceduralPaperTexture();
    this.penTextures = {
      blue: createProceduralPenTexture("#0033cc"),
      red: createProceduralPenTexture("#cc1111"),
    };

    this.init();
    this.createObjects();
    this.setupEventListeners();
    this.animate();
  }

  init() {
    this.scene = new THREE.Scene();
    // 1. Set the Three.js scene background to pitch black
    this.scene.background = new THREE.Color(0x000000);

    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    this.updateCameraPosition();

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.container.appendChild(this.renderer.domElement);
  }

  createObjects() {
    // 1. Interactive Paper Surface Mesh
    this.canvasManager = new CanvasManager(this.paperBG);
    const paperGeo = new THREE.PlaneGeometry(9, 11);
    const paperMat = createCustomMaterial(this.canvasManager.texture);

    this.paper = new THREE.Mesh(paperGeo, paperMat);
    this.paper.rotation.x = -Math.PI / 2;
    this.scene.add(this.paper);

    // 2. 3D Structural Pen Mesh Composition
    this.pen = new THREE.Group();

    // Main Body Cylinder
    const bodyLength = 3.8;
    const bodyRadius = 0.14;
    const bodyGeo = new THREE.CylinderGeometry(
      bodyRadius,
      bodyRadius,
      bodyLength,
      32,
    );
    const bodyMat = createCustomMaterial(this.penTextures["blue"]);
    this.penBody = new THREE.Mesh(bodyGeo, bodyMat);

    // Position body so its bottom rests exactly above the sharpened tip
    const tipHeight = 0.5;
    this.penBody.position.y = tipHeight + bodyLength / 2;
    this.pen.add(this.penBody);

    // Sharpened Conical Point Tip (Pointing Downwards like a triangle)
    // ConeGeometry(radius, height, radialSegments)
    const tipGeo = new THREE.ConeGeometry(bodyRadius, tipHeight, 32);

    // By default, Three.js cones look like ▲ (apex at top).
    // We rotate it 180 degrees (Math.PI) around the Z axis so it points down: ▼
    tipGeo.rotateZ(Math.PI);

    const tipMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const tipMesh = new THREE.Mesh(tipGeo, tipMat);

    // Position the tip so its sharp apex sits exactly at y = 0 (the pivot point)
    tipMesh.position.y = tipHeight / 2;
    this.pen.add(tipMesh);

    // Since the sharp tip apex is now at local y = 0, we don't need to offset children manually anymore.
    this.scene.add(this.pen);
  }

  setupEventListeners() {
    window.addEventListener("resize", () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // 2. Keyboard Interaction: All four arrow keys mapping
    window.addEventListener("keydown", (e) => {
      const sensitivity = 0.05;

      if (e.key === "ArrowLeft") this.theta -= sensitivity;
      if (e.key === "ArrowRight") this.theta += sensitivity;

      if (e.key === "ArrowUp") {
        this.phi -= sensitivity;
        // Clamp to prevent camera flipping upside down at the poles
        if (this.phi < 0.1) this.phi = 0.1;
      }
      if (e.key === "ArrowDown") {
        this.phi += sensitivity;
        if (this.phi > Math.PI / 2 - 0.05) this.phi = Math.PI / 2 - 0.05; // Stay above paper level
      }

      this.updateCameraPosition();
    });

    window.addEventListener("mousemove", (e) => this.onMouseMove(e));
    window.addEventListener("mousedown", (e) => this.onMouseDown(e));
    window.addEventListener("mouseup", () => this.onMouseUp());
  }

  // Updates perspective camera coordinates along an orbital sphere surface
  updateCameraPosition() {
    this.camera.position.x =
      this.radius * Math.sin(this.phi) * Math.sin(this.theta);
    this.camera.position.y = this.radius * Math.cos(this.phi);
    this.camera.position.z =
      this.radius * Math.sin(this.phi) * Math.cos(this.theta);
    this.camera.lookAt(0, 0, 0);
  }

  updateRaycast(e) {
    this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);
  }

  onMouseMove(e) {
    this.updateRaycast(e);
    const intersects = this.raycaster.intersectObject(this.paper);

    if (intersects.length > 0) {
      const hitPoint = intersects[0].point;
      const uv = intersects[0].uv;

      this.pen.position.copy(hitPoint);
      this.pen.rotation.z = this.isWriting ? 0.35 : 0.1;
      this.pen.rotation.x = this.isWriting ? 0.15 : 0;

      if (this.isWriting) {
        this.canvasManager.continueStroke(uv.x, uv.y);
      }
    }
  }

  onMouseDown(e) {
    if (e.button === 0) {
      this.updateRaycast(e);
      const intersects = this.raycaster.intersectObject(this.paper);
      if (intersects.length > 0) {
        this.isWriting = true;
        const uv = intersects[0].uv;
        this.canvasManager.startStroke(uv.x, uv.y);
      }
    } else if (e.button === 2) {
      e.preventDefault();
      this.switchPenStyle();
    }
  }

  onMouseUp() {
    this.isWriting = false;
    if (this.canvasManager) this.canvasManager.endStroke();
  }

  switchPenStyle() {
    this.activePenType = this.activePenType === "blue" ? "red" : "blue";
    this.penBody.material.uniforms.uTexture.value =
      this.penTextures[this.activePenType];
    this.canvasManager.currentColor =
      this.activePenType === "blue" ? "#0033cc" : "#cc1111";
  }

  triggerUndo() {
    this.canvasManager.undo();
  }
  triggerClear() {
    this.canvasManager.clearAll();
  }

  animate = () => {
    requestAnimationFrame(this.animate);
    this.renderer.render(this.scene, this.camera);
  };
}
