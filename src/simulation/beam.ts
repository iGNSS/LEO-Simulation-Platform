import { difference, groundMatrix, longitudeDifference } from "@/utils/cesium-math";
import { SimulatorControl } from "./simulator-control";
import { Satellite } from "./satellite";
import { User } from "./user";
import { Simulatable } from "./simulatable";
import { Az, BW, El } from "./beam-constants";

const R_e = 6371000;

/**
 * The status of beam.
 */
export enum BeamStatus {
  Closed,
  Standby,
  Open,
}

export class Beam extends Simulatable {
  public static readonly pointNum: int = 292;

  public readonly satellite: Satellite;
  public readonly primitive: Cesium.Primitive;
  public readonly index: int;

  /** Whether the beam is covering any user */
  public cover: boolean[] = [];
  /** Working status of the beam. */
  public status: BeamStatus = BeamStatus.Closed;
  private _lastStatus: BeamStatus | undefined;

  public readonly position: Cesium.PositionProperty | undefined = undefined;
  public currentPosition: Cesium.Cartesian3 = new Cesium.Cartesian3();
  public currentPositionCarto: Cesium.Cartographic = new Cesium.Cartographic();

  constructor(satellite: Satellite, index: int, parent: Cesium.Entity, ctrl: SimulatorControl) {
    super(ctrl);
    this.satellite = satellite;
    this.index = index;
    this.position = this.initSatellitePosition(parent, El[index], Az[index]);
    this.primitive = this.createPrimitive();
    this.cover = Array(this.sim.users.length).fill(false);
  }

  private createPrimitive(): Cesium.Primitive {
    return new Cesium.Primitive({
      geometryInstances: this.ctrl.factory.beamInstances[this.index],
      appearance: this.ctrl.factory.beamAppearances[BeamStatus.Closed],
    });
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
    this.currentPosition = this.position!.getValue(time)!;
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
    this.primitive.show = covered;
    if (covered) {
      this.primitive.modelMatrix = groundMatrix(this.currentPositionCarto);
      if (this._lastStatus != this.status) {
        this.primitive.appearance = this.ctrl.factory.beamAppearances[this.status];
      }
    }
    this._lastStatus = this.status;
  }
}
