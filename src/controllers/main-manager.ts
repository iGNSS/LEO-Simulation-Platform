import { Grid } from "@/utils/grid";
import { Dataset } from "./dataset";
import { BeamDisplayLevel, SimulatorControl } from "./simulator-control";

export class MainManager {
  public readonly viewer: Cesium.Viewer;
  public readonly clock: Cesium.Clock;
  public readonly ctrl: SimulatorControl;
  private readonly grid: Grid;
  private readonly heatmap: any;

  private pickedSatellite: Cesium.Entity | undefined = undefined;
  private tickCount: number = 0;

  constructor(viewer: Cesium.Viewer, heatmap: any) {
    this.viewer = viewer;
    this.clock = viewer.clock;
    this.ctrl = new SimulatorControl(viewer, {
      circleColor: Cesium.Color.WHITE,
      terminalImageUrl: "/img/终端.png",
      satelliteModelUrl: "/gltf-models/satellite.gltf",
    });
    this.heatmap = heatmap;
    this.grid = new Grid(Cesium.Rectangle.fromDegrees(60, 0, 120, 60), 1);
  }

  public start() {
    this.heatmap.setRect(this.grid.scope, this.grid.step);
    this.registerEvent();
  }

  public update() {
    this.tickCount++;
    if (this.ctrl?.valid) {
      this.ctrl.sim.update(this.clock.currentTime);
      this.ctrl.sim.closeBeam();
    }
  }

  public async loadAndRun(czmlStr: string) {
    const dataset = new Dataset(czmlStr, {
      satelliteNum: 11,
      userNum: 20,
      showLabel: false,
      modelUrl: "/gltf-models/satellite.gltf",
    });
    await this.ctrl.load(await dataset.load());
    // this.viewer.scene.requestRender();
  }

  private registerEvent(): void {
    const handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
    handler.setInputAction((click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      const pick = this.viewer.scene.pick(click.position);
      console.log("pick", pick);
      if (pick?.id instanceof Cesium.Entity && pick.id.name == "satellite") {
        this.pickedSatellite = pick.id;
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    this.clock.onTick.addEventListener(time => this.updateSatelliteDescription(this.clock));
  }

  private updateSatelliteDescription(clock: Cesium.Clock) {
    if (!this.pickedSatellite) return;
    const carto = Cesium.Cartographic.fromCartesian(
      this.pickedSatellite.position!.getValue(clock.currentTime)!
    );
    const lng = Cesium.Math.toDegrees(carto.longitude).toFixed(4);
    const lat = Cesium.Math.toDegrees(carto.latitude).toFixed(4);
    const height = (carto.height / 1000).toFixed(2);

    this.pickedSatellite.description = new Cesium.ConstantProperty(
      ` 经度：${lng} ° <br> 纬度：${lat} ° <br> 高度：${height} km <br>`
    );
  }

  public changeBeamDisplay(val: BeamDisplayLevel) {
    if (val === BeamDisplayLevel.None) this.ctrl.hideBeams();
  }

  public toggleHeatmap(val: boolean): void {
    if (val) {
      const ss = this.grid.positions.map(p => this.ctrl.sim.getSignalStrength(p));
      this.grid.updateData(ss);
      this.heatmap.setData(0, 1, this.grid.heatmapData);
    }
    this.clock.shouldAnimate = !val;
    this.heatmap.props.show = val;
  }
}
