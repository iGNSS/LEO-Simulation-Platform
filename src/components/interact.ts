let pickedSatellite: Cesium.Entity | undefined = undefined;

function updateSatelliteDescription(clock: Cesium.Clock) {
  if (!pickedSatellite) return;
  const carto = Cesium.Cartographic.fromCartesian(
    pickedSatellite.position!.getValue(clock.currentTime)!
  );
  const lng = Cesium.Math.toDegrees(carto.longitude).toFixed(4);
  const lat = Cesium.Math.toDegrees(carto.latitude).toFixed(4);
  const height = (carto.height / 1000).toFixed(2);

  pickedSatellite.description = new Cesium.ConstantProperty(
    ` 经度：${lng} ° <br> 纬度：${lat} ° <br> 高度：${height} km <br>`
  );
}

export function registerEvent(viewer: Cesium.Viewer) {
  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  handler.setInputAction((click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
    const pick = viewer.scene.pick(click.position);
    console.log("pick", pick);
    if (pick?.id instanceof Cesium.Entity && pick.id.name == "satellite") {
      pickedSatellite = pick.id;
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  viewer.clock.onTick.addEventListener(time => updateSatelliteDescription(viewer.clock));
}
