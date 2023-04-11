<template>
  <vc-config-provider :cesium-path="vcConfig.cesiumPath">
    <vc-viewer
      :base-layer-picker="false"
      :geocoder="false"
      :navigation-help-button="false"
      :home-button="false"
      :scene-mode-picker="false"
      :animation="true"
      :timeline="true"
      :fullscreen-button="false"
      :scene3-d-only="true"
      :should-animate="false"
      :info-box="true"
      :scene-mode="3"
      :request-render-mode="false"
      :selection-indicator="true"
      @cesium-ready="onCesiumReady"
      @ready="onViewerReady"
    >
      <heatmap ref="heatmap" />
      <vc-layer-imagery>
        <!-- https://services.arcgisonline.com/arcgis/rest/services -->
        <!-- https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer -->
        <!-- https://services.arcgisonline.com/arcgis/rest/services/World_Street_Map/MapServer -->
        <vc-imagery-provider-arcgis ref="provider" />
      </vc-layer-imagery>
      <map-control v-if="initialized" />
    </vc-viewer>
  </vc-config-provider>
</template>

<script setup lang="ts">
import { VcConfigProvider, VcImageryProviderArcgis, VcLayerImagery, VcViewer } from "vue-cesium";
import type { VcReadyObject } from "vue-cesium/es/utils/types";
import MapControl from "./MapControl.vue";
import Heatmap from "./Heatmap.vue";

const initialized = ref(false);

const vcConfig = reactive({
  cesiumPath: "https://unpkg.com/cesium@latest/Build/Cesium/Cesium.js",
});

const provider = ref(null);
const heatmap = ref(null);

const onCesiumReady = (e: any) => {
  console.log("CesiumReady", e); // 这里e为cesium
};
// Viewer gets ready later than Cesium.
const onViewerReady = ({ Cesium, viewer }: VcReadyObject) => {
  console.log("Viewer Ready", Cesium);
  initialized.value = true;
  function icrf(scene: Cesium.Scene, time: Cesium.JulianDate) {
    if (scene.mode !== Cesium.SceneMode.SCENE3D) return;

    const icrfToFixed = Cesium.Transforms.computeIcrfToFixedMatrix(time);
    if (Cesium.defined(icrfToFixed)) {
      const camera = viewer.camera;
      const offset = Cesium.Cartesian3.clone(camera.position);
      const transform = Cesium.Matrix4.fromRotationTranslation(icrfToFixed);
      camera.lookAtTransform(transform, offset);
    }
  }

  viewer.scene.globe.depthTestAgainstTerrain = false;
  viewer.scene.postUpdate.addEventListener(icrf);
};

provide("heatmap", heatmap);
</script>

<style lang="scss">
#cesiumContainer {
  height: 100vh !important;
  width: 100vw !important;
  overflow: hidden;
  z-index: -5;
}
</style>
