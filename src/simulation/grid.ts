import { zip } from "lodash-es";
import { VcHeatMapData } from "vue-cesium/es/utils/types";

export interface GridOptions {}

export class Grid {
  public readonly scope: Cesium.Rectangle;
  public positions: Cesium.Cartographic[] = [];
  public signalStrength: number[] = [];
  public max: number = 0;
  public readonly dlat: number;

  constructor(scope: Cesium.Rectangle, dlat: number) {
    this.scope = scope;
    this.dlat = dlat;
    const delta = Cesium.Math.toRadians(dlat);
    for (let lat = scope.south; lat <= scope.north; lat += delta) {
      for (let lon = scope.west; lon <= scope.east; lon += delta) {
        this.positions.push(Cesium.Cartographic.fromRadians(lon, lat, 0));
      }
    }
  }

  public updateData(ss: number[]) {
    this.signalStrength = ss;
  }

  public get heatmapData(): VcHeatMapData[] {
    return zip(this.positions, this.signalStrength).map(
      ([p, s]): VcHeatMapData => ({
        x: Cesium.Math.toDegrees(p!.longitude),
        y: Cesium.Math.toDegrees(p!.latitude),
        // x: (p!.longitude / Math.PI) * 1000,
        // y: (p!.latitude / Math.PI) * 1000,
        value: Number(s ?? Math.random()),
      })
    );
  }
}
