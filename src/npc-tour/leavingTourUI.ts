import * as ui from '@dcl/ui-scene-utils'
import resources, { setSection } from "src/dcl-scene-ui-workaround/resources"
import { RESOURCES } from "src/resources"

export class LeavingQuestAreaUI{
  //counter:ui.UICounter
  tooltipContainer:UIContainerRect
  directionTipText:UIText
  visible:boolean=false

  constructor(){
    //this.counter = new ui.UICounter( 0,0,0,Color4.Red(),10,false,0 )
    //this.hide()
    const tooltipContainer = this.tooltipContainer = new UIContainerRect(ui.canvas)
    tooltipContainer.width = "100%"
    tooltipContainer.height = "100%"
    tooltipContainer.visible = this.visible
    
    const bgImage = new UIImage(tooltipContainer, RESOURCES.textures.dialogAtlas)
    setSection( bgImage, resources.backgrounds.NPCDialog )

    bgImage.opacity = .9

    bgImage.vAlign = "top" 
    bgImage.hAlign = "center" 

    bgImage.positionX = 0
    bgImage.positionY = 0

    bgImage.width = 420
    bgImage.height = 100

    const text = this.directionTipText =  new UIText(tooltipContainer)
    text.value =  "You are too far away.  Catch up! \n Quest will end in\n 000 "
    text.color = Color4.White()
    text.fontSize = 18
    text.vAlign = bgImage.vAlign
    text.vTextAlign = "center"
    text.hAlign = "center" 
    text.height = 100
    text.hTextAlign = "center"
    text.positionX = 0
    text.positionY = 0
  }


  show(force?:boolean){
    const _force = force !== undefined && force
    if(_force || !this.visible){
      this.visible = true
      this.tooltipContainer.visible = this.visible
      this.directionTipText.visible = this.visible
    }
  }
  hide(){
    //this.counter.hide()
    this.visible = false
    this.tooltipContainer.visible = this.visible
    this.directionTipText.visible = this.visible
  }
  updateText(text:string){
    if(this.directionTipText.value != text) this.directionTipText.value = text
  }
}