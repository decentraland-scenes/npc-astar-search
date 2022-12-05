import * as ui from '@dcl/ui-scene-utils'

import * as utils from '@dcl/ecs-scene-utils'
//import { REGISTRY } from 'src/registry'
import { CONFIG } from 'src/config'
import { REGISTRY } from 'src/registry'
import { movePlayerTo } from '@decentraland/RestrictedActions'
import { TourState } from 'src/npc-tour/tourTypes'
import { startDay } from 'src/npc-tour/tourSetup'



const textFont = new Font(Fonts.SansSerif)
 
const canvas = ui.canvas


const buttonPosSTART = -350
let buttonPosCounter = buttonPosSTART
let buttonPosY = -30 //350
const buttomWidth = 121
const changeButtomWidth = 120
const changeButtomHeight = 16
 
 

function updateDebugButtonUI(testButton:ui.CustomPromptButton){
  if(changeButtomWidth>0) testButton.image.width = changeButtomWidth
  if(changeButtomHeight>0) testButton.image.height = changeButtomHeight
  testButton.label.fontSize -= 5
}
function boolShortNameOnOff(val:boolean){
  if(val) return "On"
  return "Off"
}
export async function createDebugUIButtons(){
  if(!CONFIG.TEST_CONTROLS_ENABLE ){ 
    log("debug buttons DISABLED")
    return
  }
  log("debug buttons")


  const myNPC = REGISTRY.myNPC
  if(!myNPC) throw new Error("myNPC not initlalized")

  let testButton:ui.CustomPromptButton|null = null
  
  const testControlsToggle = new ui.CustomPrompt(ui.PromptStyles.DARKLARGE,1,1)
  
  
  testControlsToggle.background.positionY = 350
  //testControls.background.visible = false
  testControlsToggle.closeIcon.visible = false
  //testControls.addText('Who should get a gift?', 0, 280, Color4.Red(), 30)
  //const pickBoxText:ui.CustomPromptText = testControls.addText("_It's an important decision_", 0, 260)  
   
  
  const enableDisableToggle = testButton = testControlsToggle.addButton(
    'show:true',
    buttonPosCounter,
    buttonPosY,
    () => { 
      log("enableDisableToggle " + testControls.background.visible)
      if(testControls.background.visible){
        testControls.hide()
        testControls.closeIcon.visible = testControls.background.visible
      }else{
        testControls.show()
        testControls.closeIcon.visible = testControls.background.visible
      }
      enableDisableToggle.label.value='show:'+!testControls.background.visible
    }, 
    ui.ButtonStyles.RED
  )
  if(changeButtomWidth>0) testButton.image.width = changeButtomWidth
  if(changeButtomHeight>0) testButton.image.height = changeButtomHeight
  
  buttonPosCounter += buttomWidth
    
    
  
  const testControls = new ui.CustomPrompt(ui.PromptStyles.DARKLARGE,1,1)
  
  //testControls.hide()
  
  testControls.background.positionY = 350  
  //testControls.background.visible = false
  testControls.closeIcon.visible = false
  //testControls.addText('Who should get a gift?', 0, 280, Color4.Red(), 30)
  //const pickBoxText:ui.CustomPromptText = testControls.addText("_It's an important decision_", 0, 260)  
  
  testControls.background.positionY = 350
  //testControls.background.visible = false
  testControls.closeIcon.visible = false
  //testControls.addText('Who should get a gift?', 0, 280, Color4.Red(), 30)
  //const pickBoxText:ui.CustomPromptText = testControls.addText("_It's an important decision_", 0, 260)  
  

  //type TourState = 'not-init'|'tour-not-ready'|'tour-npc-waiting'|'find-to-ask'|'ask-tour'|'touring'|'tour-completed'|'tour-declined'

  
  testButton = testControls.addButton(
    TourState.TOUR_OFF,
    buttonPosCounter,
    buttonPosY,
    () => { 
      REGISTRY.tourManager.setTourState(TourState.TOUR_OFF)
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)
  buttonPosCounter += buttomWidth //next column

  testButton = testControls.addButton(
    TourState.PLAYER_FIND_NPC,
    buttonPosCounter,
    buttonPosY,
    () => { 
      REGISTRY.tourManager.setTourState(TourState.PLAYER_FIND_NPC)
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)
  buttonPosCounter += buttomWidth //next column

  testButton = testControls.addButton(
    TourState.NPC_FIND_PLAYER_TO_START,
    buttonPosCounter,
    buttonPosY,
    () => { 
      REGISTRY.tourManager.setTourState(TourState.NPC_FIND_PLAYER_TO_START)
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)
  buttonPosCounter += buttomWidth //next column


  testButton = testControls.addButton(
    TourState.NPC_ASK_TOUR,
    buttonPosCounter,
    buttonPosY,
    () => { 
      REGISTRY.tourManager.setTourState(TourState.NPC_ASK_TOUR)
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)
  buttonPosCounter += buttomWidth //next column


  testButton = testControls.addButton(
    TourState.NPC_ASK_TOUR_ACCEPT,
    buttonPosCounter,
    buttonPosY,
    () => { 
      REGISTRY.tourManager.setTourState(TourState.NPC_ASK_TOUR_ACCEPT)
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)
  buttonPosCounter += buttomWidth //next column


  //NEW ROW//NEW ROW
  buttonPosY -= changeButtomHeight + 2;
  buttonPosCounter = buttonPosSTART;

  testButton = testControls.addButton(
    "G:SHOW",
    buttonPosCounter,
    buttonPosY,
    () => { 
      REGISTRY.GIFT.show()
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)
  buttonPosCounter += buttomWidth //next column


  testButton = testControls.addButton(
    "G:IDLE",
    buttonPosCounter,
    buttonPosY,
    () => { 
      REGISTRY.GIFT.playIdleAnimation()
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)
  buttonPosCounter += buttomWidth //next column


  testButton = testControls.addButton(
    "G:HIDE",
    buttonPosCounter,
    buttonPosY,
    () => { 
      REGISTRY.GIFT.hide()
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)
  buttonPosCounter += buttomWidth //next column
  testButton = testControls.addButton(
    "P:SHOW",
    buttonPosCounter,
    buttonPosY,
    () => { 
      REGISTRY.tourManager.getCurrentDayEndSegmentPortal().show()
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)
  buttonPosCounter += buttomWidth //next column

  testButton = testControls.addButton(
    "P:HIDE",
    buttonPosCounter,
    buttonPosY,
    () => { 
      REGISTRY.tourManager.getCurrentDayEndSegmentPortal().hide()
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)
  buttonPosCounter += buttomWidth //next column


  testButton = testControls.addButton(
    "P:T:SHOW",
    buttonPosCounter,
    buttonPosY,
    () => { 
      REGISTRY.tourManager.getCurrentDayEndSegmentPortal().enablePlayerCanEnter()
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)
  buttonPosCounter += buttomWidth //next column

  testButton = testControls.addButton(
    "P:T:HIDE",
    buttonPosCounter,
    buttonPosY,
    () => { 
      REGISTRY.tourManager.getCurrentDayEndSegmentPortal().disablePlayerCanEnter()
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)
  buttonPosCounter += buttomWidth //next column


  //NEW ROW//NEW ROW
  buttonPosY -= changeButtomHeight + 2;
  buttonPosCounter = buttonPosSTART;

  testButton = testControls.addButton(
    "Day_0",
    buttonPosCounter,
    buttonPosY,
    () => { 
      startDay( 0 )
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)
  buttonPosCounter += buttomWidth //next column


  testButton = testControls.addButton(
    "Day_1",
    buttonPosCounter,
    buttonPosY,
    () => { 
      startDay( 1 )
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)
  buttonPosCounter += buttomWidth //next column
  //

  testButton = testControls.addButton(
    "G:Summon",
    buttonPosCounter,
    buttonPosY,
    () => { 
      const playerPosAbs = Camera.instance.position
      REGISTRY.GIFT.placeAtEndOfSegment( playerPosAbs )
      REGISTRY.GIFT.show()
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)
  buttonPosCounter += buttomWidth //next column
  //


  //NEW ROW//NEW ROW
  buttonPosY -= changeButtomHeight + 2;
  buttonPosCounter = buttonPosSTART;

  testButton = testControls.addButton(
    "MV:To NPC",
    buttonPosCounter,
    buttonPosY,
    () => { 
      REGISTRY.tourManager.moveToNPC()
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)
  buttonPosCounter += buttomWidth //next column

  testButton = testControls.addButton(
    "MV:To Origin",
    buttonPosCounter,
    buttonPosY,
    () => { 
      REGISTRY.tourManager.moveToOrigin()
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)
  buttonPosCounter += buttomWidth //next column

} 
 
