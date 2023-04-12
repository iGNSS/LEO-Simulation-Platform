import { zip } from "lodash-es";
import { VcHeatMapData } from "vue-cesium/es/utils/types";

export interface GridOptions {}

export class Grid {
  public readonly scope: Cesium.Rectangle;
  public positions: Cesium.Cartographic[] = [];
  public signalStrength: number[] = [];
  public girdNum: number = 0;
  public max: number = 0;

  constructor(scope: Cesium.Rectangle, inter: number) {
    this.scope = scope;
    const Re = 6371;
    const dlat = (360 * inter) / (2 * Math.PI * Re);
    for (
      let lat = Cesium.Math.toDegrees(scope.south);
      lat <= Cesium.Math.toDegrees(scope.north);
      lat += dlat
    ) {
      const dlon = dlat / Math.cos(Cesium.Math.toRadians(lat));
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

  public get heatmapData(): VcHeatMapData[] {
    return zip(this.positions, this.signalStrength).map(
      ([p, s]): VcHeatMapData => ({
        x: (p!.longitude / Math.PI) * 1000,
        y: (p!.latitude / Math.PI) * 1000,
        value: 30,
      })
    );
  }
}
