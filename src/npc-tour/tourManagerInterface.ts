import * as utils from '@dcl/ecs-scene-utils'
import * as npc from '@dcl/npc-scene-utils'
import * as ui from '@dcl/ui-scene-utils'
import { Portal } from 'src/sceneItems/portal'
import { AstarResult } from './astarUtils'
import { DayPathData, GridPosition, TourState, VanishInPortalParams } from './tourTypes'


  
export interface ITourManager{
  
  triesToday:number
  day:number
  npc:npc.NPC
  tourState:TourState
  enabled:boolean
  npcBreadcrumbEnabled:boolean 
  stoppedWalkingTime:number
  leavingQuestWarningActive:boolean
  leavingQuestDeadline:number
  dayPaths:DayPathData[]

  initRewardForDay():void
  moveToNPC():void
  moveToOrigin():void
  
  getNPCAskForTourDialog():string
  initPortals():void
  
  closePortals() :void
  
  getOrCreatePortal(dayPath:DayPathData,key:string):void
  getSegmentPortal(day:number,segment:number,type:"end"|"start"):Portal 
  isDayInBounds(day:number):void
  getDayData(day:number):DayPathData|undefined
  getCurrentDayData():DayPathData|undefined
  getCurrentDayEndSegmentPortal():Portal 
  getCurrentDayNextSegmentPortal() :Portal 

  getFollowThing():Entity
  vanishInPortal( portal:Portal, args:VanishInPortalParams):void


    
  getCurrentDayEndSegmentPositionAbs():Vector3 ;
  getDayStartPositionAbs(day:number,segment:number):Vector3
  getCurrentDayStartSegmentPositionAbs():Vector3
  getNextDayStartSegmentPositionAbs():Vector3

  isLastDay():boolean
  startLeavingQuestAreaCounter(force?:boolean):void
  stopLeavingQuestAreaCounter():void
  isDayHasMoreSegments(day:number,segment:number):boolean
  isCurrentDayHasMoreSegments():boolean
  setTourState(state:TourState):void
  pickRandomDialog(arr:string[]):string
  isTourEnabled():boolean
  npcStopWalking():void
  enableNPCBreadcrumb():void
  disableNPCBreadcrumb():void
  
  
  resetTour() :void
  disableTour():void
  enableTour():void
  initRunAwayForDay():void

  playNpcWaveCome(dt: number):boolean

  
  updateBreadCrumbPath(result:AstarResult):void



  startRunAwayForDay():void

  continueNextSegmentRunAwayForDay():void
  continueRunAwayForDay():void

  moveFollowThingToStartOfSegment():void
  
  spawnRewardForDay():void

  startAstarCrumb(startPos:GridPosition,destPos:GridPosition):void
  startAstar(startPos:GridPosition,destPos:GridPosition,stopShort:boolean):void
  followPath(result:AstarResult,stopShort:boolean):void
  /*
  drawPathToNPC(){
    
  }*/

}
