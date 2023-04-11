import { zip } from "lodash-es";
import { VcHeatMapData } from "vue-cesium/es/utils/types";

export interface GridOptions {}

export class Grid {
  public positions: Cesium.Cartographic[];
  public signalStrength: number[];
  public girdNum: number;
  public max: number;

  constructor(scope: Cesium.Rectangle, inter: number) {
    this.positions = [];
    this.signalStrength = [];
    this.girdNum = 0;
    this.max = 0;
    const Re = 6371;
    const dlat = (360 * inter) / (2 * Math.PI * Re);
    for (
      let lat = Cesium.Math.toDegrees(scope.south);
      lat <= Cesium.Math.toDegrees(scope.north);
      lat += dlat
    ) {
      const dlon = (360 * inter) / (2 * Math.PI * Re * Math.cos(Cesium.Math.toRadians(lat)));
      for (
        var lon = Cesium.Math.toDegrees(scope.west);
        lon <= Cesium.Math.toDegrees(scope.east);
        lon += dlon
      ) {
        this.girdNum++;
        this.positions.push(Cesium.Cartographic.fromDegrees(lon, lat, 0));
      }
    }
  }

  public updateData(ss: number[]) {
    this.signalStrength = ss;
  }

  public toHeatmapData(): VcHeatMapData[] {
    return zip(this.positions, this.signalStrength).map(
      ([p, s]): VcHeatMapData => ({
        x: (p!.longitude / Math.PI) * 1000,
        y: (p!.latitude / Math.PI) * 1000,
        value: s!,
      })
    );
  }
}
