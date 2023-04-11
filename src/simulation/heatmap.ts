import type { HeatmapConfiguration } from "vue-cesium/es/utils/types";

export class HeatMap{
    public readonly scope : Cesium.Rectangle;
    public readonly heatMap : HeatmapConfiguration;
    public readonly radius: int;
    public readonly width: int;
    public readonly height: int;
    constructor(scope : Cesium.Rectangle, radius: int){
        this.scope = scope;
        this.width = 0;
        this.height = 0;
        this.radius = radius;

    // 创建元素
    var heatDoc = document.createElement("div");
    heatDoc.setAttribute(
      "style",
      "width:1000px;height:1000px;margin: 0px;display: none;"
    );
    document.body.appendChild(heatDoc);
    // 创建热力图对象
    this.width = (scope.east-scope.west) / Cesium.Math.PI * 1000
    this.height = (scope.north-scope.south) / Cesium.Math.PI * 1000
    this.heatMap = h337.create({
      container: heatDoc,
      radius: radius,
      maxOpacity: 0.5,
      minOpacity: 0,
      blur: 0.75,
      width: this.width,
      height: this.height,
      gradient: {
        0.9: "red",
        0.8: "orange",
        0.7: "yellow",
        0.5: "blue",
        0.3: "green",
      },
    });
    }

    public setData(max, datas){
      heatMap.setData({max: max, data: datas});
    }

    public showHeatMap(viewer) {
    viewer.entities.add({
      name: "Rotating rectangle with rotating texture coordinate",
      show: true,
      rectangle: {
        coordinates: scope,
        material: heatMap._renderer.canvas, // 核心语句，填充热力图
      },
    });
  }