//参数设置

let czmlFile = "../czml/dataAll.czml"; //czml文件路径

let circleColor = "WHITE"; //RED  贴地光圈颜色

let lineColor = [255, 255, 255, 10]; //WHITE

let isShowLabel = false; //是否显示标签

var loadFinish = true;

//----------------------------------------------------------------------------------------------------------------------

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
