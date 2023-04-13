export const toRadians = (x: number) => (x * Math.PI) / 180;

export function cartDiff(left: Cesium.Cartesian3, right: Cesium.Cartesian3): Cesium.Cartesian3 {
  return Cesium.Cartesian3.subtract(left, right, new Cesium.Cartesian3());
}

/**
 * TODO!
 * Calculate the absolute longitude differences of two longitudes in radians.
 * @param left
 * @param right
 * @returns
 */
export function lngDiff(left: number, right: number): number {
  return Math.min(left - right);
}

export function cartoLngDiffDeg(left: Cesium.Cartographic, right: Cesium.Cartographic): number {
  return Cesium.Math.toDegrees(left.longitude) - Cesium.Math.toDegrees(right.longitude);
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