<template>
  <div class="overlay">
    <q-chip icon="event">Add to calendar</q-chip>
    <q-btn color="primary" icon="mail" label="On Left" />
    <q-btn color="secondary" size="sm" icon-right="mail" label="On Right" />
    <q-btn color="red" icon="mail" icon-right="send" label="On Left and Right" />
    <br />
    <q-btn icon="phone" label="Stacked" stack glossy color="purple" />
    <q-btn flat color="primary" label="Flat" />
    <q-btn flat rounded color="primary" label="Flat Rounded" />
    <q-btn flat round color="primary" icon="card_giftcard" />
    <q-btn outline color="primary" label="Outline" />
    <q-btn outline rounded color="primary" label="Outline Rounded" />
    <q-btn outline round color="primary" icon="card_giftcard" />
    <q-btn push color="primary" label="Push" />
    <q-btn push color="primary" round icon="card_giftcard" />
    <q-btn push color="white" text-color="primary" label="Push" />
    <q-btn push color="white" text-color="primary" round icon="card_giftcard" />
  </div>
</template>

<script setup lang="ts">
import dat from "dat.gui";
import { useVueCesium } from "vue-cesium";

const $vc = useVueCesium();
const viewer = $vc.viewer; // It may be undefined before mounted
console.log($vc, viewer);

const gui = new dat.GUI();

const controls = {
  visibleSpread: false,
};

const controls2 = {
  visibleSpread2: false,
};

gui.add(controls2, "visibleSpread2").name("显示波束");
//gui.add(controls, "visibleSpread").name("显示全部波束");

onMounted(() => {
  console.log("mounted", $vc, $vc.viewer); // Still can't get viewer
  const $q = useQuasar();
  $q.notify({ type: "info", position: "bottom", message: "Hello Satellite!" });
});

// Use this
$vc.creatingPromise.then((readyObj: VcReadyObject) => {
  console.log("creatingPromise", readyObj.viewer); // instanceof Cesium.Viewer
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
