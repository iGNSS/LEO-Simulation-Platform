
export interface GridOptions {

}

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
    var dlon;
    var dlat = (360 * inter) / (2 * Math.PI * Re);
    for (
      var lat = Cesium.Math.toDegrees(scope.south);
      lat <= Cesium.Math.toDegrees(scope.north);
      lat += dlat
    ) {
      dlon = (360 * inter) / (2 * Math.PI * Re * Math.cos(Cesium.Math.toRadians(lat)));
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

  updateData(ss: number[]) {
    this.signalStrength = ss;
  }

  toHeatmapData() {
    var heatMapData = [];
    for (var i = 0; i < this.girdNum; i++) {
      var x = this.positions[i].longitude;
      var y = this.positions[i].latitude;
      x = (x / Math.PI) * 1000;
      y = (y / Math.PI) * 1000;
      var ss = this.signalStrength;
      heatMapData.push({ x, y, ss });
    }
    return heatMapData;
  }
}
