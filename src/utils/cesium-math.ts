import { R_e } from "@/simulation/constants";

const { abs, sin, cos, asin, tan } = Math;

export const toRadians = (x: number) => (x * Math.PI) / 180;

export function cartDiff(left: Cesium.Cartesian3, right: Cesium.Cartesian3): Cesium.Cartesian3 {
  return Cesium.Cartesian3.subtract(left, right, new Cesium.Cartesian3());
}

/**
 * Calculate the absolute longitude differences of two longitudes in radians.
 * @param left
 * @param right
 * @returns
 */
export function lngDiff(left: number, right: number): number {
  const result = abs(left - right);
  return result < Math.PI ? result : Math.PI * 2 - result;
}

/**
 * Calculate the absolute longitude differences of two latitudes in radians.
 * @param left
 * @param right
 * @returns
 */
export function latDiff(left: number, right: number): number {
  const result = abs(left - right);
  return result;
}

export function isNear(
  left: Cesium.Cartographic,
  right: Cesium.Cartographic,
  rad: number
): boolean {
  return (
    lngDiff(left.longitude, right.longitude) < rad && latDiff(left.latitude, right.latitude) < rad
  );
}

export function deg2Coord(radians: number): number {
  return (radians / 180) * 1000;
}

export function roundTo(x: number, n: number): number {
  const k = Math.pow(10, n);
  return Math.round(x * k) / k;
}

export function groundMatrix(
  position: Cesium.Cartographic,
  result: Cesium.Matrix4 | undefined = undefined
): Cesium.Matrix4 {
  return Cesium.Matrix4.fromRotation(
    Cesium.Matrix3.fromHeadingPitchRoll(
      new Cesium.HeadingPitchRoll(-position.longitude, position.latitude, 0)
    ),
    result
  );
}

/**
 * 计算星下点坐标
 * @param carto 卫星的cartographic
 * @param heading Al
 * @param roll Ez
 * @returns 波数坐标
 */
export function positionUnderSatellite(carto: Cesium.Cartographic, heading: number, roll: number) {
  const c = 2 * asin((carto.height * tan(roll)) / (4 * R_e));
  const lat_b = asin(sin(carto.latitude) * cos(c) + cos(carto.latitude) * sin(c) * cos(heading));
  const lon_b = asin((sin(c) * sin(heading)) / cos(lat_b)) + carto.longitude;
  return Cesium.Cartesian3.fromRadians(lon_b, lat_b, 0);
}
