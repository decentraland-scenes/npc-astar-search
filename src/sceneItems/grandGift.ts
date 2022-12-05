import * as utils from '@dcl/ecs-scene-utils' 
import * as ui from '@dcl/ui-scene-utils'
import { CONFIG } from 'src/config'
import { placeAtEndOfSegment } from 'src/npc-tour/tourUtils'
import { NpcAnimationNameDef } from 'src/registry'
import { RESOURCES } from 'src/resources'
import { KeepFloatingComponent } from 'src/utils/keepFloatingComponent'
import { SceneItem } from './sceneItem'


const GIFT_SHAPE=new GLTFShape('models/Loot.glb')
/*
const entityTest= new Entity()
entityTest.addComponent(GIFT_SHAPE)
entityTest.addComponent(new Transform({
  position: new Vector3(2,1,2)
}))
engine.addEntity(entityTest)*/

export class GrandGiftBox extends SceneItem {
  
  giftboxOpen: AnimationState
  giftboxIdle: AnimationState
  opened:boolean = false
  redeemable:boolean =  false;
  claimTokenReady:boolean = false
  claimInformedPending:boolean = false
  glasses: Entity 
  glassesCollider: Entity
  glassesSound: Entity
  triumphClip = new AudioClip('sounds/openBox.mp3')
  starIdleClip = new AudioClip('sounds/star-idle.mp3')
  //claimSound = new AudioClip('sounds/achievement_04.mp3')
  
  constructor(
    name: string,
    transformHiddenArgs: TransformConstructorArgs,
    transformShowArgs: TransformConstructorArgs,
    parent?: Entity
  ) {
    super(name,transformHiddenArgs,transformShowArgs,{
      shape:GIFT_SHAPE,
      //show:{name:"Loot_Spawn",duration:10}, 
      idle:{name:"Loot_Loop",duration:-1,autoStart:true},
      close:undefined
    },parent)
   
    this.giftboxOpen = this.openAnimation
    this.giftboxIdle = this.idleAnimation
    //giftBox.addComponent(new BoxShape())
    
    this.glasses = new Entity()
    this.glasses.setParent(this.entity)
    this.glasses.addComponent(new Transform({ 
      position: new Vector3(0,-6,0), 
      scale: new Vector3(4,4,4)
    }))
    
    //make glasses clickable
    let cube = this.glassesCollider = new Entity()
    cube.setParent(this.glasses)
    const smaller = .04
    cube.addComponent(new Transform({ 
      position: new Vector3(0,1.85,0), 
      scale: new Vector3(.2-smaller,.2-smaller,.2-smaller)
    }))
    cube.addComponent(new BoxShape())   
    //make visible if for some reason loot not showing
    //cube.addComponent(RESOURCES.materials.transparent)

    this.glassesSound = new Entity()
    this.glassesSound.setParent(this.glasses)

    //this.glasses.addComponent(new BoxShape())
  }

  showOpened(){
    const host = this.entity

    this.giftboxOpen.speed = 10 //get to end fast
    host.getComponent(Animator).play(this.giftboxOpen, false)

    this.redeemable = false
    this.opened = true
    debugger
    host.removeComponent(OnPointerDown)

  }
  hide(force?:boolean,duration:number=.2,returnToIdle?:boolean){

    this.redeemable = false

    super.hide(force,duration,returnToIdle)



    if(!this.visible){
      log(this.name," already hidden")
      return
    }

  }
  //override to keep level
  lookAt(vec:Vector3){
    this.entity.getComponent(Transform).lookAt(vec)
    const rot = this.entity.getComponent(Transform).rotation
    log("lookAt",rot,rot.eulerAngles)
    this.entity.getComponent(Transform).rotation = Quaternion.Euler(0,rot.eulerAngles.y,0)
  }
  show() {
    
    const host = this

    this.redeemable = true

    if(!this.visible){
      this.lookAt(Camera.instance.position)
    }
    super.show(.5);

    //if(this.entity.hasComponent( utils.KeepRotatingComponent )) this.entity.removeComponent(utils.KeepRotatingComponent)
    //if(this.entity.hasComponent( KeepFloatingComponent )) this.entity.removeComponent(KeepFloatingComponent)
    this.entity.addComponentOrReplace(new utils.KeepRotatingComponent(Quaternion.Euler(0,-8,0)))
    this.entity.addComponentOrReplace(new KeepFloatingComponent(0.05, 3, 0))

    let showWearable = false
   

    this.addOnClickClaim()
  }
  showClaimPrompt(){
    const METHOD_NAME = "showClaimPrompt"

    log(METHOD_NAME,"ENTRY","this.claimTokenReady","this.claimInformedPending",this.claimTokenReady)
    const host = this
    
    if(this.claimTokenReady){
      
      host.opened = true
    }
  
  }
  addOnClickClaim(){
    const host = this

    const pointerEnt = this.glassesCollider
    pointerEnt.addComponentOrReplace(
      
      new OnPointerDown(
        () => { 
          

          const TEST_SUCCESS = true
          //isClaimJsonSuccess() ||
          if (TEST_SUCCESS) {
            
              this.showClaimPrompt()

          }
        },
        { hoverText: 'Open',
        button: ActionButton.PRIMARY }
      )
    )
  }
}