import { Beam, BeamStatus } from "./beam";
import { Simulatable } from "./simulatable";
import { BeamDisplayLevel, SimulatorControl } from "./simulator-control";
import { groundMatrix } from "@/utils/cesium-math";

export class Satellite extends Simulatable {
  private static readonly beamNum: int = 48;

  public readonly primitive: Cesium.Model;
  public readonly beams: Beam[] = [];
  private readonly position: Cesium.PositionProperty;
  public readonly rangePrimitive: Cesium.Primitive;
  public readonly beamPrimitives: Cesium.PrimitiveCollection;

  public currentPosition: Cesium.Cartesian3 = new Cesium.Cartesian3();
  public currentPositionCarto: Cesium.Cartographic = new Cesium.Cartographic();

  constructor(entity: Cesium.Entity, ctrl: SimulatorControl) {
    super(ctrl);
    this.position = entity.position!;
    entity.name = "satellite";
    this.primitive = this.createPrimitive(entity);
    this.beamPrimitives = new Cesium.PrimitiveCollection({ show: false });
    this.rangePrimitive = this.createCircle();
    this.beams = this.createBeams(entity);
  }

  private createPrimitive(entity: Cesium.Entity) {
    const primitive = Cesium.Model.fromGltf({
      url: this.ctrl.config.satelliteModelUrl,
      scale: 10.0,
      minimumPixelSize: 32,
      // maximumScale: 4,
      id: entity.id,
    });
    return primitive;
  }

  //创建圆面
  private createCircle() {
    const primitive = new Cesium.Primitive({
      geometryInstances: this.ctrl.factory.satelliteRangeInstance,
      appearance: this.ctrl.factory.satelliteRangeAppearance,
    });
    return primitive;
  }

  //创建波束
  private createBeams(entity: Cesium.Entity): Beam[] {
    const beams = [];
    for (let j = 0; j < Satellite.beamNum; j++) {
      beams.push(new Beam(this, j, entity, this.ctrl));
      this.beamPrimitives.add(beams.at(-1)?.primitive);
    }
    return beams;
  }

  public update(time: Cesium.JulianDate): void {
    this.currentPosition = this.position.getValue(time)!;
    this.currentPositionCarto = Cesium.Cartographic.fromCartesian(this.currentPosition);
    this.primitive.modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(this.currentPosition);
    this.beams.forEach(b => b.update(time));
  }

  public showBeams(level: BeamDisplayLevel): void {
    this.rangePrimitive.modelMatrix = groundMatrix(this.currentPositionCarto);
    // this.rangePrimitive.show = true;

    const covered =
      level === BeamDisplayLevel.All || this.beams.some(b => b.status != BeamStatus.Closed);
    this.beamPrimitives.show = covered;
    this.beams.forEach(b => b.updateDisplay(covered));
  }

  public hideBeams(): void {
    // this.rangePrimitive.show = false;
    this.beamPrimitives.show = false;
  }
}
