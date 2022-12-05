import * as utils from '@dcl/ecs-scene-utils'
import * as npc from '@dcl/npc-scene-utils'
import * as ui from '@dcl/ui-scene-utils'

//import {Grid,Astar} from "fast-astar";
import Grid from 'src/fast-astar/Grid'
import Astar from 'src/fast-astar/Astar'
import { CONFIG } from 'src/config';
import { FollowPathData,NPCLerpData } from '@dcl/npc-scene-utils';
import { IntervalUtil } from 'src/utils/interval-util';
import { NpcAnimationNameDef, REGISTRY } from 'src/registry';
import { RESOURCES } from 'src/resources'
import { pickRandom } from 'src/utils/utils'
import resources, { setSection } from 'src/dcl-scene-ui-workaround/resources'
import { DayPathData, GridPosition, TourState, VanishInPortalParams } from './tourTypes'
import * as TOUR_CONSTANTS from './tourConstants'
import { pathTo3D, placeAtEndOfSegment, realDistance, showAtEndOfSegment, toAbsGridPos } from './tourUtils'
import { movePlayerTo } from '@decentraland/RestrictedActions'

import { updateDebugTourInfo } from './debugUI'
import { Portal } from 'src/sceneItems/portal'
import { AstarResult, debugDrawPath,  findAstarMultiTargetPath,  findAStarPath,  getAstarCurrentPlayerPosition,  getAstarNpcPosition,  getNpcTransform } from './astarUtils'
import { SceneItemDef } from 'src/sceneItems/sceneItem'
import { ITourManager } from './tourManagerInterface'

const ONE_SECOND_MILLIS = 1000
const waveInterval = new IntervalUtil(ONE_SECOND_MILLIS* 2.5);//short as longest possible animation len



  

function drawBreadcrumbPath(result:AstarResult,pathSeedPointsRel:GridPosition[],entArr:Entity[]=[],opts:{shape?:GLTFShape|Shape,feet?:boolean,shapeArr?:GLTFShape[],material?:Material,highlightSeedPoints?:boolean,scaleToUse?:Vector3,offsetY?:number}){
    debugDrawPath(result,TOUR_CONSTANTS.pathSeedPointsAbs,entArr,opts)
}


export class TourManager implements ITourManager{
  
  triesToday:number=0
  day:number=-1
  npc:npc.NPC
  tourState:TourState = TourState.NOT_INIT
  enabled:boolean = false
  npcBreadcrumbEnabled:boolean = false
  stoppedWalkingTime:number=-1 
  leavingQuestWarningActive:boolean=false
  leavingQuestDeadline:number=Number.MAX_VALUE
  dayPaths:DayPathData[]
  constructor(npc:npc.NPC,dayPaths:DayPathData[]){
    this.npc = npc
    this.dayPaths = dayPaths
    this.disableTour()
  }

  initRewardForDay(){
    
  }
  moveToNPC(){
    movePlayerTo( getNpcTransform().position.add(new Vector3(1,1,1)),getNpcTransform().position ).then(
      ()=>{
       
      })
  }
  moveToOrigin(){
    movePlayerTo( new Vector3(1,1,1) ).then(
      ()=>{
       
      })
  }
  
  getNPCAskForTourDialog() {
    const METHOD_NAME = "getNPCAskForTourDialog"
    const day = this.day
    const dayTries = this.triesToday
    let dialogName = ""

    const curDayData = this.getCurrentDayData()

    const completedAtLeastOnce = false
    const completedAnyEventDayAtLeastOnce = false
    log(METHOD_NAME,"day",day,"dayTries",dayTries,"this.getCurrentDayData().isEventDay",curDayData !== undefined ? curDayData.isEventDay : "???"
      ,"completedAnyEventDayAtLeastOnce",completedAnyEventDayAtLeastOnce,"dayCompleted",completedAtLeastOnce)
    
    if(dayTries > 0){
      dialogName = "ask-follow-white-rabbit-try-again"
    }else if(completedAnyEventDayAtLeastOnce){
      dialogName = "ask-follow-white-rabbit-next-day"
    }else{
      dialogName = "ask-follow-white-rabbit-first"
    }
    return dialogName
  }
  initPortals() {
    
    for(const p in this.dayPaths){
      const dayP = this.dayPaths[p]
      //log("initPortals",Object.keys(dayP.portals))
      //debugger
      //DOES NOT HELP with flicker :(), MAKES IT WORSE 
      
      //const startPortal = this.getSegmentPortal(dayP.day,0,"start")
      
      
      //const endPortal = this.getSegmentPortal(dayP.day,0,"end")

      
    
      log("initPortals",Object.keys(dayP.portals))
    } 
    
  }   
  
  closePortals() {  
    for(const p in this.dayPaths){
      const dayP = this.dayPaths[p]
      
      for(const x in dayP.portals){ 
        const itm = dayP.portals[x]
        itm.close(true,0,false)
      }
    }
  }
  
  getOrCreatePortal(dayPath:DayPathData,key:string){
    let portal:Portal
    if(dayPath.portals[key] !== undefined){
      portal = dayPath.portals[key]
    }else{
      portal = new Portal(key,TOUR_CONSTANTS.PORTAL_DEF_GREEN)
      dayPath.portals[key] = portal
    }
    return portal; 
  }
  getSegmentPortal(day:number,segment:number,type:"end"|"start"):Portal {
    const key = "portal."+day+"."+segment+"."+type
    
    let portal:Portal|undefined =  this.getOrCreatePortal(this.dayPaths[day],key)
    return portal
  }
  isDayInBounds(day:number){
    return day >= 0 && day < this.dayPaths.length
  }
  getDayData(day:number):DayPathData|undefined{
    if(!this.isDayInBounds(day)){
      //invalid index
      return undefined
    }
    const dayPath = this.dayPaths[day]
    return dayPath
  }
  getCurrentDayData():DayPathData|undefined{
    return this.getDayData(this.day)
  }
  getCurrentDayEndSegmentPortal():Portal {

    const day = this.day 
    const dayPath = this.dayPaths[day]
    
    let segment = dayPath.currSegment
    
    let portal:Portal|undefined = this.getSegmentPortal(day,segment,"end")

    log("getCurrentDayEndSegmentPortal",portal.name,portal.entity.getComponent(Transform).position,portal.entity.uuid)

    return portal;
  }
  getCurrentDayNextSegmentPortal() {

    const day = this.day 
    const dayPath = this.dayPaths[day]

    
    let segment = dayPath.currSegment+1

    let portal:Portal|undefined = this.getSegmentPortal(day,segment,"start")

    return portal;
  }
  getFollowThing(){
    return this.npc
  }
  vanishInPortal( portal:Portal, args:VanishInPortalParams){
    log("vanishInPortal",portal.name,args)
 

    //let portal:Portal = this.getCurrentDayEndSegmentPortal()
    
    //start sequence
    utils.setTimeout(args.delayTillNpcEnterPortal, ()=>{
      const fThingTrans = this.getFollowThing().getComponent(Transform)
      this.getFollowThing().addComponentOrReplace( 
          new utils.MoveTransformComponent(
            fThingTrans.position,
            fThingTrans.position.add(new Vector3(0,-3,0)),
            .5 
            ,()=>{

              if(args.closePortal){
                portal.close(false,args.closeSpeed,false,args.onPortalCloseCallback)
              }else{
                log("vanishInPortal.not closing this portal",portal.name,args)
              }

              this.getFollowThing().getComponent(Transform).position=TOUR_CONSTANTS.TOUR_NPC_POSITION_VANISH_POS.clone()

              args.onNpcEnterPortalCallback()
              //debugger
              log("vanishInPortal",portal.name,args,"moveDone")
              if(args.playerCanEnter ){
                portal.enablePlayerCanEnter(args.onPlayerEnterPortalCallback)
              }else{ 
                portal.disablePlayerCanEnter()
              }
            }
        )
      )  
      
    })
    
  }
  
  
  getCurrentDayEndSegmentPositionAbs():Vector3 {
    const day = this.day 
    const dayPath = this.dayPaths[day]
    const segArr = dayPath.segmentsRel[dayPath.currSegment]
    //const dayStartPosition = 
    const relEndPos = segArr[segArr.length-1]
    const endPosAbs =  toAbsGridPos(relEndPos,TOUR_CONSTANTS.PATH_OFFSET)
    //const fThingTrans = getFollowThing().getComponent(Transform)
    
    //log("getCurrentDayEndSegmentPositionAbs",relEndPos,endPosAbs)
    return endPosAbs

  }
  getDayStartPositionAbs(day:number,segment:number){
    const dayPath = this.dayPaths[day]
    const segArr = dayPath.segmentsRel[segment]
    //const dayStartPosition = 
    const relEndPos = segArr[0]
    const endPosAbs =  toAbsGridPos(relEndPos,TOUR_CONSTANTS.PATH_OFFSET)
    //const fThingTrans = getFollowThing().getComponent(Transform)
    
    //log("getCurrentDayStartSegmentPositionAbs",relEndPos,endPosAbs)
    return endPosAbs
  }
  getCurrentDayStartSegmentPositionAbs(){
    const day = this.day 
    const dayPath = this.dayPaths[day]
    const endPosAbs =  this.getDayStartPositionAbs(day,dayPath.currSegment)
    //const fThingTrans = getFollowThing().getComponent(Transform)
    
    //log("getCurrentDayStartSegmentPositionAbs",relEndPos,endPosAbs)
    return endPosAbs
  }

  getNextDayStartSegmentPositionAbs(){
    const day = this.day 
    const dayPath = this.dayPaths[day]
    const segArr = dayPath.segmentsRel[dayPath.currSegment+1]
    //const dayStartPosition = 
    const relEndPos = segArr[0]
    const endPosAbs =  toAbsGridPos(relEndPos,TOUR_CONSTANTS.PATH_OFFSET)
    //const fThingTrans = getFollowThing().getComponent(Transform)
    
    //log("getNextDayStartSegmentPositionAbs",relEndPos,endPosAbs)
    return endPosAbs
  }

  isLastDay(){
    const last = this.day < this.dayPaths.length && this.dayPaths[this.day].isLastDay !== undefined && this.dayPaths[this.day].isLastDay === true
    return last
      //this.day >= this.dayPaths.length-1
  }
  startLeavingQuestAreaCounter(force?:boolean){
    const _force = force !== undefined && force
    if(_force || !this.leavingQuestWarningActive){
      this.leavingQuestDeadline = Date.now() + 1000* 20//20 //20 seconds
      this.leavingQuestWarningActive = true
    }
  }
  stopLeavingQuestAreaCounter(){
    //set far far in future
    if(this.leavingQuestWarningActive){
      this.leavingQuestDeadline = Number.MAX_VALUE
      this.leavingQuestWarningActive = false
    }
  }
  isDayHasMoreSegments(day:number,segment:number) {
    //const day = this.day
    const dayPath = this.dayPaths[day] 
    return segment < dayPath.segmentsRel.length - 1
  }
  isCurrentDayHasMoreSegments() {
    const day = this.day
    const dayPath = this.dayPaths[day] 
    return this.isDayHasMoreSegments(day,dayPath.currSegment)
  }
  setTourState(state:TourState){
    this.tourState = state
  }
  pickRandomDialog(arr:string[]){
    const val = pickRandom(arr);
    //TODO check if already asked, pick another
    return val;
  }
  isTourEnabled(){
    return this.enabled//this.tourState != TourState.TOUR_OFF && this.tourState != TourState.NOT_INIT
  }
  npcStopWalking(){
    this.npc.stopWalking()
    this.stoppedWalkingTime = Date.now()
  }
  enableNPCBreadcrumb(){
    if(!this.npcBreadcrumbEnabled){
      log("enableNPCBreadcrumb")
      this.npcBreadcrumbEnabled = true
    }
  }
  disableNPCBreadcrumb(){
    if(this.npcBreadcrumbEnabled){
      this.npcBreadcrumbEnabled = false
      log("disableNPCBreadcrumb")
      drawBreadcrumbPath( {reachable:false,path:[]},[],REGISTRY.crumbCubeEnt,{material:RESOURCES.materials.emissiveBoxMatOutline,highlightSeedPoints:false} )
    }
  }

resetTour() {
  //reset day
  const day = this.day 
  if(day >= 0){
    const dayPath = this.dayPaths[day]
    dayPath.currSegment = 0
  }
  //const dayStartPosition = 
 
  if(REGISTRY.leavingQuestAreaUI !== undefined) REGISTRY.leavingQuestAreaUI.hide()
  
  //close all portals
  this.closePortals()

  //onReset
  if(REGISTRY.leavingQuestAreaUI !== undefined) REGISTRY.GIFT.hide(true)
  
  //clear out crumb path
  this.disableNPCBreadcrumb() // or keep it active? but need to update itself
  //clear debug path too
  debugDrawPath( {reachable:false,path:[]},[],REGISTRY.debugCubeEnt,{material:RESOURCES.materials.emissiveBoxMatOutline,highlightSeedPoints:false} )

}

  disableTour(){ 
    this.resetTour()
    this.tourState = TourState.TOUR_OFF
    this.enabled = false
    this.npc.getComponent(Transform).position = TOUR_CONSTANTS.TOUR_NOT_READY_HIDE_NPC_POSITION.clone()
    this.npc.getComponent(Transform).scale = TOUR_CONSTANTS.TOUR_NOT_READY_HIDE_NPC_SCALE.clone()
  }
  enableTour(){
    
    if(!this.enabled){
      //this.tourState = TourState.TOUR_ON
      this.npc.getComponent(Transform).position.y = 0
      this.npc.getComponent(Transform).scale = Vector3.One()
    } 

    this.enabled = true
  }
  initRunAwayForDay() {
    log("initRunAwayForDay ENTRY")
    //debugger
    this.initRewardForDay();
    this.initPortals();
    this.resetTour()
    this.moveFollowThingToStartOfSegment()
    //toggleFollowThingTriggerArea();
  }/*
  drawPathToNPC(){
    
  }*/
  playNpcWaveCome(dt: number) {
    const trackUserComponent = this.npc.getComponent(npc.TrackUserFlag)
    if(trackUserComponent.active && waveInterval.update(dt) ){
            
      let animToPlay = REGISTRY.npcAnimations.WAVE

      log("WAVE/COME",animToPlay.name)

      if(Math.random()*2 >= 1){
        animToPlay=REGISTRY.npcAnimations.COME_ON
      }
      this.npc.playAnimation(animToPlay.name,true,animToPlay.duration)

      return true
    } 
    return false
  }
  updateBreadCrumbPath(result:AstarResult){
    
    if(result.reachable){
      if(result.path && result.path.length > 0){
        //expand size a little
        const vecTemp = new Vector2()
        const vecTemp2 = new Vector2()
        if(TOUR_CONSTANTS.CELL_WIDTH > 8){
          //double the dots

          const newPath:number[][] = []
          for(let x=0;x<result.path.length -2;x++){
            const itm = result.path[x]
            const itm1 = result.path[x+1]
            newPath.push(itm)

            const vec = vecTemp.set(itm[0],itm[1])
            const vec2 = vecTemp2.set(itm1[0],itm1[1])
            const midPoint1 = Vector2.Lerp(vec,vec2,.25);
            const midPoint2 = Vector2.Lerp(vec,vec2,.5);
            const midPoint3 = Vector2.Lerp(vec,vec2,.75);
            newPath.push( [midPoint1.x,midPoint1.y] )
            newPath.push( [midPoint2.x,midPoint2.y] )
            newPath.push( [midPoint3.x,midPoint3.y] )
          }
          result.path = newPath
        }
      }
    }
    
    const tourManager = this
    const day = this.day
    const dayPath = tourManager.dayPaths[day]
    const pathSeedPointsRel = dayPath.segmentsRel[dayPath.currSegment]
    
    drawBreadcrumbPath( result,pathSeedPointsRel,REGISTRY.crumbCubeEnt,
      {shape:TOUR_CONSTANTS.BREADCRUMB_SHAPE
        //,material:RESOURCES.materials.emissiveBoxMatOutline
        ,highlightSeedPoints:false
        ,scaleToUse:Vector3.One()
        ,feet: true
        ,offsetY:-.49} ) 

    /*if(result.reachable){
      if(result.path && result.path.length > 0){
 
      }
    }*/
  }

   startRunAwayForDay() {
    const startPos = getAstarNpcPosition()//getAstarCurrentPlayerPosition()
  
    
    const day = this.day
    const dayPath = this.dayPaths[day]  
    dayPath.currSegment = 0 //resets the segment
  
    this.continueRunAwayForDay()
  }

  continueNextSegmentRunAwayForDay() {
    log("continueNextSegmentRunAwayForDay.entry")
    
    const currDay = this.day
    const currSegment = this.dayPaths[currDay].currSegment

    const portal = this.getSegmentPortal(currDay,currSegment,"end")
  
    //start sequence
    this.vanishInPortal(
      portal,
      {
      delayTillNpcEnterPortal:0,
      closeSpeed: Portal.defaultCloseSpeedSeconds,
      closePortal: !this.isCurrentDayHasMoreSegments(),
      playerCanEnter: this.isCurrentDayHasMoreSegments(),
      onPlayerEnterPortalCallback:()=>{
        //if(PORTAL.playerCanEnter){ 
          if(CONFIG.DEBUG_UI_ANNOUNCE_ENABLED) ui.displayAnnouncement("Teleport player to next segment")

          

          let lookAtPos

          if( this.tourState == TourState.TOURING ){
            lookAtPos = getNpcTransform().position.clone()
            if(lookAtPos.y<1.5){
              lookAtPos.y = 1.5
            }
          }else{
            //TODO look straight ahead out of portal??
          }
          log("vanishInPortal","lookAtPos",lookAtPos,currDay,currSegment+1)
          movePlayerTo( this.getDayStartPositionAbs(currDay,currSegment+1), lookAtPos).then(
            ()=>{
              portal.close()
              //if(tourManager.isCurrentDayHasMoreSegments
              const portalNext = this.getSegmentPortal(currDay,currSegment+1,"start")
              portalNext.close()
            })
        //}else{
        //  ui.displayAnnouncement("can no longer enter")
        //}
      },
      onPortalCloseCallback:()=>{
        
      },
      onNpcEnterPortalCallback:()=>{
        const day = this.day
        const dayPath = this.dayPaths[day]  
        dayPath.currSegment ++
      
        this.moveFollowThingToStartOfSegment()
        this.continueRunAwayForDay()
      }
    })

  }

  followMultiTargetPath(startPos:GridPosition,pathSeedPoints:number[][],startIdx:number){  
    const res = findAstarMultiTargetPath(startPos,pathSeedPoints,startIdx);
    //res.path.
    log("followMultiTargetPath.method.followPath.calling")
    this.followPath ( res,false )
  }

  continueRunAwayForDay() {
    const startPos = getAstarNpcPosition()//getAstarCurrentPlayerPosition()

    const day = this.day
    const dayPath = this.dayPaths[day]  
    const pathSeedPointsRel = dayPath.segmentsRel[dayPath.currSegment]

    const nearestPoint = pathSeedPointsRel[0]//findRabitPathFromNearest(startPos,pathSeedPointsRel)
    log("nearestPoint","startPos",startPos,"nearestPoint",nearestPoint,(nearestPoint[0]+TOUR_CONSTANTS.xOffset),(nearestPoint[1]+TOUR_CONSTANTS.yOffset),"index",pathSeedPointsRel.indexOf(nearestPoint))
    const destPos = getAstarCurrentPlayerPosition()

    //order them


    this.followMultiTargetPath(startPos,pathSeedPointsRel,pathSeedPointsRel.indexOf(nearestPoint))

    this.setTourState(TourState.TOURING)  
  }

  moveFollowThingToStartOfSegment() {
    const METHOD_NAME = "moveFollowThingToStartOfSegment"
    log(METHOD_NAME,"ENTRY")

    const day = this.day 
    const dayPath = this.dayPaths[day]
    let segId = 0
    if(dayPath.currSegment > 0){
      //start 1 off spawn point so that player wont spawn on them
      
      segId = 1
    }
    //const dayStartPosition = 
    const startPosAbs =  toAbsGridPos(dayPath.segmentsRel[dayPath.currSegment][segId],TOUR_CONSTANTS.PATH_OFFSET)
    const fThingTrans = this.getFollowThing().getComponent(Transform)
    
    //TODO only set 1 time 
    fThingTrans.position.x = startPosAbs.x
    fThingTrans.position.y = 0
    fThingTrans.position.z = startPosAbs.z

    log(METHOD_NAME,"moved to ",fThingTrans.position)
  }

  async  spawnRewardForDay(){
    const METHOD_NAME = "spawnRewardForDay"
    //const tourManager = this;
    
    

    if(this.isLastDay()){
      if(CONFIG.DEBUG_UI_ANNOUNCE_ENABLED) ui.displayAnnouncement("last day go get from other scene")
      log(METHOD_NAME,"last day go get from other scene")
      //debugger
      return 
    }

    //TODO tag:check-w3-can-get


    if(!this.isLastDay()){
      this.closePortals()
    }
  }


  tourComplete(){
    log("tourComplete called!!!")
    
    const trackUserComponent = this.npc.getComponent(npc.TrackUserFlag)


    const day = this.day
    const dayPath = this.dayPaths[day]  
    //const pathSeedPointsRel = dayPath.segmentsRel[dayPath.currSegment]
    //debugger
    if( this.isCurrentDayHasMoreSegments()){
      this.npc.talk(REGISTRY.WhiteRabbitDialog, "through-here-tour");
      this.continueNextSegmentRunAwayForDay()
    }else{
      
      trackUserComponent.active = true
      this.setTourState(TourState.TOUR_COMPLETE)
      const currDayData = this.getCurrentDayData() 
      if(currDayData !== undefined){
        currDayData.completed = true
        currDayData.completedOn = Date.now()
      }else{

      }

    }
  }

  startAstarCrumb(startPos:GridPosition,destPos:GridPosition){//},pathPoints:number[][]){
    //debugger
    const result = findAStarPath(startPos,destPos)
       
    
    //add npc location
    if(result.reachable){
      if(result.path && result.path.length > 0){
        //result.path.unshift( getNpcTransform )
        //need to solve starting point issue and the fact npc would run off the grid
        //then if recalced, has to run back to grid
        result.path.push( destPos )
      }
    }
  
    this.updateBreadCrumbPath(result)
  }
  startAstar(startPos:GridPosition,destPos:GridPosition,stopShort:boolean){//},pathPoints:number[][]){
  
    const result = findAStarPath(startPos,destPos)
    //add player location
    if(result.reachable){
      if(result.path && result.path.length > 0){
        //result.path.unshift( getNpcTransform )
        //need to solve starting point issue and the fact npc would run off the grid
        //then if recalced, has to run back to grid
        //result.path.push( getCurrentPlayerPositionAtarRel2D() )
      }
    }
    log("startAstar.method.followPath.calling")
    this.followPath(result,stopShort)
  }
  followPath(result:AstarResult,stopShort:boolean){
    log("method.followPath.ENTRY",this.tourState)
    
    if(CONFIG.DEBUG_SHOW_NPC_PATH ){ 
      const tourManager = this
      const day = this.day
      const dayPath = tourManager.dayPaths[day]
      const pathSeedPointsRel = dayPath.segmentsRel[dayPath.currSegment]
      
      debugDrawPath( result,pathSeedPointsRel,REGISTRY.debugCubeEnt,{highlightSeedPoints:true} )
    }
    
    if(result.reachable){
      if(result.path && result.path.length > 0){
 

        //draw it
        
        const turnToFaceNext = true
        const closeCircle = false  

        //points: Vector3[], duration: number, onFinishCallback?: () => void, onPointReachedCallback?: (currentPoint: Vector3, nextPoint: Vector3) => void
        const points = pathTo3D( result.path, TOUR_CONSTANTS.PATH_OFFSET )

        //make it so they stop in front of u
        //recompute the last on if cell size is large
        if(stopShort){
          if(TOUR_CONSTANTS.CELL_WIDTH < 4){
            points.pop()
          }else if(points.length >=2){
            const last = points[points.length-1]
            const secondLast = points[points.length-2]
            //compute midpoint
            points[points.length-1] = Vector3.Lerp(secondLast, last, 0.6);
          }
        }
        
        
        let wenPath: FollowPathData = {
          path: 
            points
          , 
          // nbPoints: points.length, 
          loop: false,
          onReachedPointCallback: ()=>{
            log("onReachedPointCallback",)
          },
          onFinishCallback: ()=>{
            log("onFinishCallback calling tourComplete")
            if(this.tourState == TourState.TOURING){
              this.tourComplete();//is it safe to call from here?
            }//else if(){

            //}
          }
        }
        log("calling follow path")

 
        //same issue as NPCLerpData
        //NPCLerpData

        if(true){//if(TOUR_CONSTANTS.USE_NPC_FOLLOW){
          
          if(wenPath && wenPath.path && wenPath.path.length == 1){
            log("destination only had 1 point!")
            this.npcStopWalking()
          }else if(wenPath && wenPath.path && wenPath.path.length > 0){
            //workaround, utils assumes npc location is always same path
            //and is restarting from previous path position,
            //when we recalculate astart, must reset this, deleting has delete effect
            if(this.npc.hasComponent(NPCLerpData))this.npc.removeComponent(NPCLerpData)

            this.npc.followPath(wenPath) 
          }else{
            log("astar.path had 0 points!!!")
            this.npcStopWalking()
          }
        }else{
          //if(this.npc.walkingAnim) this.npc.walkingAnim.play()
          this.getFollowThing().addComponentOrReplace( 
            //new utils.FollowPathComponent( points, 3, ()=>{ 
            new utils.FollowCurvedPathComponent( points, .01, result.path.length, turnToFaceNext, closeCircle, ()=>{
            log("destination reached!") 
            this.npcStopWalking()
            } )  
          )
        }
        
      }else{
        log("destination is UNREACHABLE!")
      }
    }else{
      log("destination is a wall UNREACHABLE!")
    }
  }

}




