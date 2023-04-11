import { Simulatable } from "./simulatable";
import { SimulatorControl } from "./simulator-control";

export class User extends Simulatable {
  position: Cesium.Cartesian3;

  public currentPosition: Cesium.Cartesian3 = new Cesium.Cartesian3();
  public currentPositionCarto: Cesium.Cartographic = new Cesium.Cartographic();

  constructor(position: Cesium.Cartesian3, ctrl: SimulatorControl) {
    super(ctrl);
    this.position = position;
  }

  public update(time: Cesium.JulianDate): void {
    this.currentPosition = this.position;
    this.currentPositionCarto = Cesium.Cartographic.fromCartesian(this.position);
  }
}
