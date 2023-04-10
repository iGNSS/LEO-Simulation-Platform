export function registerEvent(viewer: Cesium.Viewer) {
  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  handler.setInputAction((click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
    const pick = viewer.scene.pick(click.position);
    //选中某模型   pick选中的对象
    if (!pick?.id) return;
    console.log(pick);
    viewer.clock.onTick.addEventListener(clock => {
      //经纬度显示
      if (pick.id.name === "satellite") {
        const carto = Cesium.Cartographic.fromCartesian(
          pick.id.position.getValue(viewer.clock.currentTime)
        );
        const lng = Cesium.Math.toDegrees(carto.longitude).toFixed(6);
        const lat = Cesium.Math.toDegrees(carto.latitude).toFixed(6);
        const height = (carto.height / 1000).toFixed(2);

        pick.id.description = ` 经度：${lng} ° <br> 纬度：${lat} ° <br> 高度：${height} km <br>`;
      }
    });
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}
