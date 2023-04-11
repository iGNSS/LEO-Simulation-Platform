<template>
  <div class="overlay" v-if="initialized">
    <div class="left">
      <q-card dark>
        <q-card-section class="bg-grey-9">
          <div class="text-h6">视角调整</div>
        </q-card-section>
        <q-card-section>
          <q-input
            v-model.number="controls.height"
            type="number"
            dark
            style="max-width: 10em"
            label="视角高度"
            suffix="km"
            @focus="controls.heightFocused = true"
            @blur="controls.heightFocused = false"
            @update:model-value="onCameraPositionChanged"
          />
          <q-input
            v-model.number="controls.longitude"
            type="number"
            dark
            style="max-width: 10em"
            label="视角经度"
            suffix="°"
            @focus="controls.longitudeFocused = true"
            @blur="controls.longitudeFocused = false"
            @update:model-value="onCameraPositionChanged"
          />
          <q-input
            v-model.number="controls.latitude"
            type="number"
            dark
            style="max-width: 10em"
            label="视角纬度"
            suffix="°"
            @focus="controls.latitudeFocused = true"
            @blur="controls.latitudeFocused = false"
            @update:model-value="onCameraPositionChanged"
          />
        </q-card-section>
      </q-card>
      <q-card dark class="info-card">
        <q-card-section class="bg-grey-9">
          <div class="text-h6">低轨卫星星座参数</div>
        </q-card-section>
        <q-card-section>
          <p>轨道卫星个数：{{ curInfo.satelliteNum }}</p>
          <p>轨道数：{{ curInfo.laneNum }}</p>
          <p>用户个数：{{ curInfo.userNum }}</p>
          <!-- <p>视角高：{{ (curInfo.height / 1000).toFixed(2) }} km</p>
          <p>视角位置：({{ curInfo.longitude.toFixed(1) }}°, {{ curInfo.latitude.toFixed(1) }}°)</p> -->
          <p>开启波束个数：{{ curInfo.openNum }}</p>
          <p>被覆盖用户个数：{{ curInfo.coveredNum }}</p>
        </q-card-section>
      </q-card>
      <q-card dark>
        <q-card-section class="bg-grey-9">
          <div class="text-h6">波束显示</div>
        </q-card-section>
        <q-card-section>
          <q-file
            dark
            filled
            v-model="controls.file"
            label="卫星数据文件"
            accept=".czml"
            @update:model-value="onFileUpload"
          >
            <template v-slot:prepend>
              <q-icon name="cloud_upload" />
            </template>
          </q-file>
          <q-item>
            <q-item-section avatar>
              <q-icon color="deep-orange" name="brightness_medium" />
            </q-item-section>
            <q-item-section>
              <q-slider
                dark
                v-model="controls.beamDisplay"
                color="deep-orange"
                markers
                snap
                class="beam-slider"
                :marker-labels="v => BeamDisplayLevel[v].toString()"
                :min="0"
                :max="2"
                @change="onBeamDisplayChanged"
              />
            </q-item-section>
          </q-item>
        </q-card-section>
      </q-card>
    </div>
    <div class="right"></div>
  </div>
</template>

<script setup lang="ts">
import modelUrl from "@/assets/gltf-models/weixin_fixed.gltf?url";
import imageUrl from "@/assets/img/终端.png?url";
import { Dataset } from "@/simulation/dataset";
import { BeamDisplayLevel, SimulatorControl } from "@/simulation/simulator-control";
import { useVueCesium } from "vue-cesium";
import type { VcReadyObject } from "vue-cesium/es/utils/types";
import { registerEvent } from "./interact";
import { Grid } from "@/simulation/grid";

const $vc = useVueCesium();
const viewer = $vc.viewer;
console.log("vc", viewer);
const $q = useQuasar();
console.log("useQuasar", $q);

const heatmap = (inject("heatmap") as any).value;
console.log("heatmap", heatmap.setData, heatmap.setScope);

const initialized = ref(false);

const controls = reactive({
  height: 10000,
  longitude: 120,
  latitude: 32,
  heightFocused: false,
  longitudeFocused: false,
  latitudeFocused: false,
  beamDisplay: BeamDisplayLevel.None,
  file: null,
});

const curInfo = reactive({
  openNum: 0,
  coveredNum: 0,
  longitude: 0,
  latitude: 0,
  height: 0,
  satelliteNum: 0,
  laneNum: 0,
  userNum: 0,
});

let ctrl: SimulatorControl = new SimulatorControl(viewer, {
  circleColor: Cesium.Color.WHITE,
  terminalImageUrl: imageUrl,
});

$vc.creatingPromise.then(async (readyObj: VcReadyObject) => {
  console.log("Init!");
  // 然后要注册事件
  registerEvent(viewer);
  viewer.clock.shouldAnimate = true;
  // 注册监听事件，在postRenderListener回调函数中添加
  viewer.clock.onTick.addEventListener(() => {
    const position = viewer.camera.positionCartographic;
    if (!controls.longitudeFocused) controls.longitude = Cesium.Math.toDegrees(position.longitude);
    if (!controls.latitudeFocused) controls.latitude = Cesium.Math.toDegrees(position.latitude);
    if (!controls.heightFocused) controls.height = position.height / 1000;

    if (!ctrl.valid) return;

    ctrl.sim.update(viewer.clock.currentTime);
    ctrl.sim.closeBeam();
    if (controls.beamDisplay != BeamDisplayLevel.None) {
      ctrl.showBeams(controls.beamDisplay);
    }
    Object.assign(curInfo, ctrl.getCurrentInfo());
  });
  initialized.value = true;
});

const loadAndRun = async (czmlStr: string) => {
  if (ctrl.valid) {
    $q.notify({ type: "info", message: "加载新数据集" });
  }
  const dataset = new Dataset(czmlStr, {
    satelliteNum: 1,
    userNum: 20,
    showLabel: false,
    modelUrl: modelUrl,
  });
  await ctrl.load(await dataset.load());
  $q.notify({ type: "info", message: "加载完成！" });
};

const onCameraPositionChanged = () => {
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(
      controls.longitude,
      controls.latitude,
      controls.height * 1000
    ),
  });
};

const onBeamDisplayChanged = (val: BeamDisplayLevel) => {
  if (ctrl && val === BeamDisplayLevel.None) ctrl.hideBeams();
};

const onFileUpload = async (file: File | null) => {
  if (!file) return;
  await loadAndRun(await file.text());
};
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
  * {
    pointer-events: all;
  }
  .left {
    float: left;

    .info-card {
      width: 250px;
      // background-color: ;
    }
  }
  .right {
    float: right;
  }
  .q-card__section--vert {
    padding: 8px;
  }
  .text-h6 {
    font-size: 1rem;
  }
}
</style>
