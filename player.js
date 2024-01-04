var frame = 0

class Player{
  constructor(x,y,z){
    this.x = x// current coords
    this.y = y
    this.z = z
    this.vY = 0.0// current velocity
    this.vX =0.0
    this.vZ =0.0
    this.moveSpeed = 0.8// slow/ fast move speed
    this.fMoveSpeed = 2.0
    this.cMoveSpeed = this.moveSpeed// current move speed (either slow or fast)
    this.jumpflag = false // true when in proccess of jumping
    this.camBounce = 0; // used to controll camera amination effect
    this.yVelMul = 1.0 // used to controll jump
    this.weaponIndex = 0;// curent selected weapon index
    this.cBounceSpeed = 0.25; // speed of camera animation
    this.camFramesToShake = 0;// varraibles to facilitate camera shake
    this.camShake = [0,0,0]
    this.health =100
    this.grounded = false
  }

  checkIntersects(){//only bother checking Y intersection with feet (bottom voxel)
    if(mapArr[4.0*index(Math.floor(this.x)+128,Math.floor(this.y+this.vY*tStep)+2,Math.floor(this.z)+128)+3] !=0 ){ //check collision in y direction
      this.vY = 0
      this.grounded=true
    }
    else{
      this.grounded=false
    }
    for(var i=0;i<8;i++){// loop over player height (6 voxels)
      if(mapArr[4.0*index(Math.floor(this.x+this.vX*tStep)+128,Math.floor(this.y)+2+i,Math.floor(this.z)+128)+3] !=0 ){// check collisions in X direction
        if(false){//i==0){
          this.y++
        }
        else{
          this.vX = 0
        }
        //this.y++
      }
    }
    for(var i=0;i<8;i++){// loop over player height (6 voxels)
      if(mapArr[4.0*index(Math.floor(this.x)+128,Math.floor(this.y)+2+i,Math.floor(this.z+this.vZ*tStep)+128)+3] !=0 ){// check collisions in Z direction
        if(false){//i==0){
          this.y++
        }
        else{
          this.vZ = 0
        }
      }
    }
  }

  takeDamage(){
    for(var gameObject of gameObjects){
      //console.log(gameObject.tag)
      if(gameObject instanceof Projectile && gameObject.tag=="enemyProjectile"){
        //console.log(gameObject)
        if(Math.pow(this.x-gameObject.x,2.0)+Math.pow(this.y-gameObject.y,2.0)+Math.pow(this.z-gameObject.z,2.0)<89){
          this.health-=100*tStep
          if(Math.random()>0.9){
            playerdamagesound.currentTime =0.0
            playerdamagesound.play()
          }
        }
      }
    }
  }
  update(){
    frame++
    weaponOffset = this.weaponIndex/16 + Math.sin(this.camBounce*0.5)*0.0005

    this.vY -= 9.8*tStep
    if(keyIsDown(87)){// do player movement for wasd key presses
      this.camBounce-=this.cBounceSpeed
      this.vZ -=this.cMoveSpeed*cos(-thetaY)
      this.vX -=this.cMoveSpeed*sin(-thetaY)
    }
    if(keyIsDown(83)){
      this.camBounce+=this.cBounceSpeed
      this.vZ +=this.cMoveSpeed*cos(-thetaY)
      this.vX +=this.cMoveSpeed*sin(-thetaY)
    }
    if(keyIsDown(68)){
      this.camBounce+=this.cBounceSpeed
      this.vZ +=this.cMoveSpeed*cos(-thetaY+1.5708)
      this.vX +=this.cMoveSpeed*sin(-thetaY+1.5708)
    }
    if(keyIsDown(65)){
      this.camBounce-=this.cBounceSpeed
      this.vZ -=this.cMoveSpeed*cos(-thetaY+1.5708)
      this.vX -=this.cMoveSpeed*sin(-thetaY+1.5708)
    }
    thetaY+=mouseDeltaX*tStep*0.4;// update camera rotation
    thetaX+=mouseDeltaY*tStep*0.4;
    if(keyIsDown(32) && !this.jumpflag){// jump
      this.vY += 40.0 
      this.yVelMul = 0.55
      this.jumpflag=true
    }
    else if(!keyIsDown(32)){
      this.jumpflag = false
    }
    if(keyIsDown(16)){// sprint
      this.cMoveSpeed = this.fMoveSpeed
      this.cBounceSpeed = 0.3
    }
    else{
      this.cMoveSpeed = this.moveSpeed
      this.cBounceSpeed =0.2
    }

    this.checkIntersects()// do map intersection
    this.x += this.vX*tStep// euler integration of position
    this.y += this.vY*tStep
    this.z += this.vZ*tStep
    this.vX*=0.95*Math.max(1-tStep,0.1)// damp velocity
    this.vZ*=0.95*Math.max(1-tStep,0.1)
    this.vY*=this.yVelMul
    this.yVelMul+=0.1
    this.yVelMul = Math.min(this.yVelMul,1.0)
    cPos = [this.x+this.camShake[0],this.y+Math.sin(this.camBounce)*0.1+0.1-0+this.camShake[1],this.z+this.camShake[2]]// set camera posion for renderer
  }
}