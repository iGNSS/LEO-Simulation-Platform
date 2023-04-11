export const toRadians = (x: number) => (x * Math.PI) / 180;

export function difference(left: Cesium.Cartesian3, right: Cesium.Cartesian3): Cesium.Cartesian3 {
  return Cesium.Cartesian3.subtract(left, right, new Cesium.Cartesian3());
}

export function longitudeDifference(left: Cesium.Cartographic, right: Cesium.Cartographic): number {
  return Cesium.Math.toDegrees(left.longitude) - Cesium.Math.toDegrees(right.longitude);
}