import { SceneManager } from "./SceneManager.js";

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("app");
  const sceneManager = new SceneManager(container);

  // Bind operational events to the HTML Control panel interface elements
  document
    .getElementById("btn-undo")
    .addEventListener("click", () => sceneManager.triggerUndo());
  document
    .getElementById("btn-clear")
    .addEventListener("click", () => sceneManager.triggerClear());

  // Intercept the default browser context menu to ensure Right Click alternates textures smoothly
  window.addEventListener("contextmenu", (e) => e.preventDefault());
});
