import { SimulatorControl } from "@/controllers/simulator-control";
import { Simulatable } from "./simulatable";

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
