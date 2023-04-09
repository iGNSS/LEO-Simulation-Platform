///////////////////////////////////////////////////////////////////////////////////
//函数
//----------------------------------------------------------------------------------------------------------------------
///////////////////////////////////////////////////////////////////////////////////

//波束用户夹角及覆盖情况
function getvalue(Satellite_N, User_N, Beam_N, userPosition, satellitePosition, beamPosition, currentTime, BW) {
  if (!viewer.entities) return;
  const time = currentTime;
  const positionS = satellitePosition[Satellite_N].getValue(time);
  const positionU = userPosition[User_N];
  // 用户坐标和卫星之间的向量
  const vectorUS = Cesium.Cartesian3.subtract(
    positionU,
    positionS,
    new Cesium.Cartesian3()
  );
  const positionB = beamPosition[Satellite_N][Beam_N].getValue(
    currentTime
  );
  const vectorBS = Cesium.Cartesian3.subtract(
    positionB,
    positionS,
    new Cesium.Cartesian3()
  );

  // 波束和用户之间的夹角
  const angleBU = Cesium.Cartesian3.angleBetween(vectorUS, vectorBS);

  const distance = Cesium.Cartesian3.distance(positionS, positionU);
  const iscorverd = distance < 2400000 && angleBU < BW / 2 ? 1 : 0;

  return {
    angle: angleBU,
    iscorverd,
  };
}

//更新卫星状态矩阵
function updatestate(satelliteNum, userNum, beamNum, near, userposition, satelliteposition, beamposition, currentTime, BW) {
  for (let i = 0; i < 6 * satelliteNum; i++) {
    for (let k = 0; k < userNum; k++) {
      for (let j = 0; j < beamNum; j++) {
        if (near[i][k] == 1) {
          state[i * beamNum + j][k] = getvalue(
            i,
            k,
            j,
            userposition,
            satelliteposition,
            beamposition,
            currentTime,
            BW
          ).iscorverd;
        } else {
          state[i * beamNum + j][k] = 0;
        }
      }
    }
  }
}

//显示卫星状态矩阵
function showstate(content, dataSourceEntities, satelliteNum, beamNum, state) {
  content.innerText = "";
  for (let i = 0 * beamNum; i < 6 * satelliteNum * beamNum; i++) {
    //显示卫星id
    if ((i / beamNum) % 1 == 0) {
      content.innerText += `${dataSourceEntities.values[i / beamNum].id} \n`;
    }
    content.innerText += `${state[i].toString()} \n`;
  }
}

//计算重叠函数
function count(state, userNum, satelliteNum, beamNum, n) {
  let D = 0;
  let N = 0;

  for (let k = 0; k < userNum; k++) {
    if (state[n][k] == 1) {
      D = D + 1;
      for (let m = 0; m < 6 * satelliteNum * beamNum; m++) {
        N += state[m][k];
      }
    }
  }

  return D == 0 ? Number.POSITIVE_INFINITY : N / D;
}

//找出所有需要覆盖用户的下标集合
function covereduser() {
  var covereduserindex = [];
  for (let k = 0; k < userNum; k++) {
    for (let m = 0; m < laneNum * satelliteNum * beamNum; m++) {
      if (state[m][k]) {
        covereduserindex.push(k);
        break;
      }
    }
  }
  return covereduserindex;
}

//检测是否所有用户被覆盖
function isworking() {
  var covereduserindex = covereduser();
  var bool = true;
  for (let k = 0; k < covereduserindex.length; k++) {
    var b = false;
    for (let m = 0; m < laneNum * satelliteNum * beamNum; m++) {
      if (
        state[m][covereduserindex[k]] == 1 &&
        state[m][userNum] == "open"
      ) {
        b = true;
        break;
      }
    }
    if (!b) {
      bool = false;
      break;
    }
  }
  return bool;
}

function closebeam() {
  //找出所有待命波束下标
  var standbybeamindex = [];
  for (let i = 0; i < laneNum * satelliteNum * beamNum; i++) {
    if (
      count(state, userNum, satelliteNum, beamNum, i) <<
      Number.POSITIVE_INFINITY
    ) {
      standbybeamindex.push(i);
      state[i][userNum] = "open";
    } else {
      state[i][userNum] = "closed";
    }
  }

  var v = []; //重复程度
  for (var i = 0; i < standbybeamindex.length; i++) {
    v.push(
      count(state, userNum, satelliteNum, beamNum, standbybeamindex[i])
    );
  }

  while (v.length > 0) {
    var t;
    t = Math.max.apply(null, v);
    var index = v.indexOf(t);
    beamindex = standbybeamindex[index];
    state[beamindex][userNum] = "standby";
    if (!isworking()) {
      state[beamindex][userNum] = "open";
    }
    v.splice(index, 1);
    standbybeamindex.splice(index, 1);
  }
}

function showdata() {
  var openNum = 0;
  var coveredNum = 0;
  //var satelliteNum = 11;
  for (let i = 0; i < laneNum * satelliteNum * beamNum; i++) {
    if (state[i][userNum] == "open") {
      openNum++;
    }
  }

  var index = covereduser();
  coveredNum = index.length;
  var lon = Cesium.Math.toDegrees(viewer.camera.positionCartographic.longitude).toFixed(1);
  var lat = Cesium.Math.toDegrees(viewer.camera.positionCartographic.latitude).toFixed(1);
  var hei = (viewer.camera.positionCartographic.height / 1000).toFixed(2);
  content.innerText = `轨道卫星个数: ${satelliteNum}\n`;
  content.innerText += `轨道数: ${laneNum}\n`;
  content.innerText += `用户个数: ${userNum}\n`;
  content.innerText += `视角高: ${hei}km\n`;
  content.innerText += `视角位置:( ${lon}, ${lat} )\n`;
  content.innerText += `开启波束个数: ${openNum} \n`;
  content.innerText += `被覆盖用户个数: ${coveredNum} \n`;
}

//显示波束
function showbeam() {
  beamEntities.forEach((item) => {
    item.show = true; //控制显隐藏
  });
  for (let i = 0; i < laneNum * satelliteNum; i++) {
    var showallbeam = false;
    for (let j = 0; j < beamNum; j++) {
      var ellipse = beamshow[i][j];
      if (!controls.visibleSpread) {
        ellipse.show = false;
      } else {
        ellipse.show = true;
      }
      if (state[i * beamNum + j][userNum] == "open") {
        ellipse.material = Cesium.Color["RED"].withAlpha(1.5);
        showallbeam = true;
      } else if (state[i * beamNum + j][userNum] == "standby") {
        ellipse.material = Cesium.Color["GREEN"].withAlpha(1.5);
        showallbeam = true;
      } else {
        ellipse.material = Cesium.Color["WHITE"].withAlpha(1.5);
      }
    }

    if (showallbeam == true) {
      for (let j = 0; j < beamNum; j++) {
        var ellipse = beamshow[i][j];
        ellipse.show = true;
      }
    }
  }
}

//更新相邻信息
function RefreshNear() {
  if (viewer.entities) {
    let time = viewer.clock.currentTime;
    for (let i = 0; i < laneNum * satelliteNum; i++) {
      for (let k = 0; k < userNum; k++) {
        var positionS = Cesium.Cartographic.fromCartesian(
          satelliteposition[i].getValue(time)
        );
        var positionU = Cesium.Cartographic.fromCartesian(userposition[k]);
        if (
          Math.abs(
            Cesium.Math.toDegrees(positionS.longitude) -
            Cesium.Math.toDegrees(positionU.longitude)
          ) > 40
        ) {
          near[i][k] = 0;
        } else {
          near[i][k] = 1;
        }
      }
    }
  }
}

function addUser(userN) {
  for (var i = 0; i < userN; i++) {
    position = Cesium.Cartesian3.fromDegrees(
      Math.random() * 50 + 70,
      Math.random() * 30 + 30,
      0
    );
    billboards.add({
      image: "../终端.png",
      position: position,
      scale: 0.05,
    });

    userposition.push(position);
  }
}

function CZML2Sat(text) {
  let czml = JSON.parse(text);
  let timeInfo = czml[0].clock;
  let currentTime = timeInfo.currentTime;
  let times = timeInfo.interval.split("/");
  viewer.clock.startTime = Cesium.JulianDate.fromIso8601(times[0]);
  viewer.clock.stopTime = Cesium.JulianDate.fromIso8601(times[1]);
  //修改起始时间
  let offsetStartTime = Cesium.JulianDate.addSeconds(
    Cesium.JulianDate.fromIso8601(currentTime),
    700 * satelliteNum,
    new Cesium.JulianDate()
  );
  // viewer.clock.currentTime = Cesium.JulianDate.fromIso8601(offsetStartTime.toLocaleString());
  timeInfo.currentTime = offsetStartTime.toLocaleString();
  start = viewer.clock.startTime;
  //更新时间
  let step = 20 / satelliteNum; // 总个数点 平均分配给每个卫星

  // 开始复制
  let newCopys = [czml[0]];
  for (let i = 1; i < czml.length; i++) {
    const item = czml[i];

    for (let j = 0; j < satelliteNum; j++) {
      let copy = JSON.parse(JSON.stringify(item));
      if (j > 0) {
        //修改 point 的时间
        for (let k = 0; k < copy.position.cartesian.length; k = k + 4) {
          copy.position.cartesian[k] =
            copy.position.cartesian[k] + 300 * step * j;
        }
      } else {
        // 修改 线的颜色
        //copy.path.material.solidColor.color.rgba = lineColor
      }
      //  移除billboard
      delete copy.billboard;
      // 是否显示标签
      isShowLabel ? (copy.label.show = true) : (copy.label.show = false);
      //添加模型
      copy.model = {
        gltf: "../gltfModel/weixin_fixed.gltf",
        scale: 1.0,
        minimumPixelSize: 32,
        maximumPixelSize: 64,
      };

      copy.id = `${copy.id}  ${j + 1}`;
      copy.label.text = `${copy.label.text} ${j + 1}`;
      newCopys.push(copy);
    }
  }

  loadCZML(newCopys);
}


// 加载 czml
function loadCZML(czml) {
  // 通过czml 加载模型
  viewer.dataSources
    .add(Cesium.CzmlDataSource.load(czml))
    .then(function (dataSource) {
      if (dataSource && dataSource.entities) {
        DataSource = dataSource;
        dataSource.entities.values.forEach((satellite) => {
          satelliteposition.push(satellite.position);
          satellite.issatellite = true;
          createWaveEntity(satellite);
        });
      }
    });
}

const mat3RoateZ = Cesium.Matrix3.fromRotationZ(Cesium.Math.toRadians(60));
const mat3RoateX = Cesium.Matrix3.fromRotationX(Cesium.Math.toRadians(45));
Cesium.Matrix4.multiplyByMatrix3(mat3RoateZ, mat3RoateX, mat3RoateZ);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// 创建 光波Entity
function createWaveEntity(entity) {
  CreateCircle(entity);
  CreateBeamEntities(entity);
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//创建圆面
function CreateCircle(entity) {
  SetPosition(entity);
  var circleEntity = viewer.entities.add({
    ellipse: {
      semiMajorAxis: 1800000 * 1.3,
      semiMinorAxis: 1800000 * 1.3,
      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      outline: true,
      fill: false,
      numberOfVerticalLines: 0,
      material: Cesium.Color.RED,
      outlineColor: Cesium.Color[circleColor].withAlpha(0.2),
      outlineWidth: 100,
    },
  });
  circleEntity.show = controls.visibleSpread;
  circleEntity.position = property;
  waveEntities.push(circleEntity);

  return waveEntities;
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//卫星位置记录
function SetPosition(entity) {
  property = new Cesium.SampledPositionProperty();
  for (var ind = 0; ind < pointNum; ind++) {
    var time = Cesium.JulianDate.addSeconds(
      clock.startTime,
      300 * ind,
      new Cesium.JulianDate()
    );
    var position = entity.position.getValue(time);
    if (position) {
      var cartographic =
        viewer.scene.globe.ellipsoid.cartesianToCartographic(position);
      var lat = Cesium.Math.toDegrees(cartographic.latitude),
        lng = Cesium.Math.toDegrees(cartographic.longitude),
        hei = cartographic.height / 1.9;

      property.addSample(
        time,
        Cesium.Cartesian3.fromDegrees(lng, lat, hei)
      );
    }
  }
  return property;
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//星下点坐标
//const bearing = 60;
const R_e = 6371000;
function SetUnderSatellite(entity, El, Az) {
  positionBeam = new Cesium.SampledPositionProperty();
  //let m = new Cesium.Matrix4();
  //Cesium.Matrix4.setTranslation(Cesium.Matrix4.IDENTITY, new Cesium.Cartesian3(1, 1, 1), m)//构造平移矩阵
  for (var ind = 0; ind < pointNum; ind++) {
    var time = Cesium.JulianDate.addSeconds(
      clock.startTime,
      300 * ind,
      new Cesium.JulianDate()
    );

    var position = entity.position.getValue(time);

    if (position) {
      var cartographic =
        viewer.scene.globe.ellipsoid.cartesianToCartographic(position);
      var lat = Cesium.Math.toDegrees(cartographic.latitude),
        lng = Cesium.Math.toDegrees(cartographic.longitude),
        hei = cartographic.height;
      var heading = Az;
      var pitch = 0;
      var roll = El;
      var hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
      var lat = Cesium.Math.toDegrees(cartographic.latitude),
        lng = Cesium.Math.toDegrees(cartographic.longitude),
        hei = cartographic.height;

      var R = (hei / 2) * Math.tan(roll);
      var L = R_e * 2 * Math.asin(R / (2 * R_e));
      var c = L / R_e;
      var a = Math.acos(
        Math.sin(cartographic.latitude) * Math.cos(c) +
        Math.cos(cartographic.latitude) *
        Math.sin(c) *
        Math.cos(heading + 0.0876)
      );
      var C = Math.asin(
        (Math.sin(c) * Math.sin(heading + 0.0876)) / Math.sin(a)
      );
      var newPosition_PB = new Cesium.Cartesian3.fromRadians(
        cartographic.longitude + C,
        Math.PI / 2 - a,
        0
      );
      positionBeam.addSample(time, newPosition_PB);
    }
  }
  return positionBeam;
}

//////////////////////////////////////////////////////////////////////////////////////////////
//创建波束
function CreateBeamEntities(entity) {
  for (var j = 0; j < beamNum; j++) {
    p = SetUnderSatellite(entity, El[j], Az[j]);
    var waveEntity = viewer.entities.add({
      id: `${entity.id} beam ${j}`,
      ellipse: {
        semiMajorAxis: (782368.72 / Math.cos(El[j])) * Math.tan(BW / 2),
        semiMinorAxis: (782368.72 / Math.cos(El[j])) * Math.tan(BW / 2),
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        outline: true,
        fill: true,
        numberOfVerticalLines: 0,
        material: Cesium.Color[circleColor].withAlpha(1.5),
        outlineColor: Cesium.Color[circleColor].withAlpha(1.5),
        outlineWidth: 100,
      },
    });
    waveEntity.show = true;
    waveEntity.position = p;
    waveEntity.position.setInterpolationOptions({
      //设定位置的插值算法
      interpolationDegree: 5,
      interpolationAlgorithm: Cesium.LagrangePolynomialApproximation,
    });
    beamEntities.push(waveEntity);
    var index = DataSource.entities.values.indexOf(entity);
    beamposition[index].push(waveEntity.position);
    beamshow[index].push(waveEntity.ellipse);
  }

  return beamEntities;
}