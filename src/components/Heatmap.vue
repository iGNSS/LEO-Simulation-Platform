<template>
  <vc-overlay-heatmap
    ref="heatmap"
    :show="props.show"
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
import { VcOverlayHeatmap } from "vue-cesium";
import {
  HeatmapConfiguration,
  VcHeatMapData,
  VcReadyObject,
  VcRectangle,
} from "vue-cesium/es/utils/types";
import { deg2Coord } from "@/utils/cesium-math";

const heatmap = shallowRef(null);

const props = reactive({
  ready: false,
  show: false,
  max: 1,
  min: 0,
  rectangle: <VcRectangle>[0, 0, 1, 1],
});

const options: any = reactive({
  backgroundColor: "rgb(0,0,255)",
  opacity: 0.2,
  radius: 5,
  maxOpacity: 0.5,
  minOpacity: 0,
  blur: 0.75,
  gradient: {
    0.9: "red",
    0.7: "orange",
    0.5: "yellow",
    0.3: "blue",
    0.1: "green",
  },
});

let data = shallowRef<VcHeatMapData[]>([]);

let rectToSet: { scope: Cesium.Rectangle; dlat: number } | undefined = undefined;

function setRect(scope: Cesium.Rectangle, dlat: number) {
  if (!props.ready) {
    rectToSet = { scope, dlat };
    return;
  }
  console.log("setRect", scope, deg2Coord(dlat));
  options.radius = 25 / (scope.north - scope.south);
  props.rectangle = scope;
}

function setData(min: number, max: number, data_: VcHeatMapData[]) {
  props.min = min;
  props.max = max;
  data.value = data_;
}

const onHeatmapReady = ({ Cesium, viewer, cesiumObject }: VcReadyObject) => {
  console.log("Heatmap Ready");
  props.ready = true;
  if (rectToSet) {
    setRect(rectToSet.scope, rectToSet.dlat);
    rectToSet = undefined;
  }
};

defineExpose({ heatmap, props, setRect, setData });
</script>

<style lang="scss"></style>
