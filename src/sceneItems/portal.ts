import * as utils from '@dcl/ecs-scene-utils'
import { CONFIG } from 'src/config';

import { SceneItem, SceneItemDef } from './sceneItem';

export class Portal extends SceneItem{
  //entity:Entity
  static defaultCloseSpeedSeconds:number = .2
  playerCanEnter:boolean=false
  
  triggerBox = new utils.TriggerBoxShape( 
    new Vector3(2,5,2)
   )

  
  constructor(name:string,portalDef:SceneItemDef){
    
    const visible = {
      //position: new Vector3(55.03883743286133, .465, 32.57284927368164),//centred but close to street
      //position: new Vector3(50.5, .65, 36.57284927368164),//centred closer to tree
      position: new Vector3(9,0,2), //in front of elf
      //rotation: new Quaternion(0, 0, 0, 1),//tree
      rotation: Quaternion.Euler(0,0,0),//elf
      scale: new Vector3(1,1,1),
    }

    const hidden = {
      //position: new Vector3(55.03883743286133, .465, 32.57284927368164),//centred but close to street
      //position: new Vector3(50.5, 0, 36.57284927368164),//centred closer to tree
      position: new Vector3(9 , 0 , 2), //in front of elf
      //rotation: new Quaternion(0, 0, 0, 1),//tree
      rotation: Quaternion.Euler(0,0,0),//elf 
      scale: Vector3.One()
      //scale: new Vector3(.01, .01, .01)
    } 
    super(name,hidden,visible,portalDef)
    
  }
  enablePlayerCanEnter(callback?:()=>void){
    log(this.name,"enablePlayerCanEnter")
    if(this.playerCanEnter){
      log(this.name,"this.playerCanEnter already set")
      return;
    }
    this.playerCanEnter = true
 
    const host = this
 
    if(this.entity.hasComponent(utils.TriggerComponent)){
      log(this.name,"enablePlayerCanEnter","already has component")
      this.entity.getComponent(utils.TriggerComponent).enabled = true
    }else{
      log(this.name,"enablePlayerCanEnter","adding component",this.entity.getComponent(Transform).position,this.entity.hasComponent(utils.TriggerComponent),this.entity.alive,this.entity.uuid)
      //this.entity.addComponentOrReplace(new SphereShape())
      this.entity.addComponentOrReplace(
        new utils.TriggerComponent(
          this.triggerBox, //shape
          { 
            onCameraEnter : () => {
              log(host.name,'triggered!',"playerCanEnter",host.playerCanEnter,host.entity.uuid)
              if(host.playerCanEnter){
                if(callback!==undefined) callback() 
              }else{
                log(host.name,'triggered! not enabled')
              }
            },
            enableDebug: CONFIG.DEBUG_PORTAL_TRIGGER_ENABLED
          }
        )
      )
      log(this.name,"enablePlayerCanEnter","post add component",this.entity.hasComponent(utils.TriggerComponent),this.entity.alive,this.entity.getComponent(utils.TriggerComponent).enabled,this.entity.uuid)
    }
  }
  disablePlayerCanEnter(){
    if(!this.playerCanEnter){
      log(this.name,"this.playerCanEnter already disabled")
      return;
    }
    this.playerCanEnter = false

    if(this.entity.hasComponent(utils.TriggerComponent)){
      //bugs all around
      this.entity.getComponent(utils.TriggerComponent).enabled = false
      //bug cannot add to entity again :( wont trigger ???
      //this.entity.removeComponent(utils.TriggerComponent)//will let enabled/disabled work for now
    }
  }
  hide(force?:boolean,duration?:number,returnToIdle?:boolean,onClose?:()=>void){
    log(this.name,"hide")
    const closeWrapper = ()=>{
      log("closeWrapper called")
        if(onClose) onClose() 
        //if(this.entity.hasComponent(GLTFShape))this.entity.getComponent(GLTFShape).visible = false
        //if(this.entity.alive) engine.removeEntity(this.entity)
    }
    super.hide(force,duration,false,closeWrapper)
  }
  close(force?:boolean,duration?:number,returnToIdle?:boolean,onClose?:()=>void){
    log(this.name,"vanish.close")
    //debugger
    this.hide(force,duration,returnToIdle,onClose)
    this.disablePlayerCanEnter()
    //close portal
    
    /*this.entity.addComponentOrReplace(
      new utils.ScaleTransformComponent( this.entity.getComponent(Transform).scale,Vector3.Zero(),duration,()=>{
        if(onPortalCloseCallback!==undefined) onPortalCloseCallback()
      } )
    )*/
  }

 
  showAtEndOfSegment(pos:Vector3) {
    log(this.name,"showAtEndOfSegment",this.entity.getComponent(Transform).position)
    this.placeAtEndOfSegment(pos)
    this.show()
  }
  showAtStartOfSegment(pos:Vector3) {
    log(this.name,"showAtStartOfSegment",this.entity.getComponent(Transform).position)
    this.placeAtEndOfSegment(pos)
    this.show()
  }
}