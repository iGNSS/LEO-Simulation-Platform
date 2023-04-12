<template>
  <vc-primitive :appearance="appearance" :model-matrix="modelMatrix">
    <vc-geometry-instance :attributes="attributes" :model-matrix="modelMatrix2">
      <vc-geometry-circle ref="geometryRef" :center="[center.x, center.y]" :radius="1000000" />
    </vc-geometry-instance>
  </vc-primitive>
  <div style="width: 50%; margin-left: 50vh"> 
     <q-slider v-model="hpr.h" :min="0" :max="360" @change="onChanged" />
  <q-slider v-model="hpr.p" :min="0" :max="360" @change="onChanged" />
  <q-slider v-model="hpr.r" :min="0" :max="360" @change="onChanged" />
  <q-slider v-model="center.x" :min="0" :max="360" />
  <q-slider v-model="center.y" :min="-90" :max="90" />
  </div>

</template>

<script setup lang="ts">
import { useVueCesium } from "vue-cesium";
import { VcPrimitive } from "vue-cesium";
import { VcGeometryInstance, VcGeometryCircle } from "vue-cesium";

const instance = getCurrentInstance();
const geometryRef = ref(null);
const geometryOutlineRef = ref(null);
const appearance = ref(null);
const attributes = ref(null);
// const modelMatrix = ref(null);
const attributesOutline = ref(null);
const outline = ref(true);
const dimensions = { x: 400000.0, y: 300000.0, z: 500000.0 };

const modelMatrix = ref(null);
const modelMatrix2 = ref(null);

const rot = ref(0);
const hpr = reactive({ h: 0, p: 0, r: 0 });
const center = reactive({ x: 0, y: 0 });

const $vc = useVueCesium();


const onChanged = () => {
  const x = Cesium. Cartesian3.fromDegrees(0, 0);
  const _hpr = Cesium.HeadingPitchRoll.fromDegrees(hpr.h, hpr.p, hpr.r);
  const m = Cesium.Matrix3.fromHeadingPitchRoll(_hpr);
  // modelMatrix.value = Cesium.Matrix4.fromRotationTranslation(m, x);
  modelMatrix.value = Cesium.Matrix4.fromRotation(m);
};

$vc.creatingPromise.then(({ Cesium, viewer }) => {
  const {
    ColorGeometryInstanceAttribute,
    PerInstanceColorAppearance,
    Matrix4,
    Cartesian3,
    Transforms,
  } = Cesium;
  attributes.value = {
    color: ColorGeometryInstanceAttribute.fromColor(Cesium.Color.AQUAMARINE.withAlpha(0.5)),
  };
  appearance.value = new PerInstanceColorAppearance({
    flat: true,
  });
  const x = Cartesian3.fromDegrees(0, 0);
  const xx = Matrix4.fromTranslation(x);
  //
  modelMatrix.value = Matrix4.IDENTITY;
  modelMatrix2.value = Matrix4.IDENTITY;
  // modelMatrix2.value = Matrix4.fromTranslation(Cartesian3.fromDegrees(180, 0));
  onChanged();
  // modelMatrix2.value = Matrix4.fromTranslation(Cartesian3.fromDegrees(180, 0));
  // modelMatrix.value = Matrix4.IDENTITY;
  // modelMatrix.value = Matrix4.IDENTITY;
});

</script>

<style lang="scss"></style>
