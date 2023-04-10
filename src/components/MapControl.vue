<template>
  <div class="overlay">
    <div style="background-color: rgba(100, 100, 100, 50); width: max-content">
      <q-checkbox v-model="controls.visibleSpread2" label="显示波束" />
      <q-checkbox v-model="controls.visibleSpread" label="显示全部波束" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { SimulatorControl } from "@/api/simulator";
import data1 from "@/assets/czml/dataAll.czml?raw";
import { useVueCesium } from "vue-cesium";
import type { VcReadyObject } from "vue-cesium/es/utils/types";
import { registerEvent } from "./interact";

const $vc = useVueCesium();
const viewer = $vc.viewer;
console.log("vc", viewer);

const controls = reactive({
  visibleSpread: false, // 显示全部波束
  visibleSpread2: false, // 显示波束
});

/* {
// 直接操作viewer | 注册点击事件
var alti_String = (viewer.camera.positionCartographic.height / 1000).toFixed(2);
  //altitude_show.innerHTML = alti_String;
  
  var altitude_show = document.getElementById("altitude_show");
  viewer.camera.changed.addEventListener(() => {
    // 当前高度
    let height = viewer.camera.positionCartographic.height;
    alti_String = (viewer.camera.positionCartographic.height / 1000).toFixed(2);
    if (altitude_show) {
      altitude_show.innerHTML = alti_String;
    }
  });} */

$vc.creatingPromise.then(async (readyObj: VcReadyObject) => {
  const ctrl = new SimulatorControl(viewer, {
    circleColor: Cesium.Color.WHITE,
    visibleSpread: false,
  });
  await ctrl.load(data1);
  ctrl.addUser(10);
  // 然后要注册事件
  // registerEvent(viewer);
  viewer.clock.shouldAnimate = true;
  // 注册监听事件，在postRenderListener回调函数中添加
  viewer.clock.onTick.addEventListener(() => {
    if (!ctrl.dataSource) throw "No datasource!";
    // ctrl.RefreshNear();
    // ctrl.sim.updatestate(viewer.clock.currentTime);
    // ctrl.sim.closebeam();
    // console.log(ctrl.showdata()); // TODO: show data
    /* if (controls2.visibleSpread2) {
        ctrl.showbeam();
      } else {
        ctrl.hideBeam();
      } */
  });
});
</script>

<style lang="scss">
.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 5;
  pointer-events: none;
}

.overlay * {
  pointer-events: all;
}
</style>
