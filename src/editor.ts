import * as d3 from "d3";

class EditorObject
{
    objectType:number;
    translateX:number;
    translateY:number;
    scaleX:number;
    scaleY:number;
    rotate:number;
    controls:any;
    controlList:any[];
    constructor()
    {

    }
    createControls()
    {
        this.controls=document.createElement("div");
        let tsX=document.createElement("input");
        tsX.type="number";
        tsX.setAttribute("key","translateX");
        tsX.value=this.translateX as unknown as string;
        let tsY=document.createElement("input");
        tsY.type="number";
        tsY.setAttribute("key","translateY");
        tsY.value=this.translateY as unknown as string;
        let sX=document.createElement("input");
        sX.type="number";
        sX.setAttribute("key","scaleX");
        sX.value=this.scaleX as unknown as string;
        let sY=document.createElement("input");
        sY.type="number";
        sY.setAttribute("key","scaleY");
        sY.value=this.scaleY as unknown as string;
        let r=document.createElement("input");
        r.type="number";
        r.setAttribute("key","rotate");
        r.value=this.rotate as unknown as string;
        this.controls.appendChild(tsX);
        this.controls.appendChild(tsY);
        this.controls.appendChild(sX);
        this.controls.appendChild(sY);
        this.controls.appendChild(r);
        tsX.onchange=this.updateProperty;
        tsY.onchange=this.updateProperty;
        sX.onchange=this.updateProperty;
        sY.onchange=this.updateProperty;
        r.onchange=this.updateProperty;
    }
    updateProperty(event:any)
    {
        let key:string=event.target.getAttribute("key");
        (this as any)[key]=event.target.value;
    }
    removeControls()
    {
        this.controls.parentNode.removeChild(this.controls);
    }
}/*
class EditorSceneBoundObject extends EditorObject
{
}
class EditorRenderObject extends EditorObject
{
    objectType:number;
    diffuse:number[];
    specular:number[];
    rIndex:number;
    kd:number;
    kt:number;
    constructor(objectType:number)
    {
        super();
        this.objectType=objectType;
    }
    createControls()
    {
        let controls=super.createControls();
        controls.appendChild;

        return controls;
    }
    updateProperties()
    {
    }
}
class EditorLightObject extends EditorObject
{
    color:number[];
    

}*/


let STATES={
    DEFAULT:0,
    MOVECAMERA:2,
    ZOOMCAMERA:3
}
let state=STATES.DEFAULT;

interface ICamera
{
    x:number,
    y:number,
    zoom:number,
};
let camera:ICamera={x:0,y:0,zoom:1};
let lastZoom=1.0;
let mouse={x:0,y:0,dx:0,dy:0};
let prop:any={};
let svg:any=undefined;
let svgNode:any=undefined;
let scene:any=undefined;
let width=400;
let height=400;
let cornerx=-200;
let cornery=-200;
let ratio=1.0;
let dragged:any=undefined;
let selection:any=undefined;

let objects:any[]=[];

function updateCamera()
{
    scene.attr("transform","translate("+camera.x+","+camera.y+") scale("+camera.zoom+")");
}
function onselect()
{
    selection.classed("selected",true);
    //show controls and shit
}
function onselectstop()
{
    selection.classed("selected",false);
}
function updateObjects()
{
    d3.selectAll(".object").data(objects).enter(function(d:any)
    {
        switch(d.type)
        {
            case 0://line
                d3.creator("use")
                .attr("xlink:href","#line");
                break;
            case 1:
                d3.creator("use")
                .attr("xlink:href","#circle");
                break;
        }
    }).attr("class","objectSVG").on("click",onObjectClick);
}
function init()
{
    $("#buttonPanel").append('<button id="lineButton">Line</button>');
    $("#buttonPanel").append('<button id="circleButton">Circle</button>');
    //draw buttons 
    $("#lineButton").on("click",{type:0},onObjButtonClick ); 
    $("#circleButton").on("click",{type:1},onObjButtonClick ); 

    $("#editor").on("mousedown",function(event:any)
    {
        console.log(state);
        console.log("mousedowneditor");
        mouse.x=event.pageX-svgNode.clientLeft;
        mouse.y=event.pageY-svgNode.clientTop;
        mouse.dx=0;
        mouse.dy=0;
        if(state==STATES.DEFAULT)
        {
            if(event.shiftKey)
            {
                console.log("mousedownZOOM");
                    lastZoom = camera.zoom;
                    state=STATES.ZOOMCAMERA;
            }
            else
                state=STATES.MOVECAMERA;
        }
        return false;
    });
    $("#editor").on("click",function(event:any)
    {
        if(dragged!==undefined)
            dragged=undefined;
        if(event.target!=event.currentTarget)
        {
            selection=d3.select(event.target);
            if(selection.onselect)
                selection.onselect(selection);
        }else{

            if(selection!==undefined&&selection.onselectstop!==undefined)
                selection.onselectstop(selection);
            selection=undefined;
        }
        return false;
    });
    

    $(window).on("mousedown",function(event:any)
    {
        mouse.x=event.pageX-svgNode.clientLeft;
        mouse.y=event.pageY-svgNode.clientTop;
        mouse.dx=0;
        mouse.dy=0;
        if(selection!=undefined)
            onselectstop();
        selection=undefined;
        dragged=d3.select(event.target);
        if(dragged.ondragstart)
            dragged.ondragstart();
        if(state==STATES.MOVECAMERA)
        {
            state=STATES.DEFAULT;
        }else if(state==STATES.ZOOMCAMERA)
        {
            state=STATES.DEFAULT;
        }
    });
    $(window).on("mouseup",onMouseUp);
    $(window).on("mouseleave",function(event:any)
    {
        console.log("mouseleave");
        var from = event.relatedTarget || event.toElement;
        if (!from || from.nodeName == "HTML") 
        {
        state=STATES.DEFAULT;
        if(state==STATES.MOVECAMERA)
        {
            state=STATES.DEFAULT;
        }else if(state==STATES.ZOOMCAMERA)
        {
            state=STATES.DEFAULT;
        }
        }
    });
    $(document).on("keydown",function(event:any)
    {
        if(selection!==undefined)
        {
            if(event.code=='Delete')
            {
                let index=objects.indexOf(selection.data());
                if(index!=-1)
                    objects.splice(index,1);
                updateObjects();
            }
        }
    });
    $(window).on("mousemove",function(event:any)
    {	
        let dx=event.pageX-svgNode.clientLeft-mouse.x;
        let dy=event.pageY-svgNode.clientTop-mouse.y;
        mouse.x=event.pageX-svgNode.clientLeft;
        mouse.y=event.pageY-svgNode.clientTop;
        mouse.dx+=dx;
        mouse.dy+=dy;
        if(state==STATES.MOVECAMERA)
        {
            console.log("mousemovecamera");
            camera.x+=dx*ratio;
            camera.y+=dy*ratio;
            updateCamera();
        }
        if(dragged!=undefined)
        {
            console.log("mousemoveTransform");
            if(dragged.ondrag!=undefined)
                dragged.ondrag(dragged,mouse);
            prop.f(event,dx,dy);
        }
        if(state==STATES.ZOOMCAMERA)
        {
            console.log("mousemoveZOOM");
            camera.zoom=Math.min(Math.max(lastZoom*Math.pow(2.0,mouse.dx*0.01),0.05),8.0);
            updateCamera();
        }
    });
    //svg=$("#editor").get(0);
    svg=d3.select("body").select("svg");
    svgNode=svg.node();
    let box=svgNode.viewBox.baseVal;
    ratio=box.width/svgNode.clientWidth;
    $(window).on("resize",function(event:any)
    {
        let box=svgNode.viewBox.baseVal;
        ratio=box.width/svgNode.clientWidth;
    });
    scene=svg.select("#scene");
    $("#moveHandle").attr("ondragstart",function(el)
    {

    });
    $("#moveHandle").attr("ondrag",function(el,mouse)
    {

    });
}
function onMouseUp(event:any)
{
    if(state==STATES.MOVECAMERA||state==STATES.ZOOMCAMERA)
    {
        state=STATES.DEFAULT;
    }
    if(dragged!==undefined)
    {
        if(dragged.ondragstop)
            dragged.ondragstop(dragged);
        dragged=undefined;
    }
}
function onTranslateXDown(event:any)
{

}
function onTranslateYDown(event:any)
{

}
function onTranslate(event:any,dx:number,dy:number)
{

}
function onScaleXDown(event:any)
{

}
function onScaleYDown(event:any)
{

}
function onScaleDown(event:any)
{

}
function onRotateDown(event:any)
{

}
function onControlsUpdate(object:any)
{

}
function onObjectClick(event:any)
{
    console.log("U clicked this object");
    selection=d3.select(event.target);
    onselect();
    //show controls
    //
}
function onControlDown(event:any)
{
    let control=event.target;
}
function onObjButtonClick(event:any)
{
    switch(event.data.type)
    {
        case 0:
            objects.push({type:0,translate:[0,0],rotate:0,scale:[1,1]});
            break;
        case 1:
            objects.push({type:1,translate:[0,0],rotate:0,scale:[1,1]});
            break;
    }
    updateObjects();
    return false;
}

let editor={init:init}

export default editor;



