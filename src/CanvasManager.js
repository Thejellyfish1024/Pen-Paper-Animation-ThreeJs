import * as THREE from "three";

export class CanvasManager {
  constructor(paperBackgroundTexture) {
    this.paperBG = paperBackgroundTexture;

    this.canvas = document.createElement("canvas");
    this.canvas.width = 2048; // Crisp drawing resolution
    this.canvas.height = 2048;
    this.ctx = this.canvas.getContext("2d");

    this.texture = new THREE.CanvasTexture(this.canvas);
    this.history = [];
    this.currentStroke = [];
    this.currentColor = "#0022cc"; // Default Blue Ink

    this.resetToBackground();
  }

  resetToBackground() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (this.paperBG && this.paperBG.image) {
      this.ctx.drawImage(
        this.paperBG.image,
        0,
        0,
        this.canvas.width,
        this.canvas.height,
      );
    } else {
      this.ctx.fillStyle = "#ffffff";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    this.texture.needsUpdate = true;
  }

  startStroke(x, y) {
    this.currentStroke = [{ x, y }];
  }

  continueStroke(x, y) {
    if (this.currentStroke.length === 0) return;

    const lastPoint = this.currentStroke[this.currentStroke.length - 1];

    this.ctx.strokeStyle = this.currentColor;
    this.ctx.lineWidth = 10;
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";

    this.ctx.beginPath();
    this.ctx.moveTo(
      lastPoint.x * this.canvas.width,
      (1 - lastPoint.y) * this.canvas.height,
    );
    this.ctx.lineTo(x * this.canvas.width, (1 - y) * this.canvas.height);
    this.ctx.stroke();

    this.currentStroke.push({ x, y });
    this.texture.needsUpdate = true;
  }

  endStroke() {
    if (this.currentStroke.length > 1) {
      this.history.push({
        points: [...this.currentStroke],
        color: this.currentColor,
      });
    }
    this.currentStroke = [];
  }

  undo() {
    this.history.pop();
    this.redrawAll();
  }

  clearAll() {
    this.history = [];
    this.resetToBackground();
  }

  redrawAll() {
    this.resetToBackground();
    this.history.forEach((stroke) => {
      if (stroke.points.length < 2) return;
      this.ctx.strokeStyle = stroke.color;
      this.ctx.lineWidth = 10;
      this.ctx.lineCap = "round";
      this.ctx.lineJoin = "round";

      this.ctx.beginPath();
      this.ctx.moveTo(
        stroke.points[0].x * this.canvas.width,
        (1 - stroke.points[0].y) * this.canvas.height,
      );

      for (let i = 1; i < stroke.points.length; i++) {
        this.ctx.lineTo(
          stroke.points[i].x * this.canvas.width,
          (1 - stroke.points[i].y) * this.canvas.height,
        );
      }
      this.ctx.stroke();
    });
    this.texture.needsUpdate = true;
  }
}
