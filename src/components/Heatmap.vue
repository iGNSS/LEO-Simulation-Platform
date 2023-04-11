<template>
  <vc-overlay-heatmap
    v-if="data.length"
    ref="heatmap"
    :data="data"
    :rectangle="props.rectangle"
    :max="props.max"
    :min="props.min"
    :options="options"
    @ready="onHeatmapReady"
    type="primitive"
  />
</template>

<script setup lang="ts">
import { VcOverlayHeatmapRef } from "vue-cesium";
import {
  HeatmapConfiguration,
  VcHeatMapData,
  VcReadyObject,
  VcRectangle,
} from "vue-cesium/es/utils/types";

const heatmap = ref<VcOverlayHeatmapRef>();

const props = reactive({
  max: 0,
  min: 0,
  rectangle: <VcRectangle>{},
});

const options: HeatmapConfiguration = reactive({
  radius: 0,
  maxOpacity: 0.5,
  minOpacity: 0,
  blur: 0.75,
  gradient: {
    0.9: "red",
    0.8: "orange",
    0.7: "yellow",
    0.5: "blue",
    0.3: "green",
  },
});

let data = ref<VcHeatMapData[]>([]);

const setScope = (scope: Cesium.Rectangle, radius: int) => {
  options.radius = radius;
  const width = ((scope.east - scope.west) / Cesium.Math.PI) * 1000;
  const height = ((scope.north - scope.south) / Cesium.Math.PI) * 1000;
};

const setData = (min: number, max: number, data_: VcHeatMapData[]) => {
  props.min = min;
  props.max = max;
  data.value = data_;
};

const onHeatmapReady = ({ Cesium, viewer, cesiumObject }: VcReadyObject) => {};

defineExpose({ setScope, setData });
</script>

<style lang="scss"></style>
