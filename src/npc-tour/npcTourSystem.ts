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

import { DayPathData, GridPosition, TourState } from './tourTypes'
import * as TOUR_CONSTANTS from './tourConstants'
import { pathTo3D, placeAtEndOfSegment, realDistance, showAtEndOfSegment, toAbsGridPos } from './tourUtils'
import { movePlayerTo } from '@decentraland/RestrictedActions'

import { updateDebugTourInfo } from './debugUI'
import { TourManager } from './tourManager'
import { getAstarCurrentPlayerPosition, getAstarNpcPosition, posEqual } from './astarUtils'
//import { disableTour, enableTour, initRunAwayForDay, spawnRewardForDay, startRunAwayForDay } from './tourSetup'
import { Portal } from 'src/sceneItems/portal'


const ONE_SECOND_MILLIS = 1000
const pollUserDataInterval = new IntervalUtil(ONE_SECOND_MILLIS/10);
const logUserSystemInterval = new IntervalUtil(ONE_SECOND_MILLIS/2);

const updateBreadcrumbInterval = new IntervalUtil(ONE_SECOND_MILLIS/6);


const maxAwayDistance = TOUR_CONSTANTS.NPC_MAX_AWAY_DISTANCE //when this close start amplifying speed to keep them out of reach
const activateDistance = TOUR_CONSTANTS.NPC_ACTIVATE_DISTANCE //when this close start amplifying speed to keep them out of reach

export class NpcTourSystem implements ISystem{
  lastKnownState:TourState = TourState.NOT_INIT
  update(dt: number): void {
    const playerCurrentPosition = Camera.instance.position

    if(!pollUserDataInterval.update(dt)){
      return
    }
    
    const tourManager = REGISTRY.tourManager;
    if(tourManager === undefined){
      log("NpcTourSystem skipped, tourManager not ready",tourManager)
      return
    }

    if(CONFIG.DEBUG_2D_PANEL_ENABLED) updateDebugTourInfo({astarNpcLoc:getAstarNpcPosition(),astarCurPlayerPos:getAstarCurrentPlayerPosition()})

    //log("NpcTourSystem.state",this.lastKnownState,"vs",tourManager.tourState)
    if(this.lastKnownState != tourManager.tourState){
      log("NpcTourSystem.stateChange.from",this.lastKnownState,"to",tourManager.tourState)

      if(tourManager.tourState == TourState.TOUR_OFF){
        tourManager.disableTour()
      }else if( !tourManager.isTourEnabled() ){
        //if(tourManager.tourState == TourState.TOUR_INIT){
          tourManager.enableTour()
          //spawn her near you
        //}
      } 
        
      
      if(tourManager.tourState == TourState.PLAYER_FIND_NPC){
        
        tourManager.initRunAwayForDay()

        const trackUserComponent = tourManager.npc.getComponent(npc.TrackUserFlag)
        trackUserComponent.active = true

      }else if(tourManager.tourState == TourState.NPC_FIND_PLAYER_TO_START){
          const startPos = getAstarNpcPosition()
          const destPos = getAstarCurrentPlayerPosition()
  
          tourManager.startAstar(startPos,destPos,true)
      }else if(tourManager.tourState == TourState.NPC_ASK_TOUR){
        if(CONFIG.DEBUG_UI_ANNOUNCE_ENABLED) ui.displayAnnouncement("follow the white rabbit?")
        REGISTRY.leavingQuestAreaUI.hide()
        //TODO tag:check-w3-can-get
        //"ask-follow-white-rabbit","ask-follow-white-rabbit-next-day","ask-follow-white-rabbit-try-again",
        

        tourManager.npc.talk(REGISTRY.WhiteRabbitDialog, tourManager.getNPCAskForTourDialog());
        log("HEART")
        tourManager.npc.playAnimation(REGISTRY.npcAnimations.HEART_WITH_HANDS.name,true,REGISTRY.npcAnimations.HEART_WITH_HANDS.duration);  
      }else if(tourManager.tourState == TourState.NPC_ASK_TOUR_ACCEPT){
        if(CONFIG.DEBUG_UI_ANNOUNCE_ENABLED) ui.displayAnnouncement("lets go")
        REGISTRY.leavingQuestAreaUI.hide()
        utils.setTimeout( 100, ()=>{ 
          if( REGISTRY.tourManager.tourState != TourState.TOURING
            && REGISTRY.tourManager.tourState != TourState.TOURING_WAITING_4_PLAYER ){
            tourManager.setTourState(TourState.TOURING_START)
          }else{
            debugger
          }
        } ) 
      }else if(tourManager.tourState == TourState.TOURING_START){  
        //const res = findAstarMultiTargetPath(startPos,pathSeedPoints,startIdx);

        
        
        //initMultiTargetAstarTour(tourManager)
        tourManager.startRunAwayForDay()
        
      }else if(tourManager.tourState == TourState.TOURING){
        if(CONFIG.DEBUG_UI_ANNOUNCE_ENABLED) ui.displayAnnouncement("tour go") 
        log("tour go")
      }else if(tourManager.tourState == TourState.TOUR_COMPLETE){
        log("tour done!!!")
        if(CONFIG.DEBUG_UI_ANNOUNCE_ENABLED) ui.displayAnnouncement("tour done")  

        //TODO tag:check-w3-can-get
        tourManager.npc.talk(REGISTRY.WhiteRabbitDialog, "end-of-the-tour-day-" + tourManager.day);

        tourManager.npc.playAnimation(REGISTRY.npcAnimations.HEART_WITH_HANDS.name,true,REGISTRY.npcAnimations.HEART_WITH_HANDS.duration);  

        const playerEnterOffset = (.5*1000)

        const currDay = tourManager.day
        const currSegment = tourManager.dayPaths[currDay].currSegment

        const portal = tourManager.getSegmentPortal(currDay,currSegment,"end")

        
        tourManager.vanishInPortal( 
          portal,
          { 
            delayTillNpcEnterPortal:REGISTRY.npcAnimations.HEART_WITH_HANDS.duration * 1000 - playerEnterOffset,
            closeSpeed: Portal.defaultCloseSpeedSeconds,
            closePortal: !tourManager.isLastDay(),
            playerCanEnter: tourManager.isLastDay(),
            onPlayerEnterPortalCallback:()=>{
              //ui.displayAnnouncement("player entered but end of tour!?!?!")
              //only called if  playerCanEnter == true?  or call either way??? but then ened to do check
              if(tourManager.isLastDay()){
                //TODO tag:check-w3-can-get
                teleportTo(TOUR_CONSTANTS.TOUR_LAST_DAY_TELEPORT_COORDS)
              }else{
                ui.displayAnnouncement("Why could she enter the portal but no you?")
              }
            },
            onPortalCloseCallback:()=>{
              const day = tourManager.day
              const dayPath = tourManager.dayPaths[day]  
              dayPath.currSegment ++ 
            
              
              //moveFollowThingToStartOfSegment(tourManager)
              //continueRunAwayForDay(tourManager)
            },
            onNpcEnterPortalCallback:()=>{
              //ui.displayAnnouncement("npc.entered")
              log("npc.entered.portal")
              //trying to time it with portal snapshut
              utils.setTimeout(400 + playerEnterOffset,
                ()=>{
                  tourManager.spawnRewardForDay()
                })
            }
          }
        )
      }
      
      this.lastKnownState = tourManager.tourState
    }
  }
}





export class NpcProximitySystem implements ISystem{
  lastPlayerRecalcPosition!:GridPosition
  lastNpcRecalcPosition!:GridPosition
  update(dt: number): void {
    //const playerCurrentPosition = Camera.instance.position

    if(pollUserDataInterval.update(dt)){
      const tourManager = REGISTRY.tourManager;
      if(tourManager === undefined){
        log("NpcProximitySystem skipped, tourManager not ready",tourManager)
        return
      }

      const now = Date.now()
      //log("xxx ")
      const currentPlayerPos = Camera.instance.position //playerCurrentPosition.clone()
      //const newRotation = Camera.instance.rotation.clone()
      const cameraRotation = Quaternion.Euler(0, Camera.instance.rotation.eulerAngles.y + 180,0)
      
      //const walkDir = newPos.subtract(lastWalkDir)
      let lerpData:NPCLerpData|null = tourManager.npc.hasComponent(NPCLerpData) ? tourManager.npc.getComponent(NPCLerpData) : null
      const lerpDataValid = (lerpData !== null && lerpData.target < lerpData.path.length)
      const npcPointerDown = tourManager.npc.getComponent(OnPointerDown)

      const trackUserComponent = tourManager.npc.getComponent(npc.TrackUserFlag)
      const npcTransform = tourManager.npc.getComponent(Transform)
      //const npmDist = npcTransform.position
      const npcDist = realDistance(npcTransform.position,currentPlayerPos)

      let modifiedSpeed = 1 - npcDist/activateDistance
      //let modifiedSpeed = 1 - npcDist/activateDistance
      if(modifiedSpeed < 0){ 
        modifiedSpeed = 0 
      }

      
      const startMoving = npcDist < activateDistance
      const stopAndWait = npcDist > maxAwayDistance
 
      const adjSpeed = TOUR_CONSTANTS.NPC_DEFAULT_WALK_SPEED + (TOUR_CONSTANTS.NPC_DEFAULT_WALK_SPEED*modifiedSpeed)*10
      //log("distance from npc",npcDist,",tourManager.npc.walkingSpeed",tourManager.npc.walkingSpeed,"modifiedSpeed",modifiedSpeed,"new",adjSpeed)

      if(tourManager.tourState == TourState.NOT_INIT){
        //cannot be found
        
      }else if(tourManager.tourState == TourState.PLAYER_FIND_NPC){
          //log("WAVE",waveInterval.update(dt))
          tourManager.playNpcWaveCome(dt)
      }else if(tourManager.tourState == TourState.NPC_FIND_PLAYER_TO_START){
        let playerFromEndWalkDist = -1
        if(lerpDataValid){
          playerFromEndWalkDist = realDistance(currentPlayerPos,lerpData!.path[lerpData!.path.length - 1])
        }
        //spawn triggers, if player near one, put npc here to start
         
        //when near enough
        if(npcDist < TOUR_CONSTANTS.NPC_FIND_PLAYER_TO_START_MIN_DIST){
          log("tour",TourState.NPC_FIND_PLAYER_TO_START,"distance near enough!")
          tourManager.npcStopWalking()
          tourManager.setTourState(TourState.NPC_ASK_TOUR);
        }else if(
          (playerFromEndWalkDist > TOUR_CONSTANTS.NPC_FIND_PLAYER_RECALC_DIST)
          || (!lerpDataValid && npcDist > TOUR_CONSTANTS.NPC_FIND_PLAYER_RECALC_DIST)){
            const destPos = getAstarCurrentPlayerPosition()
            if(!posEqual( this.lastPlayerRecalcPosition,destPos )){
              log("tour.RECALC",TourState.NPC_FIND_PLAYER_TO_START,"distance near enough!","npcDist",npcDist,"playerFromEndWalkDist",playerFromEndWalkDist,"lerpDataValid",lerpDataValid)
              const startPos = getAstarNpcPosition()
                
              this.lastPlayerRecalcPosition = destPos
 
              //DONT RECALCULATE THIS A TON! 
              tourManager.startAstar(startPos,destPos,true)
            }else{
              log("tour.DONT_RECALC",TourState.NPC_FIND_PLAYER_TO_START,"distance near enough!","npcDist",npcDist,"playerFromEndWalkDist",playerFromEndWalkDist,"lerpDataValid",lerpDataValid)
            }
        }else{ 
          log("tour",TourState.NPC_FIND_PLAYER_TO_START,"distance from npc",npcDist,"player from end",playerFromEndWalkDist,",tourManager.npc.walkingSpeed",tourManager.npc.walkingSpeed,"modifiedSpeed",modifiedSpeed,"new",adjSpeed)
        } 
      }else if(tourManager.tourState == TourState.NPC_ASK_TOUR ){
        
      }else if(tourManager.tourState == TourState.TOURING || tourManager.tourState == TourState.TOURING_WAITING_4_PLAYER){
        //log("npc","tour",npcDist,"NPC_ACTIVATE_BREADCRUMB_DIST",TOUR_CONSTANTS.NPC_ACTIVATE_BREADCRUMB_DIST,"lerpDataValid",lerpDataValid,"stopAndWait",stopAndWait,"startMoving",startMoving,"tourManager.npc.state ",tourManager.npc.state ,"trackUserComponent.active",trackUserComponent.active)
        

        /*let playerFromNpcDist = -1
        const npcPosition = getNpcTransform().position
        if(lerpDataValid){
          playerFromNpcDist = realDistance(currentPlayerPos,npcPosition)
        }*/
        if(npcDist > TOUR_CONSTANTS.NPC_TOO_FAR_AWAY ){//if(!posEqual( this.lastPlayerRecalcPosition,destPos )){
          if(!tourManager.leavingQuestWarningActive){
            tourManager.startLeavingQuestAreaCounter()
            REGISTRY.leavingQuestAreaUI.show(true)
          }
          
          const timeLeft = tourManager.leavingQuestDeadline - now
          if(timeLeft > 0){
            REGISTRY.leavingQuestAreaUI.show()//passive check
            REGISTRY.leavingQuestAreaUI.updateText( "You are too far away.  Catch up! \nFollow the White Rabbit Quest will end in\n" + (timeLeft/1000).toFixed(0) )
          }else{
            REGISTRY.leavingQuestAreaUI.hide()
            //npc message
            tourManager.triesToday++
            tourManager.npc.talk(REGISTRY.WhiteRabbitDialog, "left-quest-area");
            tourManager.setTourState(TourState.PLAYER_FIND_NPC)
            
          }
          
        }else{
          tourManager.stopLeavingQuestAreaCounter()
          REGISTRY.leavingQuestAreaUI.hide()
        }
        if(npcDist > TOUR_CONSTANTS.NPC_ACTIVATE_BREADCRUMB_DIST){//if(!posEqual( this.lastPlayerRecalcPosition,destPos )){
          //log("updateBreadcrumbInterval.check",updateBreadcrumbInterval.elapsedTime,dt)
          if(updateBreadcrumbInterval.update(dt) ){
            //log("updateBreadcrumbInterval.check",dt)
          
            //const startPos = getAstarNpcPosition()
            
            tourManager.enableNPCBreadcrumb()
            

            const destPos = getAstarNpcPosition()
            const startPos = getAstarCurrentPlayerPosition()

            if(!posEqual( this.lastNpcRecalcPosition,destPos ) || !posEqual( this.lastPlayerRecalcPosition,startPos )){
              log("tour.breadcrumb.RECALC",TourState.NPC_FIND_PLAYER_TO_START,"distance near enough!","npcDist",npcDist,"lerpDataValid",lerpDataValid,this.lastNpcRecalcPosition,destPos)
              
              //if( updateBreadcrumbInterval.update(dt) ){
                this.lastNpcRecalcPosition = destPos
                this.lastPlayerRecalcPosition = startPos

                //DONT RECALCULATE THIS A TON! 
                tourManager.startAstarCrumb(startPos,destPos)
              //}
            }else{
              log("tour.breadcrumb.DONT_RECALC",TourState.NPC_FIND_PLAYER_TO_START,"distance near enough!","npcDist",npcDist,"lerpDataValid",lerpDataValid,this.lastNpcRecalcPosition,destPos,this.lastPlayerRecalcPosition,startPos)
            }
          }
          //this.lastPlayerRecalcPosition = destPos
        }else{
          tourManager.disableNPCBreadcrumb()
        }
        
        //dont place till closer to it? placePortalAtEndOfSegment(tourManager)
        //-5 is visit points but the curve points it came up with
        if(lerpDataValid && lerpData !== null && lerpData.target > lerpData.path.length-5){
          tourManager.getCurrentDayEndSegmentPortal().showAtEndOfSegment(tourManager.getCurrentDayEndSegmentPositionAbs())
          if(tourManager.isCurrentDayHasMoreSegments()){
            tourManager.getCurrentDayNextSegmentPortal().showAtStartOfSegment(tourManager.getNextDayStartSegmentPositionAbs())
          }else{
            REGISTRY.GIFT.placeAtEndOfSegment(tourManager.getCurrentDayEndSegmentPositionAbs())
          } 
          //place reward there
          
        }
        
        
        if(stopAndWait){
          //beyond runaway distance
          if (tourManager.npc.state != npc.NPCState.STANDING) {
            tourManager.npcStopWalking()
            //trackUserComponent.active = false
          }
          
          //tourManager.setTourState(TourState.TOURING_WAITING_4_PLAYER)
        }else if(startMoving){
          const doLog = logUserSystemInterval.update(dt)

          tourManager.setTourState(TourState.TOURING)
          
          if(doLog) log("npc","tour",npcDist,"NPC_ACTIVATE_BREADCRUMB_DIST",TOUR_CONSTANTS.NPC_ACTIVATE_BREADCRUMB_DIST,"lerpDataValid",lerpDataValid,"stopAndWait",stopAndWait,"startMoving",startMoving,"tourManager.npc.state ",tourManager.npc.state 
            ,"lerpData.target",lerpData !== null ? lerpData.target:"-1",lerpData !== null ? lerpData.path.length : "-1")

            
          
          //log("tourManager.npc.state",tourManager.npc.state,lerpData) 
          if(tourManager.npc.state != npc.NPCState.FOLLOWPATH && lerpDataValid){
            //resume walking
            
            tourManager.npc.lastPlayedAnim.stop()
            if (tourManager.npc.walkingAnim) {
              tourManager.npc.walkingAnim.play()
              tourManager.npc.lastPlayedAnim = tourManager.npc.walkingAnim
            }
            tourManager.npc.state = npc.NPCState.FOLLOWPATH


          }else{ //invalid lerp data, done?
            if(tourManager.npc.state != npc.NPCState.FOLLOWPATH){

              log("npc","trackUserComponent.active","enable",trackUserComponent.active,tourManager.npc.state,"lerpDataValid",lerpDataValid)
              //use onFinishCallback instead?
              log("onFiNpcProximitySystemnishCallback calling tourComplete")
              //tourComplete()
            }
            //tourManager.npcStopWalking()
            
          }
        }else{
          const doLog = logUserSystemInterval.update(dt)
          if(doLog) log("npc","not sure what to do",npcDist,"tourManager.npc.state ",tourManager.npc.state )
        }


        //START HANDING FACE PLAYER LOGIC
        if(stopAndWait ){//|| (!startMoving && !stopAndWait)){
          if(tourManager.npc.state == npc.NPCState.STANDING && !trackUserComponent.active && (now - tourManager.stoppedWalkingTime) > 500){
            log("npc.look at player","stopAndWait",stopAndWait,"startMoving",startMoving,"tourManager.npc.state ",tourManager.npc.state )
            trackUserComponent.active = true
          }
          //log("WAVE",waveInterval.update(dt))
          tourManager.playNpcWaveCome(dt)
        }else{
          //run away
          if(tourManager.npc.state == npc.NPCState.FOLLOWPATH && trackUserComponent.active){
            const lastVal = trackUserComponent.active
            trackUserComponent.active = false
            //ensure facing direction again, force a look at
            if(lastVal && lerpDataValid){
              log("npc.look at player.FORCE","stopAndWait",stopAndWait,"startMoving",startMoving,"tourManager.npc.state ",tourManager.npc.state )
              npcTransform.lookAt(lerpData!.path[lerpData!.target])
            }
          }
        }
        //END HANDING FACE PLAYER LOGIC
      }
      //tourManager.npc.walkingSpeed = Math.max( adjSpeed, NPC_DEFAULT_WALK_SPEED)
      
      //log("dist",dist) 
      //log("angleAxis",walkDirRotation.eulerAngles,dist) 

    }
  }
}
