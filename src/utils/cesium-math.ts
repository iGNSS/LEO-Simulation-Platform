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
  var result = Math.abs(left - right);
  return result < 180 ? result : 360 - result;
}

export function isNear(left: Cesium.Cartographic, right: Cesium.Cartographic, rad: number): boolean {
  return (lngDiff(left.longitude,right.longitude) < rad) && (latDiff(left.latitude,right.latitude) < rad);
}

/**
 * Calculate the absolute longitude differences of two latitudes in radians.
 * @param left
 * @param right
 * @returns
 */
export function latDiff(left: number, right: number): number {
  var result = Math.abs(left - right);
  return result;
}

export function deg2Coord(radians: number): number {
  return (radians / 180) * 1000;
}

export function roundTo(x: number, n: number): number {
  const k = Math.pow(10, n);
  return Math.round(x * k) / k;
}

export function groundMatrix(position: Cesium.Cartographic): Cesium.Matrix4 {
  return Cesium.Matrix4.fromRotation(
    Cesium.Matrix3.fromHeadingPitchRoll(
      new Cesium.HeadingPitchRoll(-position.longitude, position.latitude, 0)
    )
  );
}
