// Start time
var time0 = (new Date()).getTime() / 1000;
var lPos = []//light positions (not used in this version of the project)
var lCol = []//light colours (not used in this version of the project)
var cPos = [0,0,0]// camera position
var thetaY = 0;// camera rotation around x&y axies 
var thetaX = 0;
var mapArr = [] //flattened array holding map data
var gridSizeX = 256// map size in x,y,&z directions
var gridSizeY = 32
var gridSizeZ = 256
var objects = []// objects (not used in this version of the project)
var mapReady = false//is the map loaded yet
var w = 360//screen x& y resolutions
var h = 240


var weaponOffset = 0;// offset to get weapon texture from megatexture

var mapTexture// 3d texture to hold map
var globalPTProgram//WEBGL program that does path tracing/ rendering
var globalPostProProgram//WEBGL program that does post processing
var globalCopyProgram//WEBGL program to copy from one texutre to another
var fb//frame buffer
var targetTexture//texure to coppy into
var screenTexutre// texture that holds screen/ frame buffer
var megaTexture //holds all image data needed for renderer.
var texPingPong = false// which texture is coppied into each frame to do temporal accumulation


async function initMapArray(){// funciton to load the map
  mapArr = []// make sure array is empty
  for(var x=0;x<gridSizeX;x++){// fill with empty voxels
    for(var y=0;y<gridSizeY;y++){
      for(var z=0;z<gridSizeZ;z++){
        mapArr.push(0)
        mapArr.push(0)
        mapArr.push(0)
        mapArr.push(0)
      }
    }
  }
  const data = await loadVox("tokyo-0.ply")// get map data as string
  var lineArr = data.split(/\r\n|\n\r|\n|\r/)// regex to split into array of lines
  for(line of lineArr){// itterate though each line/ voxel
    var vals = line.split(" ")// get array of each value pretaining to that voxel
    vals = [parseInt(vals[0])+128,parseInt(vals[1])+129,parseInt(vals[2])+24,parseInt(vals[3]),parseInt(vals[4]),parseInt(vals[5])]// convert to numbers
    var index = 4*(vals[1]*gridSizeX*gridSizeY + (vals[2]+8)*gridSizeX + vals[0])// compute index of voxel in flattened array
    var matIndex = 1;// material is diffuse by default
    // use colour of voxel to choose material
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
    else if((vals[3]==196 && vals[4]==196 && vals[5]==182)||(vals[3]==82 && vals[4]==81 && vals[5]==89)){
      matIndex = 3;
    }
    else if((vals[3]==15 && vals[4]==52 && vals[5]==26)){
      matIndex = 5;
    }
    // write voxel to map array
    mapArr[index] = vals[3]
    mapArr[index+1] = vals[4]
    mapArr[index+2] = vals[5]
    mapArr[index+3] = matIndex 
  }
  // bind map array to GL (do webGL texture initiization stuff)
  bindMapTex(globalGl,mapArr)
}

// async function initMapArray(){
//   mapArr = []
//   for(var x=0;x<gridSizeX;x++){
//     for(var y=0;y<gridSizeY;y++){
//       for(var z=0;z<gridSizeZ;z++){// loop over array
//         var val = noise.simplex3(x*0.02,y*0.02,z*0.02)
//         if(Math.abs(x-gridSizeX/2+10)<6 && Math.abs(z-gridSizeZ/2+10)<6&& y<12 && y>1){
//             mapArr.push(150)
//             mapArr.push(150)
//             mapArr.push(150)// if so fill with one
//             mapArr.push(4)
//           }
//         else if((val>0.1 || y==0)){ // check if distance is less than 50 (circle with radius 50)
//           var noiseval = noise.simplex3(x*0.2,y*0.2,z*0.2)
//           if(noiseval <-0.2){
//             mapArr.push(150)
//             mapArr.push(150)
//             mapArr.push(150)// if so fill with one
//             mapArr.push(1)
//           }
//           else if(noiseval>-0.2 && noiseval<0.3){
//             mapArr.push(100)
//             mapArr.push(100)
//             mapArr.push(100)// if so fill with one
//             mapArr.push(2)
//           }
//           else{
//             mapArr.push(100)
//             mapArr.push(100)
//             mapArr.push(100)// if so fill with one
//             mapArr.push(3)
//           }
//         }
//         else{
//           mapArr.push(0)
//           mapArr.push(0)// otherwise zero
//           mapArr.push(0)
//           mapArr.push(0)
//         }
//       }
//     }
//   }

//   bindMapTex(globalGl,mapArr)
// }


function createSolidTexture(gl, r, g, b, a) {//webgl function to create a texture and initilize its parameters
    var data = new Uint8Array([r, g, b, a]);
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    return texture;
}

// Define a general purpose 3D vector object.
function Vector3() {
    this.x = 0;
    this.y = 0;
    this.z = 0;
}

Vector3.prototype = {
    set : function(x,y,z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
};

//
// Initialize a texture and load an image.
// When the image finished loading copy it into the texture.
//
function loadTexture(gl, url) {// function to load a image url into WEBGL texuture, not  mine, I got it from here: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                width, height, border, srcFormat, srcType,
                pixel);

  const image = new Image();
  image.onload = function() {
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                  srcFormat, srcType, image);
    // WebGL1 has different requirements for power of 2 images
    // vs non power of 2 images so check if the image is a
    // power of 2 in both dimensions.
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
       // Yes, it's a power of 2. Generate mips.
       gl.generateMipmap(gl.TEXTURE_2D);
    } else {
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
  };
  image.src = url;
  return texture;
}


function isPowerOf2(value) {// self explanitory also from here: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL
  return (value & (value - 1)) == 0;
}

function getStringFromDOMElement(id) {// funtion to get the string shader code contained within script tags in index.html not mine, its from here: https://github.com/neosavvyinc/WebGL
    var node = document.getElementById(id);

    // Recurse and get all text in the node
    var recurseThroughDOMNode = function recurseThroughDOMNode(childNode, textContext) {
        if (childNode) {
            if (childNode.nodeType === 3) {
                textContext += childNode.textContent;
            }
            return recurseThroughDOMNode(childNode.nextSibling, textContext);
        } else {
            return textContext;
        }
    };
    return recurseThroughDOMNode(node.firstChild, '');
}

function addshader(gl, program, type, src) {// function to add a sheder to the webgl object not mine, its from here: https://github.com/neosavvyinc/WebGL
    var shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw "Cannot compile shader:\n\n" + gl.getShaderInfoLog(shader) + " "+ src;
    }
    gl.attachShader(program, shader);
}

function gl_init(gl, vertexShader, fragmentShader,fragmentShader2,fragmentShader3) {// fucntion to initilize all of my webgl programs,buffers,textures, and uniforms. this function is a heavily moddified version of the function by the same name from: https://github.com/neosavvyinc/WebGL
  var program = gl.createProgram();// create path tracing program
  globalPTProgram = program
  var buffer = gl.createBuffer();
  addshader(gl, program, gl.VERTEX_SHADER, vertexShader);// add vertex shader and fragment shader to program
  addshader(gl, program, gl.FRAGMENT_SHADER, fragmentShader);
  gl.linkProgram(program);// link program to gl

  var program2 = gl.createProgram();// do the same things for the post processing program
  globalPostProProgram = program2
  addshader(gl, program2, gl.VERTEX_SHADER, vertexShader);
  addshader(gl, program2, gl.FRAGMENT_SHADER, fragmentShader2);
  gl.linkProgram(program2);

  var program3 = gl.createProgram();// and again the same for the coppy program
  globalCopyProgram = program3
  addshader(gl, program3, gl.VERTEX_SHADER, vertexShader);
  addshader(gl, program3, gl.FRAGMENT_SHADER, fragmentShader3);
  gl.linkProgram(program3);

  if (! gl.getProgramParameter(program, gl.LINK_STATUS))
      throw "Could not link the shader program!";
  gl.useProgram(program);

  // Create a square as a strip of two triangles. (screenquad)
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
          -1,1,
          0,1,
          1,0,
          -1,-1,
          0,1,
          -1,0]),
      gl.STATIC_DRAW
  );

  gl.aPosition = gl.getAttribLocation(program, "aPosition");//create references to all of my uniforms
  gl.enableVertexAttribArray(gl.aPosition);
  gl.vertexAttribPointer(gl.aPosition, 3, gl.FLOAT, false, 0, 0);
  gl.uTime = gl.getUniformLocation(program, "uTime");// time since started
  gl.uCursor = gl.getUniformLocation(program, "uCursor");// mouse position
  gl.cPos = gl.getUniformLocation(program,"cPos")// camera position
  gl.randSeed = gl.getUniformLocation(program,"randSeed")// CPU random to seed GPU random hash
  gl.thetaY =  gl.getUniformLocation(program,"thetaY")// X and Y rotation
  gl.thetaX =  gl.getUniformLocation(program,"thetaX")
  gl.map = gl.getUniformLocation(program,"map")// map array
  gl.lPos = gl.getUniformLocation(program,"lPos")// light position and colour (not currently used)
  gl.lCol = gl.getUniformLocation(program,"lCol")
  gl.megaTexture = gl.getUniformLocation(program,"megaTexture")// texture that holds all image assets needed in renderere
  gl.objects = gl.getUniformLocation(program,"objects")// not used 
  gl.nObjs = gl.getUniformLocation(program,"nObjs")
  gl.wOffset = gl.getUniformLocation(program,"weaponOffset")// weapon ofset in megatexture
  gl.lastFrame = gl.getUniformLocation(program,"lastFrame")
  
  gl.postImage = gl.getUniformLocation(program2,"image")// image after post processing
  gl.rand = gl.getUniformLocation(program2,"rand")// random seed for post processing
  gl.currentFrame =  gl.getUniformLocation(program2,"image")
  gl.screenTexutre =  gl.getUniformLocation(program2,"onelf")
  initMapArray()
  
  // create to render to screen
  const targetTextureWidth = w;// make screen texure with same size as screen.
  const targetTextureHeight = h;
  const level = 0;
  const internalFormat = gl.RGBA;
  const border = 0;
  const format = gl.RGBA;
  const type = gl.UNSIGNED_BYTE;
  const data = null;
  
  screenTexutre = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0+1)
  gl.bindTexture(gl.TEXTURE_2D, screenTexutre);

  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                targetTextureWidth, targetTextureHeight, border,
                format, type, data);

  // set the filtering so we don't need mips
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  

  targetTexture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, targetTexture);
  
  // define size and format of level 0
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                targetTextureWidth, targetTextureHeight, border,
                format, type, data);

  // set the filtering so we don't need mips
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  
  // Create and bind the framebuffer
  fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  
  // attach the texture as the first color attachment
  const attachmentPoint = gl.COLOR_ATTACHMENT0;
  gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, targetTexture, level);

  

}

function bindMapTex(gl,map){// function that binds the flattended map array data to the 3D texture in the GPU
  mapTexture = gl.createTexture();// create the 3D texture
  gl.bindTexture(gl.TEXTURE_3D, mapTexture);
  gl.texImage3D(gl.TEXTURE_3D,0,gl.RGBA,gridSizeX,gridSizeY,gridSizeZ,0,gl.RGBA,gl.UNSIGNED_BYTE,
            new Uint8Array(map));
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  mapReady = true// map is now loaded
  megaTexture = loadTexture(gl,"megatexture1.png")// setup texture object for megatexutre
}

function updateMapTex(gl, map,x,y,z,sX,sY,sZ) {// start coridnates and side lengths
  gl.bindTexture(gl.TEXTURE_3D, mapTexture);// set map texture to active texture
  gl.texSubImage3D(gl.TEXTURE_3D,0,x,y,z,sX,sY,sZ,gl.RGBA,gl.UNSIGNED_BYTE,// update it
            new Uint8Array(map));
}

function gl_update(gl) {// everything that needs to happen each frame. This is an extreamly heavily moddified version of the function with the same name from: https://github.com/neosavvyinc/WebGL
    gl.useProgram(globalPTProgram)// first we do path tracing
    gl.activeTexture(gl.TEXTURE0+1) // index of megatexture
    gl.bindTexture(gl.TEXTURE_2D, megaTexture);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);// bind frame buffer so we render to it instead of screen
    if(!texPingPong){// render to this texture one frame
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, targetTexture, 0);
      gl.activeTexture(gl.TEXTURE0+2) 
      gl.bindTexture(gl.TEXTURE_2D, screenTexutre);
    }
    else{// and this one the next
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, screenTexutre, 0);
      gl.activeTexture(gl.TEXTURE0+2) 
      gl.bindTexture(gl.TEXTURE_2D, targetTexture);
    }
    gl.uniform1f(gl.uTime, (new Date()).getTime() / 1000 - time0);// update all uniforms/ set them each frame
    gl.uniform1f(gl.randSeed,Math.random())
    gl.uniform1f(gl.wOffset,weaponOffset)
    gl.uniform1f(gl.thetaY,thetaY)// update rotation
    gl.uniform1f(gl.thetaX,thetaX)
    gl.uniform3f(gl.uCursor,0, 0, 0); 
    gl.uniform3f(gl.cPos,cPos[0],cPos[1],cPos[2]) // update camera postion
    gl.uniform3fv(gl.objects,objects)
    gl.uniform3fv(gl.lPos,lPos)
    gl.uniform3fv(gl.lCol,lCol)
    gl.uniform1i(gl.lastFrame, 2);
    gl.uniform1i(gl.megaTexture, 1);
    gl.uniform1i(gl.map, 0);
    gl.uniform1i(gl.nObjs,objects.length/3-1)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.useProgram(globalPostProProgram)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.activeTexture(gl.TEXTURE0)
    if(!texPingPong){// again switching which texture we render two each frame for temporal accumulation as WEBGL does not allow reading and writing to a texutre each frame.
      gl.bindTexture(gl.TEXTURE_2D, targetTexture);
    }
    else{
      gl.bindTexture(gl.TEXTURE_2D, screenTexutre);
    }
    gl.uniform1f(gl.rand,Math.random())
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    texPingPong = !texPingPong;// swich which texture we render to each frame 
}

var globalGl = null

function start_gl(canvas_id, vertexShader, fragmentShader,fragmentShader2,fragmentShader3) {// start webgl enviroment, not entirely mine, its a modified version from here: https://github.com/neosavvyinc/WebGL
    try {
        var canvas = document.getElementById(canvas_id);
        var gl = canvas.getContext("webgl2",{
          antialias: false,
          failIfMajorPerformanceCaveat: true,
          powerPreference : "high-performance"})
        console.log(gl)
        globalGl = gl
    } catch (e) {
        throw "Sorry, your browser does not support WebGL.";
    }


    // Initialize gl. Then start the frame loop.
    gl_init(gl, vertexShader, fragmentShader,fragmentShader2,fragmentShader3);
    gl_update(gl);
}


          
