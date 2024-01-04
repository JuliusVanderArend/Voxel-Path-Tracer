
var theta = 0
var moveSpeed = 0.09
var gameObjects = []// arrays to hold objects and enemies
var player  = new Player(-30,0,50)// make player
var fps = {	startTime : 0,	frameNumber : 0,	getFPS : function(){		this.frameNumber++;		var d = new Date().getTime(),			currentTime = ( d - this.startTime ) / 1000,			result = Math.floor( ( this.frameNumber / currentTime ) );		if( currentTime > 1 ){			this.startTime = new Date().getTime();			this.frameNumber = 0;		}		return result;	}	};// calculate frame rate (not mine, its from an fps library)


fpsArr = []// accumulate frame rate from last frames
frame=0// current frame idnex
var fpsAvg = 60// rolling avarage of fps
var uiCanvas

function setup(){// p5 setup
  frameRate(144)
  uiCanvas = createCanvas(Math.floor(window.innerHeight*16/9),window.innerHeight)
  uiCanvas.elt.onclick = function() {
    uiCanvas.elt.requestPointerLock();
  };
}



function draw(){// p5 Draw function, called each frame.
  clear();
  frame++
  mouseMoved = false;
  if(mapReady){// if the map is loaded, run the game
    theta++
    player.update()
    gl_update(globalGl);
    fpsArr.push(fps.getFPS())// calculate new fps
    if(fpsArr.length>10){
      fpsArr.shift()// maintain running avarage of framerate for last 10 frames
    }
    fpsAvg = fpsArr.reduce(function(a, b) { return a + b; }, 0)/fpsArr.length;
    tStep = 1/Math.max(fpsAvg,10)//calculate varriable timestep based on avarage frame rate
  }
  if(!mouseMoved){// if mouse dosent move, dx and dy are zero
    mouseDeltaX =0
    mouseDeltaY =0
  }
}


function disableScroll() { 
            // Get the current page scroll position 
            scrollTop =  
              window.pageYOffset || document.documentElement.scrollTop; 
            scrollLeft =  
              window.pageXOffset || document.documentElement.scrollLeft, 
  
                // if any scroll is attempted, 
                // set this to the previous value 
                window.onscroll = function() { 
                    window.scrollTo(scrollLeft, scrollTop); 
                }; 
        } 
  
        function enableScroll() { 
            window.onscroll = function() {}; 
        } 

disableScroll()


