import { BeamStatus } from "./beam";
import { Dataset } from "./dataset";
import { Satellite } from "./satellite";
import { Simulator } from "./simulator";
import { User } from "./user";
export interface DisplayConfig {
  circleColor: Cesium.Color;
  terminalImageUrl: string;
  satelliteModelUrl: string;
}

export enum BeamDisplayLevel {
  None,
  Some,
  All,
}

export class SimulatorControl {
  public readonly viewer: Cesium.Viewer;
  private readonly dataset: Dataset;
  public dataSource: Cesium.DataSource | null = null;

  public readonly sim: Simulator;
  private readonly billboards: Cesium.BillboardCollection;
  public config: DisplayConfig;

  public get ellipsoid(): Cesium.Ellipsoid {
    return this.viewer.scene.globe.ellipsoid;
  }

  constructor(viewer: Cesium.Viewer, dataset: Dataset, config: DisplayConfig) {
    this.config = config;
    this.viewer = viewer;
    this.dataset = dataset;
    this.billboards = viewer.scene.primitives.add(new Cesium.BillboardCollection());
    this.sim = new Simulator();
  }

  public async load(): Promise<void> {
    await this.loadCZML(this.dataset.czml);
    this.addUsers();
  }

  private async loadCZML(czml: any): Promise<void> {
    const dataSource = await this.viewer.dataSources.add(Cesium.CzmlDataSource.load(czml));
    if (dataSource?.entities) {
      this.dataSource = dataSource;
      for (const satellite of dataSource.entities.values) {
        this.sim.satellites.push(new Satellite(satellite, this));
      }
    }
  }

  public addUsers(): void {
    for (const userPos of this.dataset.users) {
      this.billboards.add({
        image: this.config.terminalImageUrl,
        position: userPos,
        scale: 0.05,
      });
      this.sim.users.push(new User(userPos, this));
    }
  }

  //显示波束
  public showBeams(level: BeamDisplayLevel): void {
    this.sim.satellites.forEach(s => s.showBeams(level));
  }

  public hideBeams() {
    this.sim.satellites.forEach(s => s.hideBeams());
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

  public getCurrentInfo() {
    let openNum = 0;
    for (const beam of this.sim.iterBeams()) {
      if (beam.status === BeamStatus.Open) {
        openNum++;
      }
    }

    const coveredNum = this.sim.coveredUsers().length;
    const position = this.viewer.camera.positionCartographic;
    return {
      satelliteNum: this.sim.satellites.length,
      laneNum: this.dataset.laneNum,
      userNum: this.sim.users.length,
      longitude: Cesium.Math.toDegrees(position.longitude),
      latitude: Cesium.Math.toDegrees(position.latitude),
      height: position.height,
      openNum,
      coveredNum,
    };
  }
}
