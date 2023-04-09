<template>
  <div>

  </div>
</template>

<script setup lang="ts">
import dat from "dat.gui";
import { useVueCesium } from 'vue-cesium'
import type { VcViewerProvider } from 'vue-cesium/es/utils/types'

const $vc = useVueCesium();
console.log($vc);

const gui = new dat.GUI();

const controls = {
  visibleSpread: false,
};

const controls2 = {
  visibleSpread2: false,
};

gui.add(controls2, "visibleSpread2").name("显示波束");
    //gui.add(controls, "visibleSpread").name("显示全部波束");
</script>

<style lang="scss"></style>