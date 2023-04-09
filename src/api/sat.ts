//参数设置

//全局变量
let czmlFile = "../czml/dataAll.czml"; //czml文件路径

let circleColor = "WHITE"; //RED  贴地光圈颜色

let lineColor = [255, 255, 255, 10]; //WHITE

let isShowLabel = false; //是否显示标签

var loadFinish = true;

//之前内容框对象，可能报错
var content_ = document.getElementsByClassName("content");
var content = content_[0];

let pointNum = 292;

let laneNum = 6; //卫星轨道数
let satelliteNum = 11; //每条轨道的卫星个数
var userNum = 10; //用户个数
var beamNum = 48;
let waveEntities = [];
let beamEntities = [];
let beamposition = [];
let beamshow = [];
let userposition = [];
let satelliteposition = [];
var state = [];
var near = [];
var angle = [];

var ellipsoid = viewer.scene.globe.ellipsoid;
var start = null;
var clock = viewer.clock;
var billboards = viewer.scene.primitives.add(new Cesium.BillboardCollection());
//end 全局变量

//初始化全局变量的相关信息
function SatInit(laneN, satelliteN, userN, beamN) {
  laneNum = laneN;
  satelliteNum = satelliteN;
  userNum = userN;
  beamNum = beamN;
  //光波集合
  for (var i = 0; i < laneNum * satelliteNum; i++) {
    beamposition[i] = [];
  }

  for (var i = 0; i < laneNum * satelliteNum; i++) {
    beamshow[i] = [];
  }

  for (var i = 0; i < laneNum * satelliteNum * beamNum; i++) {
    state[i] = new Array(userNum).fill(-1);
    state[i].push("open");
  }

  for (var i = 0; i < laneNum * satelliteNum; i++) {
    near[i] = new Array(userNum).fill(-1);
  }

  for (var i = 0; i < laneNum * satelliteNum * beamNum; i++) {
    angle[i] = new Array();
  }
}

//全局变量
let El = new Array(); //波束仰角
El[0] = Cesium.Math.toRadians(11);
El[1] = Cesium.Math.toRadians(29.1);
El[2] = Cesium.Math.toRadians(29.1);
El[3] = Cesium.Math.toRadians(22);
El[4] = Cesium.Math.toRadians(47.95);
El[5] = Cesium.Math.toRadians(44);
El[6] = Cesium.Math.toRadians(47.95);
El[7] = Cesium.Math.toRadians(39.66);
El[8] = Cesium.Math.toRadians(39.66);
El[9] = Cesium.Math.toRadians(66.91);
El[10] = Cesium.Math.toRadians(61.25);
El[11] = Cesium.Math.toRadians(61.25);
El[12] = Cesium.Math.toRadians(66.91);
El[13] = Cesium.Math.toRadians(58.21);
El[14] = Cesium.Math.toRadians(55.0);
El[15] = Cesium.Math.toRadians(58.21);

let Az = new Array(); //波束方位角
Az[0] = Cesium.Math.toRadians(120);
Az[1] = Cesium.Math.toRadians(100.89);
Az[2] = Cesium.Math.toRadians(139.11);
Az[3] = Cesium.Math.toRadians(-180);
Az[4] = Cesium.Math.toRadians(96.59);
Az[5] = Cesium.Math.toRadians(120);
Az[6] = Cesium.Math.toRadians(143.41);
Az[7] = Cesium.Math.toRadians(166.1);
Az[8] = Cesium.Math.toRadians(-42.62);
Az[9] = Cesium.Math.toRadians(80);
Az[10] = Cesium.Math.toRadians(15.94);
Az[11] = Cesium.Math.toRadians(-15.94);
Az[12] = Cesium.Math.toRadians(-80);
Az[13] = Cesium.Math.toRadians(-90);
Az[14] = Cesium.Math.toRadians(-90);
Az[15] = Cesium.Math.toRadians(-90);

for (var j = 16; j < 32; j++) {
  El[j] = El[j - 16];
  Az[j] = Az[j - 16] + Cesium.Math.toRadians(120);
}

for (var j = 32; j < 48; j++) {
  El[j] = El[j - 16];
  Az[j] = Az[j - 16] + Cesium.Math.toRadians(120);
}

let BW = Cesium.Math.toRadians(22); //波束角

var DataSource;
//end 全局变量

//----------------------------------------------------------------------------------------
// ui交互函数

// ui交互函数 | 监听文件选择框的change事件
document.getElementById("file-upload").addEventListener("change", function (event) {
  //隐藏所有卫星
  //console.log(viewer.entities.values);
  loadFinish = false;
  viewer.entities.removeAll();
  DataSource.show = false;
  satelliteNum = 4;
  satelliteposition = [];
  beamposition = [];

  //读取文件创建卫星
  let file = event.target.files[0];
  let reader = new FileReader();
  reader.onload = function () {
    let text = reader.result; // 获取TLE文件内容
    CZML2Sat(text);
  };
  reader.readAsText(file); // 读取TLE文件内容
});


// ui交互函数 | 改变相机位置ui交互
var Modal_CameraPos = document.getElementById("Modal_CameraPos");

function openModal_Pos() {
  Modal_CameraPos.style.display = "block";
}

function closeModal_Pos() {
  Modal_CameraPos.style.display = "none";
}

function saveInput_Pos() {
  var input_lon = document.getElementById("input_lon").value;
  var input_lat = document.getElementById("input_lat").value;
  var camera = viewer.camera;
  var position = Cesium.Cartesian3.fromDegrees(
    input_lon,
    input_lat,
    camera.positionCartographic.height
  );
  camera.setView({
    destination: position,
  });
  closeModal_Pos();
}

//ui交互函数 | 改变相机高度ui交互
var Modal_CameraHei = document.getElementById("Modal_CameraHei");
    function openModal_Hei() {
      Modal_CameraHei.style.display = "block";
    }

    function closeModal_Hei() {
      Modal_CameraHei.style.display = "none";
    }

    function saveInput_Hei() {
      var input_hei = document.getElementById("input_hei").value;
      var camera = viewer.camera;
      var position = Cesium.Cartesian3.fromRadians(
        camera.positionCartographic.longitude,
        camera.positionCartographic.latitude,
        input_hei * 1000
      );
      camera.setView({
        destination: position,
      });
      closeModal_Hei();
    }
//-------------------------------------------------------------------------------------
// 直接操作viewer
// 直接操作viewer | 加载cmzl并通过CZML2Sat函数转换成entity实体添加到Viewer里
let request = new XMLHttpRequest();
request.onload = function () {
  if (request.status >= 200 && request.status < 400) {
    // Success!
    CZML2Sat(request.responseText);
  } else {
    console.log("czml load error");
  }
};

request.onerror = function () {
  console.log("czml load error");
};
request.open("GET", czmlFile, true);
request.send();

//直接操作viewer|以下函数均直接操作viewer，均为回调函数
// 直接操作viewer | 定义监听器函数
var postRenderListener = function () {
  viewer.clock.onTick.addEventListener(clockTick);
  viewer.clock.shouldAnimate = true;
  // 取消监听器
  viewer.scene.postRender.removeEventListener(postRenderListener);
  // 在这里添加要执行的代码
};

// 添加监听器
viewer.scene.postRender.addEventListener(postRenderListener);

// 注册监听事件，在postRenderListener回调函数中添加
var clockTick = function () {
  curtime = viewer.clock.currentTime;
  if (DataSource) {
    if (!loadFinish) return;
    if (state) {
      RefreshNear();
      updatestate(
        satelliteNum,
        userNum,
        beamNum,
        near,
        userposition,
        satelliteposition,
        beamposition,
        curtime,
        BW
      );
      closebeam();
      showdata();
      if (controls2.visibleSpread2) {
        showbeam();
      } else {
        beamEntities.forEach(item => {
          item.show = false; //控制显隐藏
        });
      }
    }
  }
};

// 直接操作viewer | 注册点击事件
var alti_String = (viewer.camera.positionCartographic.height / 1000).toFixed(2);
//altitude_show.innerHTML = alti_String;
var handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
var altitude_show = document.getElementById("altitude_show");
viewer.camera.changed.addEventListener(() => {
  // 当前高度
  let height = viewer.camera.positionCartographic.height;
  alti_String = (viewer.camera.positionCartographic.height / 1000).toFixed(2);
  if (altitude_show) {
    altitude_show.innerHTML = alti_String;
  }
});

//直接操作viewer | 点击事件回调函数
function registerEvent() {
  handler.setInputAction(function (click) {
    let pick = viewer.scene.pick(click.position);
    //选中某模型   pick选中的对象

    if (pick && pick.id) {
      //console.log(isworking());
      viewer.clock.onTick.addEventListener(function (clock) {
        //经纬度显示
        if (pick.id.issatellite) {
          var position = pick.id.position;
          let Cartographic = Cesium.Cartographic.fromCartesian(
            position.getValue(viewer.clock.currentTime)
          );
          const lng = Cesium.Math.toDegrees(Cartographic.longitude).toFixed(6);
          const lat = Cesium.Math.toDegrees(Cartographic.latitude).toFixed(6);
          const height = Cartographic.height.toFixed(2);
          pick.id.description = ` 经度： ${lng}° <br > 维度：${lat}°  <br > 高度：${height}m <br >`;
        }
      });
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}
registerEvent();
