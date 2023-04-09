<template>
  <div>

  </div>
</template>

<script setup lang="ts">
import dat from "dat.gui";
import { useVueCesium } from 'vue-cesium'

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
  console.log($vc)
});

</script>

<style lang="scss"></style>