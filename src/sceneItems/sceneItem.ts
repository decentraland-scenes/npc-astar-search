import * as utils from '@dcl/ecs-scene-utils' 
import * as ui from '@dcl/ui-scene-utils'
import { CONFIG } from 'src/config'
import { placeAtEndOfSegment } from 'src/npc-tour/tourUtils'
import { NpcAnimationNameDef } from 'src/registry'
import { RESOURCES } from 'src/resources'
import { KeepFloatingComponent } from 'src/utils/keepFloatingComponent'


export type SceneItemDef={
  shape:GLTFShape|Shape
  show?:NpcAnimationNameDef
  close?:NpcAnimationNameDef
  idle?:NpcAnimationNameDef
}

const VAULT = new Vector3(2,CONFIG.sizeY,2)

export class SceneItem{
  entity: Entity
  name:string
  transformHidden: Transform
  transformVisible: Transform
  lastKnownPos!:Vector3
  visible:boolean = false
  itemDef:SceneItemDef

  endAnimTimer: Entity
  intervalAnimTimer: Entity

  //public idleAnim: AnimationState | null = null
  public lastPlayedAnim: AnimationState | null = null

  openAnimation!:AnimationState
  idleAnimation!:AnimationState
  closeAnimation!:AnimationState

  shapeHolder:Entity
  debugHolder:Entity

  constructor(
    name: string,
    transformHiddenArgs: TransformConstructorArgs,
    transformShowArgs: TransformConstructorArgs,
    itemDef:SceneItemDef,
    parent?: Entity
  ) {
    this.entity = new Entity(name)
    this.itemDef = itemDef
    //if (parent !== null && parent !== undefined) this.setParent(parent)
    this.name = name

    if (parent !== null && parent !== undefined) this.entity.setParent(parent)

    this.transformHidden = new Transform(transformHiddenArgs)
    this.transformVisible = new Transform(transformShowArgs)

    this.entity.addComponentOrReplace(new Transform({
      position: transformHiddenArgs.position?.clone(),
      scale: transformHiddenArgs.scale?.clone()
    }))

    this.endAnimTimer = new Entity()
    engine.addEntity(this.endAnimTimer)

    this.intervalAnimTimer = new Entity() 
    engine.addEntity(this.intervalAnimTimer)

    const shapeHolder = this.shapeHolder =  new Entity(this.name+"."+"shape");
    shapeHolder.addComponent(new Transform({
      position: Vector3.Zero()
    }))
    shapeHolder.setParent(this.entity)

    const debugHolder = this.debugHolder =  new Entity(this.name+"."+"debug");
    debugHolder.addComponent(new Transform({
      position: new Vector3(0,1,0)
    }))
    if(CONFIG.DEBUG_2D_PANEL_ENABLED){//switch to 3d flag if exists?2d vs 3d debug flags
      const debugTextShape = new TextShape(this.name)
      debugTextShape.fontSize = 10
      debugHolder.addComponent(debugTextShape)
      debugHolder.setParent(this.entity)
    }

    if(this.itemDef.shape !== undefined){
      shapeHolder.addComponent(this.itemDef.shape); 

      const animator = new Animator()

      if(this.itemDef.idle !== undefined){
        const idleAnim = (this.idleAnimation = new AnimationState(this.itemDef.idle.name))
        
        idleAnim.stop()
        
        this.shapeHolder.addComponent(animator).addClip(idleAnim)
      }


      if(this.itemDef.show !== undefined){
        const openAnim = (this.openAnimation = new AnimationState(this.itemDef.show.name))
        openAnim.stop()
        
        openAnim.looping = false
        animator.addClip(openAnim)

        if(this.itemDef.show.autoStart !== undefined && this.itemDef.show.autoStart == true){
          this.shapeHolder.getComponent(Animator).play(openAnim)
          openAnim.play()
          openAnim.stop()
        } 
      }

      if(this.itemDef.close !== undefined){
        const closeAnim = (this.closeAnimation = new AnimationState(this.itemDef.close.name))
        closeAnim.stop()
        closeAnim.looping = false

        animator.addClip(closeAnim)
      }
      
      //this.entity.addComponent(this.itemDef.shape)
      
      if(this.itemDef.idle !== undefined && this.itemDef.idle.autoStart !== undefined && this.itemDef.idle.autoStart == true){
        this.shapeHolder.getComponent(Animator).play(this.idleAnimation)
      } 

      engine.addEntity(this.entity)
    }

  }

  placeAtEndOfSegment(pos:Vector3) {
    const thisTransform = this.entity.getComponent(Transform)
    log("showAnimation.placeAtEndOfSegment from",thisTransform.position,"to",pos)
    const oldHeight = thisTransform.position.y
    thisTransform.position = pos.clone()
    thisTransform.position.y = oldHeight
  
    const vY = this.transformVisible.position.y
    const hY = this.transformHidden.position.y

    this.transformVisible.position = pos.clone()
    this.transformHidden.position = pos.clone()

    this.transformVisible.position.y = vY
    this.transformHidden.position.y = hY

    this.lastKnownPos = thisTransform.position.clone() 
  }

  lookAt(vec:Vector3){
    this.entity.getComponent(Transform).lookAt(vec)
  }

  show(duration:number=1,onOpen?:()=>void){
    //log("play.show",this.entity.getComponent(Transform).position)
    if(this.visible){
      //log(this.name," already visible","transform",this.entity.getComponent(Transform),"alive",this.entity.alive,"visible",this.shapeHolder.getComponent(GLTFShape).visible)
      return
    }

    if(!this.entity.alive) engine.addEntity(this.entity)
    
    this.visible = true
    
    log(this.name,"show.called",this.transformHidden.scale,
      this.transformVisible.scale,
      duration,)

    this.showAnimation(duration,onOpen)

  }


  playIdleAnimation() {
    log("play.playIdleAnimation")
    // if (this.lastPlayedAnim) {
    //   this.lastPlayedAnim.stop()
    // } 

    if(!this.entity.alive) engine.addEntity(this.entity)

    if (this.openAnimation !== undefined) {
        this.openAnimation.stop()
    }
    if (this.idleAnimation !== undefined) {
      this.idleAnimation.play()
      this.lastPlayedAnim = this.idleAnimation
    }
    log("play.playIdleAnimation",this.entity.getComponent(Transform).position)
  }

  showAnimation(duration:number=1,onOpen?:()=>void){
    if(this.openAnimation === undefined){
      if(this.lastKnownPos !== undefined) this.entity.getComponent(Transform).position.copyFrom(this.lastKnownPos)
      const thisTransform = this.entity.getComponent(Transform)
      log("showAnimation starting from",thisTransform.position,"to",this.transformVisible.position)
      this.entity.addComponentOrReplace(
        new utils.ScaleTransformComponent(
          thisTransform.scale,
          this.transformVisible.scale,
          duration,
          () => {}
          ,utils.InterpolationType.EASEOUTEXPO
          //,utils.InterpolationType.EASEOUTSINE
        )
        
      )
      this.entity.addComponentOrReplace(
        new utils.MoveTransformComponent(
          thisTransform.position,
          this.transformVisible.position,
          duration,
          () => {}
          ,utils.InterpolationType.EASEOUTEBOUNCE
        )
      )
    }else{
      if(this.itemDef.show !== undefined){
        this.playAnimation( this.itemDef.show.name,true,this.itemDef.show.duration,undefined,undefined,true )
      }else{ 
        //this.openAnimation.reset()
        //engine.removeEntity(this.entity)
      }
      
      
    }
  }


  /**
   * 
   * @param animationName 
   * @param noLoop 
   * @param duration 
   * @param speed 
   * @param interval 
   * @param resetAnim (optional; defaults:true) resets the animation before playing. if it was paused dont reset 
   *  makes sense to  only finish out the animation if anim loop=false and did not get to the end before next play 
   *  it will only finish  out the rest of the loop which could be .01 seconds or 5 seconds
   */
   playAnimation(
    animationName: string,
    noLoop?: boolean,
    duration?: number,
    speed?: number,
    interval?: number,
    resetAnim?: boolean,
    layer?:number,
    returnToIdle?:boolean,
    onDurationEnd?:()=>void
  ) {
    log(this.name,"play.playAnimation called","animationName",animationName,"noLoop",noLoop,"duration",duration,"resetAnim",resetAnim,"returnToIdle",returnToIdle)
    // if (this.lastPlayedAnim) {
    //   this.lastPlayedAnim.stop()
    // }

    if (this.endAnimTimer.hasComponent(utils.Delay)) {
      this.endAnimTimer.removeComponent(utils.Delay)
    }

    if (this.intervalAnimTimer.hasComponent(utils.Interval)) { 
      this.intervalAnimTimer.removeComponent(utils.Interval)
    }

    if (this.shapeHolder.hasComponent(GLTFShape) && this.shapeHolder.getComponent(GLTFShape).visible) {
      this.shapeHolder.getComponent(GLTFShape).visible = true
    }else if(!this.shapeHolder.hasComponent(GLTFShape)){
      log(this.name,"play.playAnimation WARN","has no GLTFShape","noLoop",noLoop,"duration",duration,"resetAnim",resetAnim)
    }

    const animator = this.shapeHolder.getComponent(Animator)
    
    let newAnim = animator.getClip(animationName)
    if(layer) newAnim.layer = layer 

    //log("resetting ",newAnim)
    const resetAnimation = resetAnim === undefined || resetAnim
    if(resetAnimation){
      //log("resetting ",newAnim)
      newAnim.reset()
    }

    if (speed) {
      newAnim.speed = speed
    } else {
      newAnim.speed = 1
    }  
    
    if (noLoop) {
      newAnim.looping = false
    }else{
      newAnim.looping = true
    }
    if(noLoop){
      if (interval && duration) {
        playOnceAndIdle(this, newAnim, duration,resetAnimation,returnToIdle,onDurationEnd) 
        this.intervalAnimTimer.addComponentOrReplace(
          new utils.Interval(interval * 1000, () => {
            playOnceAndIdle(this, newAnim, duration,undefined,returnToIdle,onDurationEnd)
          })
        )
      } else if (duration) {
        // play once & idle
        playOnceAndIdle(this, newAnim, duration,resetAnimation,returnToIdle,onDurationEnd) 
      } else {
        // play once and stay on last frame
        newAnim.looping = false
        //log("playAnimation playing and not calling reset ",newAnim)
        newAnim.play(resetAnimation)
        this.lastPlayedAnim = newAnim
      }
    } else {
      newAnim.looping = true
      
      //   newAnim.stop()
      //log("playing with reset ",newAnim)
      newAnim.play(resetAnimation)

      handlePlayDuration(this,newAnim,duration,returnToIdle,onDurationEnd)

      this.lastPlayedAnim = newAnim
      
    }
  }
  

  /**
   * 
   * @param ent 
   * @param anim 
   * @param duration 
   * @param resetAnim (optional; defaults:true)  resets the animation before playing. if it was paused dont reset makes sense to 
   *  only finish out the animation if anim loop=false and did not get to the end before next play it will only finish 
   *  out the rest of the loop which could be .01 seconds or 5 seconds
   */
  
  hide(force?:boolean,duration:number=1,returnToIdle?:boolean,onClose?:()=>void){
    log(this.name," hide ENTRY")
    const _force = force === undefined || (force !== undefined && force == true)
    if(!_force && !this.visible){
      log(this.name," already hidden")
      return 
    }
    
    this.visible = false

    this.hideAnimation(duration,returnToIdle,onClose)
  }

  hideAnimation(duration:number=1,returnToIdle?:boolean,onClose?:()=>void){
    log(this.name," hideAnimation ENTRY")
    
    this.lastKnownPos = this.entity.getComponent(Transform).position.clone()
    if(this.openAnimation === undefined){
      const thisTransform = this.entity.getComponent(Transform)
      this.entity.addComponentOrReplace(
        new utils.ScaleTransformComponent(
          thisTransform.scale,
          this.transformHidden.scale,
          duration,
          () => {
            if(onClose !==undefined) onClose()
          }
          //,utils.InterpolationType.EASEINQUAD
          ,utils.InterpolationType.EASEINEXPO
        )
      )
      this.entity.addComponentOrReplace(
        new utils.MoveTransformComponent(
          thisTransform.position,
          this.transformHidden.position,
          duration,
          () => {
            log("reached",this.transformHidden.position) 
            //this.shapeHolder.getComponent(Transform).position.y = -1
            //broke portals
            //this.entity.getComponent(Transform).position.copyFrom(VAULT)//cannot make negative, so move far away
          }
          
        )
      )
    }else{
      if(this.itemDef.close !== undefined){
        log("hideAnimation.closeWrapper.this.openAnimation.reset()")
        this.openAnimation.reset()
        //this.closeAnimation.reset()
        
        const animator = this.shapeHolder.getComponent(Animator)
    
        let newAnim = animator.getClip(this.itemDef.close.name)
        if(!newAnim.playing && (this.lastPlayedAnim=== undefined || this.lastPlayedAnim !== newAnim ) ){
          log(this.name," hideAnimation.play",this.itemDef.close.name,this.lastPlayedAnim?.clip)
          this.playAnimation( this.itemDef.close.name,true,this.itemDef.close.duration,undefined,undefined,true,undefined,returnToIdle,onClose )
        }else{
          log(this.name," hideAnimation.play.already.playing",this.itemDef.close.name,this.lastPlayedAnim?.clip)
        }
      }else{ 
        if(this.openAnimation !== undefined){
          this.openAnimation.reset()
          this.openAnimation.stop()
        }
        //engine.removeEntity(this.entity)
      }
    }
  }
}

function playOnceAndIdle(
  ent: SceneItem,
  anim: AnimationState,
  duration: number,
  resetAnim?: boolean ,
  returnToIdle?:boolean,
  onDurationEnd?:()=>void
) {
  //   if (ent.lastPlayedAnim) {
  //     ent.lastPlayedAnim.stop()
  //   }

  //anim.looping = false
  log("play.playOnceAndIdle called ",anim) 
  if(resetAnim) anim.reset()
  anim.play(resetAnim)
  ent.lastPlayedAnim = anim
  handlePlayDuration(ent,anim,duration,returnToIdle,onDurationEnd)
} 


function handlePlayDuration(ent: SceneItem,anim: AnimationState,duration?:number,returnToIdle?:boolean,onDurationEnd?:()=>void){
  log("play.handlePlayDuration called ",anim) 
  if (duration) {
    ent.endAnimTimer.addComponentOrReplace(
      new utils.Delay(duration * 1000, () => {
        // if (ent.lastPlayedAnim) {
        //   ent.lastPlayedAnim.stop()
        // }
        //just stop it from playing
        anim.playing = false //do not call stop as it resets the animation, let on play do that if they want it
        if(onDurationEnd !== undefined) onDurationEnd()
        if ((returnToIdle === undefined || (returnToIdle !== undefined && returnToIdle === true))&&ent.idleAnimation) {
          ent.idleAnimation.play()
          ent.lastPlayedAnim = ent.idleAnimation
        }
      })
    )
  }
}
