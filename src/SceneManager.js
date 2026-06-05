import * as THREE from "three";
import { createCustomMaterial } from "./CustomShaderMaterial.js";
import { CanvasManager } from "./CanvasManager.js";
import { createPaperTexture, createPenTexture } from "./TextureGenerator.js";

export class SceneManager {
  constructor(container) {
    this.container = container;
    this.isWriting = false;

    // Camera angles tracking (Spherical Coordinates)
    this.theta = 0;
    this.phi = Math.PI / 3;
    this.radius = 16;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.paperBG = createPaperTexture();
    this.penTextures = {
      blue: createPenTexture("#0033cc"),
      red: createPenTexture("#cc1111"),
    };

    // Animation flag
    this.isIntroAnimating = true;

    this.init();
    this.createObjects();
    this.setupEventListeners();

    // Start loop
    this.animate();

    // Trigger the automated circle drawing animation
    this.playIntroAnimation();
  }

  init() {
    this.scene = new THREE.Scene();
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
    const paperWidth = 9;
    const paperHeight = 11;

    // 3D Notebook block base
    const padThickness = 0.2;
    const padGeo = new THREE.BoxGeometry(
      paperWidth + 0.1,
      padThickness,
      paperHeight + 0.1,
    );
    const padBackingTex = createPenTexture("#d2b48c");
    const padMat = createCustomMaterial(padBackingTex);
    const notebookPad = new THREE.Mesh(padGeo, padMat);
    notebookPad.position.y = -padThickness / 2;
    this.scene.add(notebookPad);

    // Interactive Drawing Paper Surface
    this.canvasManager = new CanvasManager(this.paperBG);
    const paperGeo = new THREE.PlaneGeometry(paperWidth, paperHeight);
    const paperMat = createCustomMaterial(this.canvasManager.texture);

    this.paper = new THREE.Mesh(paperGeo, paperMat);
    this.paper.rotation.x = -Math.PI / 2;
    this.paper.position.y = 0.001;
    this.scene.add(this.paper);

    //  Pen Mesh with cylinder
    this.pen = new THREE.Group();

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

    const tipHeight = 0.5;
    this.penBody.position.y = tipHeight + bodyLength / 2;
    this.pen.add(this.penBody);

    //  Cone Geo
    const tipGeo = new THREE.ConeGeometry(bodyRadius, tipHeight, 32);
    tipGeo.rotateZ(Math.PI);

    const tipMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const tipMesh = new THREE.Mesh(tipGeo, tipMat);
    tipMesh.position.y = tipHeight / 2;
    this.pen.add(tipMesh);

    this.scene.add(this.pen);
  }

  //  circle animation
  playIntroAnimation() {
    let angle = 0;
    const speed = 0.03;
    const radiusX = 0.25;
    const radiusY = 0.2;
    const centerX = 0.5;
    const centerY = 0.5;

    const startX = centerX + Math.cos(angle) * radiusX;
    const startY = centerY + Math.sin(angle) * radiusY;
    this.canvasManager.startStroke(startX, startY);

    const drawStep = () => {
      if (angle <= Math.PI * 2) {
        angle += speed;

        // Calculate next circular coordinates path point
        const currentX = centerX + Math.cos(angle) * radiusX;
        const currentY = centerY + Math.sin(angle) * radiusY;

        // Move 3D pen visual mesh to follow the drawing path coordinates
        // Map 2D UV coordinate properties back into 3D space locations on paper mesh
        this.pen.position.x = (currentX - 0.5) * 10;
        this.pen.position.z = -(currentY - 0.5) * 13;
        this.pen.rotation.z = 0.35;

        // Append line path changes onto texture layer array tracking matrix
        this.canvasManager.continueStroke(currentX, currentY);

        // Request next animation frame loop step
        requestAnimationFrame(drawStep);
      } else {
        this.canvasManager.endStroke();
        this.isIntroAnimating = false;
        this.pen.rotation.z = 0.1;
      }
    };

    drawStep();
  }

  setupEventListeners() {
    window.addEventListener("resize", () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Keyboard Interaction: 4-Way Orbit Controls
    window.addEventListener("keydown", (e) => {
      const sensitivity = 0.05;

      if (e.key === "ArrowLeft") this.theta -= sensitivity;
      if (e.key === "ArrowRight") this.theta += sensitivity;

      if (e.key === "ArrowUp") {
        this.phi -= sensitivity;
        if (this.phi < 0.1) this.phi = 0.1;
      }
      if (e.key === "ArrowDown") {
        this.phi += sensitivity;
        if (this.phi > Math.PI / 2 - 0.05) this.phi = Math.PI / 2 - 0.05;
      }

      this.updateCameraPosition();
    });

    window.addEventListener("mousemove", (e) => this.onMouseMove(e));
    window.addEventListener("mousedown", (e) => this.onMouseDown(e));
    window.addEventListener("mouseup", () => this.onMouseUp());
  }

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
    // Block mouse interference while animation loop is running
    if (this.isIntroAnimating) return;

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
    if (this.isIntroAnimating) return;

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
    if (this.isIntroAnimating) return;
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
