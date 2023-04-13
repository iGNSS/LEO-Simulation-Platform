import { BeamDisplayLevel, SimulatorControl } from "@/controllers/simulator-control";
import { groundMatrix } from "@/utils/cesium-math";
import { Beam, BeamStatus } from "./beam";
import { BeamsPerSatellite } from "./beam-constants";
import { Simulatable } from "./simulatable";

export class Satellite extends Simulatable {
  public readonly entity: Cesium.Entity;
  public readonly beams: Beam[] = [];
  public readonly position: Cesium.PositionProperty;
  public readonly rangePrimitive: Cesium.Primitive;
  public readonly beamPrimitives: Cesium.PrimitiveCollection;

  public currentPosition: Cesium.Cartesian3 = new Cesium.Cartesian3();
  public currentPositionCarto: Cesium.Cartographic = new Cesium.Cartographic();

  constructor(entity: Cesium.Entity, ctrl: SimulatorControl) {
    super(ctrl);
    this.position = entity.position!;
    this.entity = entity;
    this.beamPrimitives = new Cesium.PrimitiveCollection({ show: false });
    this.rangePrimitive = this.createRangeCircle();
    this.beams = this.createBeams();
  }

  /**
   * Create the range circle primitive of this satellite.
   * @returns
   */
  private createRangeCircle() {
    const primitive = new Cesium.Primitive({
      geometryInstances: this.ctrl.factory.satelliteRangeInstance,
      appearance: this.ctrl.factory.satelliteRangeAppearance,
    });
    return primitive;
  }

  /**
   * Create beams of this satellite.
   * @returns
   */
  private createBeams(): Beam[] {
    const beams = [];
    for (let j = 0; j < BeamsPerSatellite; j++) {
      beams.push(new Beam(this, j, this.ctrl));
      this.beamPrimitives.add(beams.at(-1)?.primitive);
    }
    return beams;
  }

  public update(time: Cesium.JulianDate): void {
    this.currentPosition = this.position.getValue(time)!;
    this.currentPositionCarto = Cesium.Cartographic.fromCartesian(this.currentPosition);
    this.beams.forEach(b => b.update(time));
  }

  /**
   * Show beams and update their display.
   * @param level The level of beam display.
   */
  public showBeams(level: BeamDisplayLevel): void {
    this.rangePrimitive.modelMatrix = groundMatrix(this.currentPositionCarto);

    const needShow =
      level === BeamDisplayLevel.All || this.beams.some(b => b.status != BeamStatus.Closed);
    this.beamPrimitives.show = needShow;
    this.beams.forEach(b => b.updateDisplay(needShow));
  }

  /**
   * Hide beams of this satellite.
   */
  public hideBeams(): void {
    this.beamPrimitives.show = false;
  }
}
