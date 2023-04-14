import { VcHeatMapData } from "vue-cesium/es/utils/types";

export class Grid {
  private static readonly defaultValue: number = 0;
  public readonly scope: Cesium.Rectangle;
  public readonly step: number;
  public readonly positions: Cesium.Cartographic[] = [];
  public readonly heatmapData: VcHeatMapData[] = [];

  /**
   *
   * @param scope The scope of this grid, in cartographic radians.
   * @param step The step length of grid points, in degrees.
   */
  constructor(scope: Cesium.Rectangle, step: number) {
    this.scope = scope;
    this.step = step;
    const delta = Cesium.Math.toRadians(step);
    for (let lon = scope.west; lon <= scope.east; lon += delta) {
      for (let lat = scope.south; lat <= scope.north; lat += delta) {
        this.positions.push(Cesium.Cartographic.fromRadians(lon, lat, 0));
        this.heatmapData.push({
          x: Cesium.Math.toDegrees(lon),
          y: Cesium.Math.toDegrees(lat),
          value: Grid.defaultValue,
        });
      }
    }
  }

  /**
   * Update heatmap data with a value array.
   * @param ss Array of heatmap value.
   */
  public updateData(ss: number[]) {
    for (let i = 0; i < ss.length; i++) {
      this.heatmapData[i].value = ss[i] == 0 ? 0.01: ss[i];
    }
  }
}
