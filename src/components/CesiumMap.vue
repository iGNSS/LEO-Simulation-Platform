<template>
  <vc-config-provider :cesium-path="vcConfig.cesiumPath">
    <vc-viewer
      :base-layer-picker="false"
      :geocoder="false"
      :navigation-help-button="false"
      :home-button="false"
      :scene-mode-picker="false"
      :animation="false"
      :timeline="true"
      :fullscreen-button="false"
      :scene3-d-only="false"
      :should-animate="true"
      :info-box="false"
      :scene-mode="3"
      :request-render-mode="false"
      :selection-indicator="false"
      @cesium-ready="onCesiumReady"
      @ready="onViewerReady"
    >
      <vc-layer-imagery>
        <!-- https://services.arcgisonline.com/arcgis/rest/services -->
        <!-- https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer -->
        <!-- https://services.arcgisonline.com/arcgis/rest/services/World_Street_Map/MapServer -->
        <vc-imagery-provider-arcgis ref="provider" />
      </vc-layer-imagery>
      <map-control />
    </vc-viewer>
  </vc-config-provider>
</template>

<script setup lang="ts">
import { useVueCesium, VcConfigProvider, VcViewer } from "vue-cesium";
import MapControl from "./MapControl.vue";
import { VcLayerImagery, VcImageryProviderArcgis } from "vue-cesium";

const vcConfig = reactive({
  cesiumPath: "https://unpkg.com/cesium@latest/Build/Cesium/Cesium.js",
});

const provider = ref(null);

/* onMounted(() => {
  console.log(provider.value);
}); */

const onViewerReady = ({ Cesium, viewer }) => {
  function icrf(scene: Cesium.Scene, time: Cesium.JulianDate) {
    if (scene.mode !== Cesium.SceneMode.SCENE3D) {
      return;
    }

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
const onCesiumReady = e => {
  console.log(e);
};
</script>

<style scoped>
#cesiumContainer {
  /* height: 100vh;
  width: 100vw;
  overflow: hidden; */
  z-index: -5;
}
</style>
