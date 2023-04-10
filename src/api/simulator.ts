import { createArray2DEmpty, createArray2DFilled } from "@/utils/arrays";
import modelUrl from "@/assets/gltf-models/weixin_fixed.gltf?url";
import imageUrl from "@/assets/img/终端.png?url";

const toRadians = (x: number) => (x * Math.PI) / 180;

/**
 * 波束仰角
 */
const El = [
  11, 29.1, 29.1, 22, 47.95, 44, 47.95, 39.66, 39.66, 61.91, 61.25, 61.25, 66.91, 58.21, 55.0,
  58.21,
].map(toRadians);

/**
 * 波束方位角
 */
const Az = [
  120, 100.89, 139.11, -180, 96.59, 120, 143.41, 166.1, -42.62, 80, 15.94, -15.94, -80, -90, -90,
  -90,
].map(toRadians);

for (let j = 16; j < 48; j++) {
  El[j] = El[j - 16];
  Az[j] = Az[j - 16] + toRadians(120);
}

const pointNum = 292;
//const bearing = 60;
const BW = toRadians(22); //波束角
const R_e = 6371000;
// const circleColor = Cesium.Color.WHITE; //RED  贴地光圈颜色

const isShowLabel = false; //是否显示标签

enum BeamStatus {
  Standby,
  Open,
  Closed,
}

export class Simulator {
  public readonly laneNum: int; //卫星轨道数
  public readonly satelliteNum: int; //每条轨道的卫星个数
  public readonly userNum: int; //用户个数
  public readonly beamNum: int;
  public readonly laneSatelliteNum: int;
  public readonly laneSatelliteBeamNum: int;
  public readonly beamPosition: Cesium.PositionProperty[][];
  public readonly beamShow: any[][];
  public readonly userPosition: Cesium.Cartesian3[];
  public readonly satellitePosition: Cesium.PositionProperty[];
  public readonly state: boolean[][];
  public readonly status: BeamStatus[];
  public readonly near: boolean[][];
  public readonly angle: number[][];

  constructor(laneNum: int, satelliteNum: int, userNum: int, beamNum: int) {
    this.laneNum = laneNum;
    this.satelliteNum = satelliteNum;
    this.userNum = userNum;
    this.beamNum = beamNum;
    this.laneSatelliteNum = laneNum * satelliteNum;
    this.laneSatelliteBeamNum = laneNum * satelliteNum * beamNum;

    //光波集合
    this.beamPosition = createArray2DEmpty(laneNum * satelliteNum);
    this.beamShow = createArray2DEmpty(laneNum * satelliteNum);

    this.state = createArray2DFilled(laneNum * satelliteNum * beamNum, userNum, false);
    this.status = Array(laneNum * satelliteNum * beamNum).fill(BeamStatus.Open);

    this.near = createArray2DFilled(laneNum * satelliteNum, userNum, false);
    this.angle = createArray2DEmpty(laneNum * satelliteNum * beamNum);

    this.userPosition = [];
    this.satellitePosition = [];
  }

  //更新卫星状态矩阵
  public updateState(currentTime: Cesium.JulianDate) {
    for (let i = 0; i < this.laneNum * this.satelliteNum; i++) {
      for (let k = 0; k < this.userNum; k++) {
        for (let j = 0; j < this.beamNum; j++) {
          this.state[i * this.beamNum + j][k] =
            this.near[i][k] && this.getValue(i, k, j, currentTime).isCovered;
        }
      }
    }
  }

  //波束用户夹角及覆盖情况
  private getValue(Satellite_N: int, User_N: int, Beam_N: int, currentTime: Cesium.JulianDate) {
    // if (!viewer.entities) return;
    const positionS = this.satellitePosition[Satellite_N].getValue(currentTime)!;
    const positionU = this.userPosition[User_N];
    // 用户坐标和卫星之间的向量
    const vectorUS = Cesium.Cartesian3.subtract(positionU, positionS, new Cesium.Cartesian3());
    const positionB = this.beamPosition[Satellite_N][Beam_N].getValue(currentTime)!;
    const vectorBS = Cesium.Cartesian3.subtract(positionB, positionS, new Cesium.Cartesian3());

    // 波束和用户之间的夹角
    const angleBU = Cesium.Cartesian3.angleBetween(vectorUS, vectorBS);

    const distance = Cesium.Cartesian3.distance(positionS, positionU);
    const isCovered = distance < 2400000 && angleBU < BW / 2;

    return {
      angle: angleBU,
      isCovered,
    };
  }

  //计算重叠函数
  public count(n: int) {
    let D = 0,
      N = 0;

    for (let k = 0; k < this.userNum; k++) {
      if (this.state[n][k]) {
        D++;
        for (let m = 0; m < this.laneNum * this.satelliteNum * this.beamNum; m++) {
          N += this.state[m][k] ? 1 : 0;
        }
      }
    }

    return N / D;
  }

  //找出所有需要覆盖用户的下标集合
  coveredUser() {
    const coveredUsers = [];
    for (let k = 0; k < this.userNum; k++) {
      for (let m = 0; m < this.laneSatelliteBeamNum; m++) {
        if (this.state[m][k]) {
          coveredUsers.push(k);
          break;
        }
      }
    }
    return coveredUsers;
  }

  //检测是否所有用户被覆盖
  isWorking() {
    const covereduserindex = this.coveredUser();
    let flag = true;
    for (const idx of covereduserindex) {
      let b = false;
      for (let m = 0; m < this.laneNum * this.satelliteNum * this.beamNum; m++) {
        if (this.state[m][idx] && this.status[m] === BeamStatus.Open) {
          // TODO state2
          b = true;
          break;
        }
      }
      if (!b) {
        flag = false;
        break;
      }
    }
    return flag;
  }

  closeBeam() {
    //找出所有待命波束下标
    const standbyBeams = [];
    for (let i = 0; i < this.laneNum * this.satelliteNum * this.beamNum; i++) {
      if (Number.isFinite(this.count(i))) {
        standbyBeams.push(i);
        this.status[i] = BeamStatus.Open;
      } else {
        this.status[i] = BeamStatus.Closed;
      }
    }

    const v = standbyBeams.map(i => this.count(i)); //重复程度

    while (v.length > 0) {
      const t = Math.max(...v);
      const index = v.indexOf(t);
      const beamindex = standbyBeams[index];
      this.status[beamindex] = BeamStatus.Standby;
      if (!this.isWorking()) {
        this.status[beamindex] = BeamStatus.Open;
      }
      v.splice(index, 1);
      standbyBeams.splice(index, 1);
    }
    return standbyBeams;
  }
}

export interface DisplayConfig {
  circleColor: Cesium.Color;
}

export enum BeamDisplayLevel {
  None,
  Some,
  All,
}

export class SimulatorControl {
  public readonly viewer: Cesium.Viewer;
  public dataSource: Cesium.DataSource | null;
  public readonly sim: Simulator;
  private readonly billboards: Cesium.BillboardCollection;
  private beamEntities: Cesium.Entity[] = [];
  private waveEntities: Cesium.Entity[] = [];
  private config: DisplayConfig;

  constructor(viewer: Cesium.Viewer, config: DisplayConfig) {
    this.config = config;
    this.viewer = viewer;
    this.dataSource = null;
    this.billboards = viewer.scene.primitives.add(new Cesium.BillboardCollection());
    this.sim = new Simulator(6, 1, 10, 48);
  }

  public async load(text: string) {
    const czml = JSON.parse(text);
    const timeInfo = czml[0].clock;
    const currentTime = timeInfo.currentTime;
    const times = timeInfo.interval.split("/");
    this.viewer.clock.startTime = Cesium.JulianDate.fromIso8601(times[0]);
    this.viewer.clock.stopTime = Cesium.JulianDate.fromIso8601(times[1]);
    //修改起始时间
    const offsetStartTime = Cesium.JulianDate.addSeconds(
      Cesium.JulianDate.fromIso8601(currentTime),
      700 * this.sim.satelliteNum,
      new Cesium.JulianDate()
    );
    // viewer.clock.currentTime = Cesium.JulianDate.fromIso8601(offsetStartTime.toLocaleString());
    timeInfo.currentTime = offsetStartTime.toLocaleString();
    //更新时间
    const step = 20 / this.sim.satelliteNum; // 总个数点 平均分配给每个卫星

    // 开始复制
    let newCopys = [czml[0]];
    for (let i = 1; i < czml.length; i++) {
      const item = czml[i];
      for (let j = 0; j < this.sim.satelliteNum; j++) {
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
        copy.label.show = isShowLabel;
        //添加模型
        copy.model = {
          gltf: modelUrl,
          scale: 1.0,
          minimumPixelSize: 32,
          maximumPixelSize: 64,
        };
        copy.id = `${copy.id}  ${j + 1}`;
        copy.label.text = `${copy.label.text} ${j + 1}`;
        newCopys.push(copy);
      }
    }

    await this.loadCZML(newCopys);
  }

  private async loadCZML(czml: any) {
    const dataSource = await this.viewer.dataSources.add(Cesium.CzmlDataSource.load(czml));
    if (dataSource?.entities) {
      this.dataSource = dataSource;
      for (const satellite of dataSource.entities.values) {
        this.sim.satellitePosition.push(satellite.position!);
        satellite.name = "satellite";
        this.createWaveEntity(satellite);
      }
    }
  }

  // 创建 光波Entity
  private createWaveEntity(entity: Cesium.Entity) {
    this.createCircle(entity);
    this.createBeamEntities(entity);
  }

  //创建圆面
  private createCircle(entity: Cesium.Entity): void {
    const property = this.setPosition(entity);
    const circleEntity = this.viewer.entities.add({
      ellipse: {
        semiMajorAxis: 1800000 * 1.3,
        semiMinorAxis: 1800000 * 1.3,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        outline: true,
        fill: false,
        numberOfVerticalLines: 0,
        material: Cesium.Color.RED,
        outlineColor: this.config.circleColor.withAlpha(0.2),
        outlineWidth: 100,
      },
    });
    circleEntity.show = false;
    circleEntity.position = property;
    this.waveEntities.push(circleEntity);
  }

  //卫星位置记录
  private setPosition(entity: Cesium.Entity): Cesium.SampledPositionProperty {
    const property = new Cesium.SampledPositionProperty();
    for (let i = 0; i < pointNum; i++) {
      const time = Cesium.JulianDate.addSeconds(
        this.viewer.clock.startTime,
        300 * i,
        new Cesium.JulianDate()
      );
      const position = entity.position?.getValue(time);
      if (position) {
        const cartographic = this.viewer.scene.globe.ellipsoid.cartesianToCartographic(position);
        const lat = Cesium.Math.toDegrees(cartographic.latitude),
          lng = Cesium.Math.toDegrees(cartographic.longitude),
          hei = cartographic.height / 1.9;
        property.addSample(time, Cesium.Cartesian3.fromDegrees(lng, lat, hei));
      }
    }
    return property;
  }

  //创建波束
  private createBeamEntities(entity: Cesium.Entity) {
    for (let j = 0; j < this.sim.beamNum; j++) {
      const p = this.setUnderSatellite(entity, El[j], Az[j]);
      const waveEntity = this.viewer.entities.add({
        id: `${entity.id} beam ${j}`,
        ellipse: {
          semiMajorAxis: (782368.72 / Math.cos(El[j])) * Math.tan(BW / 2),
          semiMinorAxis: (782368.72 / Math.cos(El[j])) * Math.tan(BW / 2),
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          outline: true,
          fill: true,
          numberOfVerticalLines: 0,
          material: this.config.circleColor.withAlpha(1.5),
          outlineColor: this.config.circleColor.withAlpha(1.5),
          outlineWidth: 100,
        },
      });
      waveEntity.show = false;
      p.setInterpolationOptions({
        interpolationDegree: 5,
        interpolationAlgorithm: Cesium.LagrangePolynomialApproximation,
      }); //设定位置的插值算法
      waveEntity.position = p;
      this.beamEntities.push(waveEntity);
      const index = this.dataSource!.entities.values.indexOf(entity);
      this.sim.beamPosition[index].push(waveEntity.position);
      this.sim.beamShow[index].push(waveEntity.ellipse);
    }
  }

  //星下点坐标
  private setUnderSatellite(
    entity: Cesium.Entity,
    El: number,
    Az: number
  ): Cesium.SampledPositionProperty {
    const positionBeam = new Cesium.SampledPositionProperty();
    //let m = new Cesium.Matrix4();
    //Cesium.Matrix4.setTranslation(Cesium.Matrix4.IDENTITY, new Cesium.Cartesian3(1, 1, 1), m)//构造平移矩阵
    for (let i = 0; i < pointNum; i++) {
      const time = Cesium.JulianDate.addSeconds(
        this.viewer.clock.startTime,
        300 * i,
        new Cesium.JulianDate()
      );

      const position = entity.position?.getValue(time);

      if (position) {
        const cartographic = this.viewer.scene.globe.ellipsoid.cartesianToCartographic(position);
        const lat = Cesium.Math.toDegrees(cartographic.latitude),
          lng = Cesium.Math.toDegrees(cartographic.longitude),
          hei = cartographic.height;
        const heading = Az;
        const pitch = 0;
        const roll = El;
        const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);

        const R = (hei / 2) * Math.tan(roll);
        const L = R_e * 2 * Math.asin(R / (2 * R_e));
        const c = L / R_e;
        const a = Math.acos(
          Math.sin(cartographic.latitude) * Math.cos(c) +
            Math.cos(cartographic.latitude) * Math.sin(c) * Math.cos(heading + 0.0876)
        );
        const C = Math.asin((Math.sin(c) * Math.sin(heading + 0.0876)) / Math.sin(a));
        const newPosition_PB = Cesium.Cartesian3.fromRadians(
          cartographic.longitude + C,
          Math.PI / 2 - a,
          0
        );
        positionBeam.addSample(time, newPosition_PB);
      }
    }
    return positionBeam;
  }

  public addUsers(): void {
    for (let i = 0; i < this.sim.userNum; i++) {
      const position = Cesium.Cartesian3.fromDegrees(
        Math.random() * 50 + 70,
        Math.random() * 30 + 30,
        0
      );

      this.billboards.add({
        image: imageUrl,
        position: position,
        scale: 0.05,
      });
      this.sim.userPosition.push(position);
    }
  }

  //显示波束
  showBeam(level: BeamDisplayLevel): void {
    console.log("show", level);
    this.beamEntities.forEach(item => (item.show = true)); //控制显隐藏
    for (let i = 0; i < this.sim.laneSatelliteNum; i++) {
      let covered = level === BeamDisplayLevel.All;
      for (let j = 0; j < this.sim.beamNum; j++) {
        const ellipse = this.sim.beamShow[i][j];
        switch (this.sim.status[i * this.sim.beamNum + j]) {
          case BeamStatus.Open:
            ellipse.material = Cesium.Color.RED.withAlpha(0.3);
            covered = true;
            break;
          case BeamStatus.Standby:
            ellipse.material = Cesium.Color.GREEN.withAlpha(0.3);
            covered = true;
            break;
          case BeamStatus.Closed:
            ellipse.material = Cesium.Color.WHITE.withAlpha(0.3);
            break;
        }
      }
      this.sim.beamShow[i].forEach(b => (b.show = covered));
    }
  }

  hideBeam() {
    this.beamEntities.forEach(item => (item.show = false));
    this.sim.beamShow.forEach(t => t.forEach(t => (t.show = false)));
  }

  //更新相邻信息
  refreshNear() {
    if (!this.viewer.entities) return;
    const time = this.viewer.clock.currentTime;
    for (let i = 0; i < this.sim.laneSatelliteNum; i++) {
      for (let k = 0; k < this.sim.userNum; k++) {
        const positionS = Cesium.Cartographic.fromCartesian(
          this.sim.satellitePosition[i].getValue(time)!
        );
        const positionU = Cesium.Cartographic.fromCartesian(this.sim.userPosition[k]);
        if (
          Math.abs(
            Cesium.Math.toDegrees(positionS.longitude) - Cesium.Math.toDegrees(positionU.longitude)
          ) > 40
        ) {
          this.sim.near[i][k] = false;
        } else {
          this.sim.near[i][k] = true;
        }
      }
    }
  }

  //显示卫星状态矩阵
  showState() {
    const content = [];
    for (let i = 0; i < this.sim.laneNum * this.sim.satelliteNum * this.sim.beamNum; i++) {
      //显示卫星id
      if ((i / this.sim.beamNum) % 1 === 0) {
        content.push(`${this.viewer.entities.values[i / this.sim.beamNum].id}`);
      }
      content.push(this.sim.state[i].toString());
    }
    return content;
  }

  showData() {
    let openNum = 0;
    //var satelliteNum = 11;
    for (let i = 0; i < this.sim.laneSatelliteBeamNum; i++) {
      if (this.sim.status[i] === BeamStatus.Open) {
        openNum++;
      }
    }

    const coveredNum = this.sim.coveredUser().length;
    const position = this.viewer.camera.positionCartographic;
    return {
      satelliteNum: this.sim.satelliteNum,
      laneNum: this.sim.laneNum,
      userNum: this.sim.userNum,
      longitude: Cesium.Math.toDegrees(position.longitude),
      latitude: Cesium.Math.toDegrees(position.latitude),
      height: position.height,
      openNum,
      coveredNum,
    };
  }
}
