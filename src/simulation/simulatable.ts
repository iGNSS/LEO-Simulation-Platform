import { SimulatorControl } from "@/controllers/simulator-control";
import { Simulator } from "./simulator";

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
