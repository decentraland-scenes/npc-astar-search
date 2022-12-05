
import * as ui from '@dcl/ui-scene-utils'
import { CONFIG } from "src/config"
import { REGISTRY } from 'src/registry'
import { GridPosition } from './tourTypes'


let currentShowDebugInfo = new Entity()
let currentShowDebugInfoText = new TextShape('')
let debug2dUI = new ui.CornerLabel('',-250,20)  
const debug2DBG = new UIContainerRect(ui.canvas)

function formatTime(val:any){
  if(val){
    const date = new Date(val*1000)
    return date.toLocaleString()
  }
}
function formatTimeDiff(timea:any,timeb:any){
  if(timea && timeb){
    return ((timeb-timea)/60).toFixed(2) + "-min"
  }
  return "?-1?"
}

export async function loadShowTourDebugUI(){
  /*
  currentShowDebugInfo.addComponent(new Billboard(true,true,false))
  //currentShow.setParent(S1)
  
  currentShowDebugInfo.addComponent(currentShowDebugInfoText)
  currentShowDebugInfo.addComponent(
    new Transform({
      position: CONFIG.DEBUG_3D_PANEL_POSITION,
      rotation: Quaternion.Euler(0, 180, 0), 
      scale: new Vector3(2, 3, 2), 
    })
  )
*/

  let currentShowDebugInfoBG = new Entity()
  //currentShowDebugInfo.addComponent(new Billboard(true,true,false))
  //currentShow.setParent(S1)
  currentShowDebugInfoBG.addComponent(new PlaneShape())
  currentShowDebugInfoBG.addComponent(
    new Transform({
      position: new Vector3(0, 0, .1),
      rotation: Quaternion.Euler(0, 180, 0), 
      scale: new Vector3(7.5, 1, 1), 
    })
  )
  //currentShowDebugInfoBG.addComponent(RESOUR)
  currentShowDebugInfoBG.setParent(currentShowDebugInfo)

  currentShowDebugInfoText.value = 'XX'
  currentShowDebugInfoText.visible = true
  currentShowDebugInfoText.fontSize = 2  
  // currentShowText.font = new Font(Fonts.SanFrancisco_Heavy)
  currentShowDebugInfoText.textWrapping = true
  currentShowDebugInfoText.width = 9
  currentShowDebugInfoText.color = Color3.Black()
  currentShowDebugInfoText.outlineColor = Color3.White()
  currentShowDebugInfoText.outlineWidth = 0.01

  
  //const debug2d = new ui.CornerLabel
  
  debug2DBG.visible = false
  debug2DBG.positionY = -15
  debug2DBG.width = "570"
  debug2DBG.height = "100"
  debug2DBG.vAlign = 'bottom'
  debug2DBG.hAlign = 'right'
  debug2DBG.color = Color4.Gray()
  debug2DBG.opacity = 0.5
  
  debug2dUI.uiText.fontSize = 16
  //debug2dUI.uiText.b
  debug2dUI.hide()


  CONFIG.DEBUG_2D_PANEL_ENABLED = true
  debug2dUI.show()
  
}

export function updateDebugTourInfo(
  debugData:{
    astarNpcLoc:GridPosition,
    astarCurPlayerPos:GridPosition
  }){
  if(REGISTRY.tourManager === undefined){
    log("updateDebugStageInfo ERROR, REGISTRY.tourManager is null!!!")
    return;
  }

  if(!currentShowDebugInfo.alive && CONFIG.IN_PREVIEW){
    /*if(CONFIG.DEBUG_3D_PANEL_ENABLED) engine.addEntity(currentShowDebugInfo)
    if(CONFIG.DEBUG_2D_PANEL_ENABLED && !debug2dUI.uiText.visible){
      debug2DBG.visible = true
      debug2dUI.show()
    }*/
  }

  if(!CONFIG.IN_PREVIEW){
    return;
  }
 
    let text = ""
    if(
      REGISTRY.tourManager !== undefined
        ){ 
          const currDatData = REGISTRY.tourManager.getCurrentDayData()
          text += "day:"+REGISTRY.tourManager.day +";tourState:"+REGISTRY.tourManager.tourState +";triesToday:"+REGISTRY.tourManager.triesToday
          if(currDatData !== undefined){
            ";segment:"+currDatData.currSegment+";completed:"+currDatData.completed  
          }
          text  += "\n" 
            +";astarNpcLoc:"+debugData.astarNpcLoc
            +";astarCurPlayerPos:"+debugData.astarCurPlayerPos
    }else{
      //log("updateDebugStageInfo. cannot get artist data updateDebugStageInfo",validDayAndArtistId,validDays,validDayArtists) 
    }
    currentShowDebugInfoText.value = text

    if(CONFIG.DEBUG_2D_PANEL_ENABLED) debug2dUI.set(text)
  
   
  
}