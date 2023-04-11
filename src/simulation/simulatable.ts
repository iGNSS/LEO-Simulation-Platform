import { Simulator } from "./simulator";
import { SimulatorControl } from "./simulator-control";

export abstract class Simulatable {
  protected readonly ctrl: SimulatorControl;

  constructor(ctrl: SimulatorControl) {
    this.ctrl = ctrl;
  }

  public get sim(): Simulator {
    return this.ctrl.sim;
  }

  public abstract update(currentTime: Cesium.JulianDate): void;
}
