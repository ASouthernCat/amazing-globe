import { initScene } from "./src/scene";

onload = () => {
  initScene();
  document.querySelector('.loader-container').classList.toggle('loaded')
}