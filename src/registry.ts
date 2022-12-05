import { NPC } from "@dcl/npc-scene-utils"
import { Dialog } from '@dcl/npc-scene-utils'
import { LeavingQuestAreaUI } from "./npc-tour/leavingTourUI"
import { ITourManager } from "./npc-tour/tourManagerInterface"
import { GrandGiftBox } from "./sceneItems/grandGift"


export type NpcAnimationNameDef = {
  name:string
  duration:number
  autoStart?:boolean
}
export type NpcAnimationNameType = {
  IDLE: NpcAnimationNameDef
  WALK: NpcAnimationNameDef
  RUN: NpcAnimationNameDef
  WAVE: NpcAnimationNameDef
  HEART_WITH_HANDS: NpcAnimationNameDef
  COME_ON: NpcAnimationNameDef
}

export class Registry{
  myNPC!:NPC
  bannerEntity!:Entity
  tourManager!:ITourManager
  leavingQuestAreaUI!:LeavingQuestAreaUI
  GIFT!:GrandGiftBox

  //TODO manage better
  debugCubeEnt:Entity[]=[]
  crumbCubeEnt:Entity[]=[]

  npcAnimations!:NpcAnimationNameType
  WhiteRabbitDialog!: Dialog[]
  dialogKeepUpDialogIds!:string[]
  dialogSideCommentaryDialogIds!:string[]
  dialogSideCommentaryDialogIdsPostTourComplete!:string[]

}

export const REGISTRY = new Registry()

export function initRegistry(){
  
}