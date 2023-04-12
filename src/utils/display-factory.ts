import { BeamStatus } from "@/simulation/beam";
import { BW, El } from "@/simulation/beam-constants";
import { mapValues } from "lodash-es";

export interface DisplayConfig {
  circleColor: Cesium.Color;
  terminalImageUrl: string;
  satelliteModelUrl: string;
}

export class DisplayFactory {
  private readonly config: DisplayConfig;

  public readonly satelliteRangeInstance: Cesium.GeometryInstance;
  public readonly satelliteRangeAppearance: Cesium.Appearance;
  public readonly beamInstances: Cesium.GeometryInstance[];

  public readonly beamMaterials: {
    0: Cesium.Material;
    1: Cesium.Material;
    2: Cesium.Material;
  };
  public readonly beamAppearances;

  constructor(config: DisplayConfig) {
    this.config = config;

    this.satelliteRangeInstance = new Cesium.GeometryInstance({
      geometry: new Cesium.CircleOutlineGeometry({
        center: Cesium.Cartesian3.fromDegrees(0, 0),
        radius: 1800000 * 1.3,
        height: 400000,
      }),
    });
    this.satelliteRangeAppearance = new Cesium.EllipsoidSurfaceAppearance({
      material: Cesium.Material.fromType("Color", {
        color: config.circleColor.withAlpha(0.2),
      }),
    });

    this.beamInstances = El.map(
      x =>
        new Cesium.GeometryInstance({
          geometry: new Cesium.CircleGeometry({
            center: Cesium.Cartesian3.fromDegrees(0, 0),
            granularity: 0.05,
            radius: (782368.72 / Math.cos(x)) * Math.tan(BW / 2),
          }),
        })
    );

    this.beamMaterials = {
      [BeamStatus.Closed]: Cesium.Material.fromType("Color", {
        color: Cesium.Color.WHITE.withAlpha(0.3),
      }),
      [BeamStatus.Standby]: Cesium.Material.fromType("Color", {
        color: Cesium.Color.GREEN.withAlpha(0.3),
      }),
      [BeamStatus.Open]: Cesium.Material.fromType("Color", {
        color: Cesium.Color.RED.withAlpha(0.3),
      }),
    };
    this.beamAppearances = mapValues(
      this.beamMaterials,
      v =>
        new Cesium.EllipsoidSurfaceAppearance({
          material: v,
        })
    );
  }
}
