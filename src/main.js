import { SceneManager } from "./SceneManager.js";

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("app");
  const sceneManager = new SceneManager(container);

  document
    .getElementById("btn-undo")
    .addEventListener("click", () => sceneManager.triggerUndo());
  document
    .getElementById("btn-clear")
    .addEventListener("click", () => sceneManager.triggerClear());

  window.addEventListener("contextmenu", (e) => e.preventDefault());
});
