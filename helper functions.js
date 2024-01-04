var frameScrollDelta = 0;// setup some global varriables
var frameScrollCounter = 0;
var tStep = 1/60;// time step 
var mouseDeltaX=0;//mose dx and dy for the current frame
var mouseDeltaY=0;
var lastMx = 0;// last mouse cords
var lastMy=0;
var canvas = document.getElementById("canvas1");
canvas.style.width  = Math.floor(window.innerHeight*(16/9))+'px';
canvas.style.height = window.innerHeight+'px';


function index(x,y,z){// computes index of 3D location in flattened 1D array
  return z*gridSizeX*gridSizeY +y*gridSizeX + x
};


var mouseMoved = false// was mouse moved this frame
function logMovement(event) {// get mouse delta each frame
  mouseDeltaX = event.movementX;
  mouseDeltaY = event.movementY;
  mouseMoved = true;
}

const log = document.getElementById('log');
document.addEventListener('mousemove', logMovement);


async function loadVoxelModel(url,sx,sy,sz){// function to load the enemy voxel model 
  var voxelArr = []
  for(var x=0;x<sx;x++){//make 3D array of zeroes
    var row =[]
    for(var y=0;y<sy;y++){
      var column = []
      for(var z=0;z<sz;z++){
        column.push([0,0,0,0])
      }
      row.push(column)
    }
    voxelArr.push(row)
  }
  const data = await loadVox(url)// get voxel data
  var lineArr = data.split(/\r\n|\n\r|\n|\r/)// split it into array by line breaks
  // console.log(lineArr)
  for(line of lineArr){// itterate over lines
    var vals = line.split(" ")
    vals = [parseInt(vals[0]),parseInt(vals[1]),parseInt(vals[2]),parseInt(vals[3]),parseInt(vals[4]),parseInt(vals[5])] // 
    var matIndex = 1;// set default material index and check voxel colour to assign alternate material index
    if(vals[3]==65 && vals[4]==65 && vals[5]==65){
      matIndex = 2;
    }
    else if((vals[3]==172 && vals[4]==81 && vals[5]==36) || (vals[3]==133 && vals[4]==66 && vals[5]==51)||(vals[3]==153 && vals[4]==70 && vals[5]==52) ){
      matIndex = 3;
    }
    else if((vals[3]==0 && vals[4]==223 && vals[5]==253)){
      matIndex = 4;
      vals[3] =254
      vals[4] =254
      vals[5] =254
    }
    else if((vals[3]==196 && vals[4]==196 && vals[5]==182)){
      matIndex = 5;
    }
    voxelArr[vals[0]][vals[2]][vals[1]] = [vals[3],vals[4],vals[5],matIndex]// set array current voxel to loaded voxel
  }
  return voxelArr
}