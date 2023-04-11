export interface DatasetOptions {
  satelliteNum: int;
  userNum: int;
  showLabel: boolean;
  modelUrl: string;
}

export class Dataset {
  private readonly file: File | string;
  public readonly options: DatasetOptions;
  public startTime: Cesium.JulianDate = new Cesium.JulianDate();
  public stopTime: Cesium.JulianDate = new Cesium.JulianDate();
  public czml: any;
  public laneNum: int = 0;
  public readonly users: Cesium.Cartesian3[] = [];

  constructor(file: File | string, options: DatasetOptions) {
    this.file = file;
    this.options = options;
    this.createUsers();
  }

  public async load(): Promise<void> {
    await this.loadText(this.file instanceof File ? await this.file.text() : this.file);
  }

  private async loadText(text: string): Promise<void> {
    const czml: any[] = JSON.parse(text);
    const timeInfo = czml[0].clock;
    const currentTime = timeInfo.currentTime;
    const times = timeInfo.interval.split("/");
    this.startTime = Cesium.JulianDate.fromIso8601(times[0]);
    this.stopTime = Cesium.JulianDate.fromIso8601(times[1]);
    //修改起始时间
    const offsetStartTime = Cesium.JulianDate.addSeconds(
      Cesium.JulianDate.fromIso8601(currentTime),
      700 * this.options.satelliteNum,
      new Cesium.JulianDate()
    );

    timeInfo.currentTime = offsetStartTime.toLocaleString();
    //更新时间
    const step = 20 / this.options.satelliteNum; // 总个数点 平均分配给每个卫星

    // 开始复制
    this.laneNum = czml.length - 1;
    let newCopies = [czml[0]];
    for (const item of czml.slice(1)) {
      for (let j = 0; j < this.options.satelliteNum; j++) {
        let copy = JSON.parse(JSON.stringify(item));
        if (j > 0) {
          //修改 point 的时间
          for (let k = 0; k < copy.position.cartesian.length; k += 4) {
            copy.position.cartesian[k] += 300 * step * j;
          }
        } else {
          // 修改 线的颜色
          //copy.path.material.solidColor.color.rgba = lineColor
        }
        //  移除billboard
        delete copy.billboard;
        // 是否显示标签
        copy.label.show = this.options.showLabel;
        //添加模型
        copy.model = {
          gltf: this.options.modelUrl,
          scale: 1.0,
          minimumPixelSize: 32,
          maximumPixelSize: 64,
        };
        copy.id = `${copy.id} ${j + 1}`;
        copy.label.text = `${copy.label.text} ${j + 1}`;
        newCopies.push(copy);
      }
    }

    this.czml = newCopies;
  }

  private createUsers(): void {
    for (let i = 0; i < this.options.userNum; i++) {
      const position = Cesium.Cartesian3.fromDegrees(
        Math.random() * 50 + 70,
        Math.random() * 30 + 30,
        0
      );
      this.users.push(position);
    }
  }
}
