import { difference, longitudeDifference, toRadians } from "@/utils/cesium-math";
import { SimulatorControl } from "./simulator-control";
import { Satellite } from "./satellite";
import { User } from "./user";
import { Simulatable } from "./simulatable";

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
const BW = toRadians(22); //波束角
const R_e = 6371000;

/**
 * The status of beam.
 */
export enum BeamStatus {
  Standby,
  Open,
  Closed,
}

export class Beam extends Simulatable {
  public static readonly pointNum: int = 292;

  public readonly satellite: Satellite;
  public readonly entity: Cesium.Entity; // WaveEntity

  public readonly index: int;

  /** Whether the beam is covering any user */
  public cover: boolean[] = [];
  /** Working status of the beam. */
  public status: BeamStatus = BeamStatus.Closed;

  public currentPosition: Cesium.Cartesian3 = new Cesium.Cartesian3();
  public currentPositionCarto: Cesium.Cartographic = new Cesium.Cartographic();

  constructor(satellite: Satellite, index: int, parent: Cesium.Entity, ctrl: SimulatorControl) {
    super(ctrl);
    this.satellite = satellite;
    this.index = index;
    this.entity = this.createBeamEntity(parent);
    this.cover = Array(this.sim.users.length).fill(false);
  }

  //创建波束
  private createBeamEntity(parent: Cesium.Entity) {
    const waveEntity = this.ctrl.viewer.entities.add({
      id: `${parent.id} beam ${this.index}`,
      ellipse: {
        semiMajorAxis: (782368.72 / Math.cos(El[this.index])) * Math.tan(BW / 2),
        semiMinorAxis: (782368.72 / Math.cos(El[this.index])) * Math.tan(BW / 2),
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        outline: true,
        fill: true,
        numberOfVerticalLines: 0,
        material: this.ctrl.config.circleColor.withAlpha(0.5),
        outlineColor: this.ctrl.config.circleColor.withAlpha(0.5),
        outlineWidth: 100,
      },
    });
    waveEntity.show = false;
    waveEntity.position = this.initSatellitePosition(parent, El[this.index], Az[this.index]);
    return waveEntity;
  }

  //星下点坐标
  private initSatellitePosition(
    parent: Cesium.Entity,
    El: number,
    Az: number
  ): Cesium.SampledPositionProperty {
    const positionBeam = new Cesium.SampledPositionProperty();
    //let m = new Cesium.Matrix4();
    //Cesium.Matrix4.setTranslation(Cesium.Matrix4.IDENTITY, new Cesium.Cartesian3(1, 1, 1), m)//构造平移矩阵
    for (let i = 0; i < Beam.pointNum; i++) {
      const time = Cesium.JulianDate.addSeconds(
        this.ctrl.viewer.clock.startTime,
        300 * i,
        new Cesium.JulianDate()
      );

      const position = parent.position?.getValue(time);
      if (!position) continue;

      const cartographic = this.ctrl.ellipsoid.cartesianToCartographic(position);
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
    positionBeam.setInterpolationOptions({
      interpolationDegree: 5,
      interpolationAlgorithm: Cesium.LagrangePolynomialApproximation,
    }); //设定位置的插值算法
    return positionBeam;
  }

  public update(time: Cesium.JulianDate) {
    this.currentPosition = this.entity.position!.getValue(time)!;
    this.currentPositionCarto = Cesium.Cartographic.fromCartesian(this.currentPosition);
    for (let k = 0; k < this.sim.users.length; k++) {
      const user = this.sim.users[k];
      this.cover[k] = this.nearUser(user) && this.getValue(user).isCovered;
    }
  }

  private nearUser(user: User): boolean {
    const positionS = this.satellite.currentPositionCarto;
    const positionU = user.currentPositionCarto;
    return Math.abs(longitudeDifference(positionS, positionU)) <= 40;
  }

  //波束用户夹角及覆盖情况
  private getValue(user: User) {
    const positionS = this.satellite.currentPosition;
    const positionU = user.currentPosition;
    const positionB = this.currentPosition;

    const vectorUS = difference(positionU, positionS); // 用户坐标和卫星之间的向量
    const vectorBS = difference(positionB, positionS);

    const angleBU = Cesium.Cartesian3.angleBetween(vectorUS, vectorBS); // 波束和用户之间的夹角
    const isCovered =
      Cesium.Cartesian3.distance(positionS, positionU) < 2400000 && angleBU < BW / 2;

    return {
      angle: angleBU,
      isCovered,
    };
  }

  public coversUser(userIndex: int): boolean {
    return this.status === BeamStatus.Open && this.cover[userIndex];
  }

  public updateDisplay(covered: boolean): void {
    this.entity.show = covered;
    if (!covered) {
      return;
    }
    const ellipse = this.entity.ellipse!;
    switch (this.status) {
      case BeamStatus.Open:
        ellipse.material = Cesium.Color.RED.withAlpha(0.3);
        break;
      case BeamStatus.Standby:
        ellipse.material = Cesium.Color.GREEN.withAlpha(0.3);
        break;
      case BeamStatus.Closed:
        ellipse.material = Cesium.Color.WHITE.withAlpha(0.3);
        break;
    }
  }
}
