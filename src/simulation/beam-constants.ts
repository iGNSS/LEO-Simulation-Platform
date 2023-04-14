import { toRadians } from "@/utils/cesium-math";

export const BeamsPerSatellite = 48;

/**
 * 波束仰角
 */
export const El = [
  11, 29.1, 29.1, 22, 47.95, 44, 47.95, 39.66, 39.66, 61.91, 61.25, 61.25, 66.91, 58.21, 55.0,
  58.21,
].map(x => toRadians(x) * 1.05);

/**
 * 波束方位角
 */
export const Az = [
  120, 100.89, 139.11, -180, 96.59, 120, 143.41, 166.1, -42.62, 80, 15.94, -15.94, -80, -90, -90,
  -90,
].map(x => toRadians(x) + 0.0876);

for (let j = 16; j < BeamsPerSatellite; j++) {
  El[j] = El[j - 16];
  Az[j] = Az[j - 16] + toRadians(120);
}

/** 波束角 */
export const BW = toRadians(30);

/** 计算 cover 的最远距离 */
export const CoverFar = 2400000;
