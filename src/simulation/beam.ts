import { cartDiff, groundMatrix, cartoLngDiffDeg, lngDiff } from "@/utils/cesium-math";
import { SimulatorControl } from "./simulator-control";
import { Satellite } from "./satellite";
import { User } from "./user";
import { Simulatable } from "./simulatable";
import { Az, BW, CoverFar, El } from "./beam-constants";
import { R_e } from "./constants";

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
  /** The status of last frame */
  private _lastStatus: BeamStatus | undefined;

  /** The sampled position of this beam. */
  public readonly position: Cesium.PositionProperty | undefined;
  public currentPosition: Cesium.Cartesian3 = new Cesium.Cartesian3();
  public currentPositionCarto: Cesium.Cartographic = new Cesium.Cartographic();

  constructor(satellite: Satellite, index: int, ctrl: SimulatorControl) {
    super(ctrl);
    this.satellite = satellite;
    this.index = index;
    this.position = this.initSatellitePosition();
    this.primitive = this.createPrimitive();
    this.cover = Array(this.sim.users.length).fill(false);
  }

  /**
   * Create the primitive of this beam.
   * @returns The primitive.
   */
  private createPrimitive(): Cesium.Primitive {
    return new Cesium.Primitive({
      geometryInstances: this.ctrl.factory.beamInstances[this.index],
      appearance: this.ctrl.factory.beamAppearances[BeamStatus.Closed],
    });
  }

  /**
   * Initialize the sampled position of this beam.
   * @returns
   */
  private initSatellitePosition(): Cesium.SampledPositionProperty {
    const positionBeam = new Cesium.SampledPositionProperty();
    //let m = new Cesium.Matrix4();
    //Cesium.Matrix4.setTranslation(Cesium.Matrix4.IDENTITY, new Cesium.Cartesian3(1, 1, 1), m)//构造平移矩阵
    for (let i = 0; i < Beam.pointNum; i++) {
      const time = Cesium.JulianDate.addSeconds(
        this.ctrl.viewer.clock.startTime,
        300 * i,
        new Cesium.JulianDate()
      );

      const position = this.satellite.position.getValue(time);
      if (!position) continue;

      const cartographic = this.ctrl.ellipsoid.cartesianToCartographic(position);
      const lat = Cesium.Math.toDegrees(cartographic.latitude),
        lng = Cesium.Math.toDegrees(cartographic.longitude),
        hei = cartographic.height;
      const heading = Az[this.index];
      const pitch = 0;
      const roll = El[this.index];
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

  /**
   * Get whether this beam is near the user.
   * @param user A user.
   * @returns Whether this beam is near the user.
   */
  private nearUser(user: User): boolean {
    const positionS = this.satellite.currentPositionCarto;
    const positionU = user.currentPositionCarto;
    return lngDiff(positionS.longitude, positionU.longitude) <= BW;
  }

  //波束用户夹角及覆盖情况
  /**
   * Get the angle between a user and whether covers the user.
   * @param user A user.
   * @returns `angleBU` and `isCovered`.
   */
  public getValue(user: User) {
    const positionS = this.satellite.currentPosition;
    const positionU = user.currentPosition;
    const positionB = this.currentPosition;

    const vectorUS = cartDiff(positionU, positionS); // 用户坐标和卫星之间的向量
    const vectorBS = cartDiff(positionB, positionS);

    const angleBU = Cesium.Cartesian3.angleBetween(vectorUS, vectorBS); // 波束和用户之间的夹角
    const isCovered =
      Cesium.Cartesian3.distance(positionS, positionU) < CoverFar && angleBU < BW / 2;

    return {
      angle: angleBU,
      isCovered,
    };
  }

  /**
   * Get whether this beam covers a user.
   * @param userIndex The index of a user.
   * @returns The bool value.
   */
  public coversUser(userIndex: int): boolean {
    return this.status === BeamStatus.Open && this.cover[userIndex];
  }

  /**
   * Update primitive status of current frame.
   * @param needShow Whether the beam should show.
   */
  public updateDisplay(needShow: boolean): void {
    if (needShow) {
      this.primitive.modelMatrix = groundMatrix(this.currentPositionCarto);
      if (this._lastStatus != this.status) {
        this.primitive.appearance = this.ctrl.factory.beamAppearances[this.status];
      }
    }
    this._lastStatus = this.status;
  }
}
