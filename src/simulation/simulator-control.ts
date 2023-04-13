import { BeamStatus } from "./beam";
import { Dataset } from "./dataset";
import { DisplayConfig, DisplayFactory } from "../utils/display-factory";
import { Satellite } from "./satellite";
import { Simulator } from "./simulator";
import { User } from "./user";

export enum BeamDisplayLevel {
  /** Display nothing. */
  None,
  /** Only display those whose satellite cover any user. */
  Some,
  /** Display all. */
  All,
}

export class SimulatorControl {
  public readonly viewer: Cesium.Viewer;
  public readonly sim: Simulator;
  public readonly config: DisplayConfig;
  public readonly factory: DisplayFactory;

  private dataset: Dataset | undefined = undefined;

  private readonly billboards: Cesium.BillboardCollection;
  private readonly beamPrimitives: Cesium.PrimitiveCollection;

  /** Whether the system is valid. */
  public get valid(): boolean {
    return this.dataset instanceof Dataset;
  }

  /** The scene of the viewer. */
  public get scene(): Cesium.Scene {
    return this.viewer.scene;
  }

  /** The ellipsoid in the scene. */
  public get ellipsoid(): Cesium.Ellipsoid {
    return this.scene.globe.ellipsoid;
  }

  constructor(viewer: Cesium.Viewer, config: DisplayConfig) {
    this.config = config;
    this.viewer = viewer;
    this.factory = new DisplayFactory(config);
    this.billboards = viewer.scene.primitives.add(new Cesium.BillboardCollection());
    this.beamPrimitives = viewer.scene.primitives.add(
      new Cesium.PrimitiveCollection({ show: false })
    );
    this.sim = new Simulator();
  }

  /**
   * Load dataset for simulation.
   * @param dataset
   */
  public async load(dataset: Dataset): Promise<void> {
    if (this.valid) this.clear();
    this.dataset = dataset;
    await this.loadCZML(dataset.czml);
    this.initUsers();
  }

  /**
   * Load czml in the dataset.
   * @param czml
   */
  private async loadCZML(czml: any): Promise<void> {
    const dataSource = await this.viewer.dataSources.add(Cesium.CzmlDataSource.load(czml));
    for (const entity of dataSource.entities.values) {
      entity.name = "satellite";
      const satellite = new Satellite(entity, this);
      this.sim.satellites.push(satellite);
      this.beamPrimitives.add(satellite.rangePrimitive);
      this.beamPrimitives.add(satellite.beamPrimitives);
    }
  }

  /**
   * Initialize users.
   */
  public initUsers(): void {
    for (const userPos of this.dataset!.users) {
      this.billboards.add({
        image: this.config.terminalImageUrl,
        position: userPos,
        scale: 0.05,
      });
      this.sim.users.push(new User(userPos, this));
    }
  }

  /**
   * Show beams of all the satellites.
   * @param level The level of beam display.
   */
  public showBeams(level: BeamDisplayLevel): void {
    this.beamPrimitives.show = true;
    this.sim.satellites.forEach(s => s.showBeams(level));
  }

  /**
   * Hide all the beams.
   */
  public hideBeams(): void {
    this.beamPrimitives.show = false;
    this.sim.satellites.forEach(s => s.hideBeams());
  }

  /**
   * Clear all entities, primitives, etc, in the scene.
   */
  public clear(): void {
    this.sim.clear();
    this.viewer.entities.removeAll();
    this.billboards.removeAll();
    this.beamPrimitives.removeAll();
    this.viewer.dataSources.removeAll(true);
    this.dataset = undefined;
  }

  //显示卫星状态矩阵
  /* public showState() {
    const content = [];
    for (let i = 0; i < this.sim.laneNum * this.sim.satelliteNum * this.sim.beamNum; i++) {
      //显示卫星id
      if ((i / this.sim.beamNum) % 1 === 0) {
        content.push(`${this.viewer.entities.values[i / this.sim.beamNum].id}`);
      }
      content.push(this.sim.state[i].toString());
    }
    return content;
  } */

  /**
   * Get the current simulation information.
   * @returns
   */
  public getCurrentInfo() {
    const openNum = this.sim.beams.filter(b => b.status == BeamStatus.Open).size();
    const coveredNum = this.sim.coveredUsers().size();
    const position = this.viewer.camera.positionCartographic;
    return {
      satelliteNum: this.sim.satellites.length,
      laneNum: this.dataset!.laneNum,
      userNum: this.sim.users.length,
      longitude: Cesium.Math.toDegrees(position.longitude),
      latitude: Cesium.Math.toDegrees(position.latitude),
      height: position.height,
      openNum,
      coveredNum,
    };
  }
}
