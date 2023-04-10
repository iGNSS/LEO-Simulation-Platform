import { SimulatorControl } from "@/api/simulator";

export function registerEvent(viewer: Cesium.Viewer) {
  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  handler.setInputAction((click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
    const pick = viewer.scene.pick(click.position);
    //选中某模型   pick选中的对象
    if (!pick?.id) return;
    //console.log(isworking());
    viewer.clock.onTick.addEventListener(clock => {
      //经纬度显示
      if (pick.id.issatellite) {
        const Cartographic = Cesium.Cartographic.fromCartesian(
          pick.id.position.getValue(viewer.clock.currentTime)
        );
        const lng = Cesium.Math.toDegrees(Cartographic.longitude).toFixed(6);
        const lat = Cesium.Math.toDegrees(Cartographic.latitude).toFixed(6);
        const height = Cartographic.height.toFixed(2);
        pick.id.description = ` 经度： ${lng}° <br> 纬度：${lat}°  <br> 高度：${height}m <br>`;
      }
    });
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}

function initInteraction(ctrl: SimulatorControl) {
  const viewer = ctrl.viewer;
  registerEvent(viewer);

  // 直接操作viewer | 定义监听器函数
  const postRenderListener = () => {
    // 取消监听器
    viewer.scene.postRender.removeEventListener(postRenderListener);
    // 在这里添加要执行的代码
  };

  // 添加监听器
  viewer.scene.postRender.addEventListener(postRenderListener);
}
