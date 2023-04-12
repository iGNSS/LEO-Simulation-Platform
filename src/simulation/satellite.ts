import { Beam, BeamStatus } from "./beam";
import { Simulatable } from "./simulatable";
import { BeamDisplayLevel, SimulatorControl } from "./simulator-control";

export class Satellite extends Simulatable {
  private static readonly beamNum: int = 48;

  public readonly entity: Cesium.Entity;
  public readonly beams: Beam[] = [];
  private readonly position: Cesium.PositionProperty;
  private readonly waveEntity: Cesium.Entity;
  private readonly beamPrimitives: Cesium.PrimitiveCollection;

  public currentPosition: Cesium.Cartesian3 = new Cesium.Cartesian3();
  public currentPositionCarto: Cesium.Cartographic = new Cesium.Cartographic();

  constructor(entity: Cesium.Entity, ctrl: SimulatorControl) {
    super(ctrl);
    this.entity = entity;
    this.position = entity.position!;
    entity.name = "satellite";
    this.beamPrimitives = new Cesium.PrimitiveCollection({ show: false });
    this.waveEntity = this.createCircle();
    this.beams = this.createBeams();
  }

  //创建圆面
  private createCircle() {
    const circleEntity = this.ctrl.viewer.entities.add({
      ellipse: {
        semiMajorAxis: 1800000 * 1.3,
        semiMinorAxis: 1800000 * 1.3,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        outline: true,
        fill: false,
        numberOfVerticalLines: 0,
        material: Cesium.Color.RED,
        outlineColor: this.ctrl.config.circleColor.withAlpha(0.2),
        outlineWidth: 100,
      },
    });
    circleEntity.show = false;
    circleEntity.position = this.setPosition(this.entity);
    return circleEntity;
  }

  //卫星位置记录
  private setPosition(entity: Cesium.Entity): Cesium.SampledPositionProperty {
    const property = new Cesium.SampledPositionProperty();
    for (let i = 0; i < Beam.pointNum; i++) {
      const time = Cesium.JulianDate.addSeconds(
        this.ctrl.viewer.clock.startTime,
        300 * i,
        new Cesium.JulianDate()
      );
      const position = entity.position?.getValue(time);
      if (position) {
        const cartographic = this.ctrl.ellipsoid.cartesianToCartographic(position);
        const lat = Cesium.Math.toDegrees(cartographic.latitude),
          lng = Cesium.Math.toDegrees(cartographic.longitude),
          hei = cartographic.height / 1.9;
        property.addSample(time, Cesium.Cartesian3.fromDegrees(lng, lat, hei));
      }
    }
    return property;
  }

  //创建波束
  private createBeams(): Beam[] {
    const beams = [];
    for (let j = 0; j < Satellite.beamNum; j++) {
      beams.push(new Beam(this, j, this.entity, this.ctrl));
      this.beamPrimitives.add(beams.at(-1)?.primitive);
    }
    return beams;
  }

  public update(time: Cesium.JulianDate): void {
    this.currentPosition = this.position.getValue(time)!;
    this.currentPositionCarto = Cesium.Cartographic.fromCartesian(this.currentPosition);
    this.beams.forEach(b => b.update(time));
  }

  public showBeams(level: BeamDisplayLevel): void {
    this.waveEntity.show = true;
    let covered =
      level === BeamDisplayLevel.All || this.beams.some(b => b.status != BeamStatus.Closed);
    this.beamPrimitives.show = covered;
    this.beams.forEach(b => b.updateDisplay(covered));
  }

  public hideBeams(): void {
    this.waveEntity.show = false;
    this.beamPrimitives.show = false;
  }
}
