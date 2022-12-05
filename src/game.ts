import * as ui from '@dcl/ui-scene-utils'
import * as utils from '@dcl/ecs-scene-utils'
import { isPreviewMode } from '@decentraland/EnvironmentAPI'
import { CONFIG, initConfig } from "./config"

import { initDialogs } from './npc-tour/npcDialog'
import { setupNPC } from './npc-tour/npcSetup'
import { createDebugUIButtons } from './ui/ui-hud-debugger'
import { loadShowTourDebugUI } from './npc-tour/debugUI'
import { initRegistry, REGISTRY } from './registry'
import { initAstarGrids, setupTour } from './npc-tour/tourSetup'
 
initConfig() 
const basePosition = new Vector3(CONFIG.sizeX/2 - 6*16,0,CONFIG.sizeZ/2)// CONFIG.centerGround.clone()////.add(new Vector3(16,.5,16))//new Vector3(16*11 ,0,16*11)//

async function init(){
  log("init called")

  
  // create the entity
  const baseScene = new Entity()
  const sizeUpScale = Vector3.One() //new Vector3(1,.05,1) //Vector3.One() 
  // add a transform to the entity
  baseScene.addComponent(new Transform({ 
    position: basePosition,
    scale: sizeUpScale,//.scale(.01),
    rotation: Quaternion.Euler(0,180,0)
  })) 
       
  /*baseScene.addComponent(new utils.Delay(200,()=>{
    baseScene.getComponent(Transform).scale = sizeUpScale
    baseScene.addComponentOrReplace(new utils.ScaleTransformComponent(sizeUpScale,Vector3.One(),1))
    
  }))*/
  // add a shape to the entity
  
  // add the entity to the engine
  engine.addEntity(baseScene)

  //baseScene.addComponent(baseShape)
  
   
  /*
  const baseSceneEmpty = new Entity()
  // add a transform to the entity
  baseSceneEmpty.addComponent(new Transform({ 
    position: baseEmptyPosition,
    scale: Vector3.One().scale(1),//.scale(.01),
    rotation: Quaternion.Euler(0,180,0)
  })) 
   
  baseSceneEmpty.addComponent(new utils.Delay(100,()=>{
    baseSceneEmpty.getComponent(Transform).scale = Vector3.One()
  }))
  // add a shape to the entity
  baseSceneEmpty.addComponent(baseShapeEmpty)
  // add the entity to the engine
  engine.addEntity(baseSceneEmpty)*/


  initRegistry() 
  setupNPC()  
  initDialogs()
  
  
  //async this
  executeTask(async () => {

    loadShowTourDebugUI()

    try{
      createDebugUIButtons()
    }catch(e){
      log("createDebugUIButtons failed!!!",e)
    }


    initAstarGrids()
    await setupTour()

  } )

}


init()



