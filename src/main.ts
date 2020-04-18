// @ts-ignore
import Texture from "./texture";
// @ts-ignore
import Tracer from "./tracer";
// @ts-ignore
import Shader from "./Shader.ts";
// @ts-ignore
import vec2 from "./vec2.ts";
// @ts-ignore
import mat3 from "./mat3.ts";

import $ from 'jquery';

// @ts-ignore
import genericVert from "./Shaders/generic.vert";
// @ts-ignore
import intersectCircleFrag from "./Shaders/intersectCircle.frag";
// @ts-ignore
import intersectLightFrag from "./Shaders/intersectLight.frag";
// @ts-ignore
import intersectLineFrag from "./Shaders/intersectLine.frag";
// @ts-ignore
import renderLinesFrag from "./Shaders/renderLines.frag";
// @ts-ignore
import renderLinesVert from "./Shaders/renderLines.vert";
// @ts-ignore
import sampleBrdfFrag from "./Shaders/sampleBrdf.frag";
// @ts-ignore
import sampleLightFrag from "./Shaders/sampleLight.frag";
// @ts-ignore
import renderScreenBufferFrag from "./Shaders/renderScreenBuffer.frag";
// @ts-ignore
import initIntersectionsFrag from "./Shaders/initIntersections.frag";
// @ts-ignore
import renderTextureDEBUGFrag from "./Shaders/renderTextureDEBUG.frag";
// @ts-ignore
import renderColoredPrimitiveFrag from "./Shaders/renderColoredPrimitive.frag";
// @ts-ignore
import renderColoredPrimitiveVert from "./Shaders/renderColoredPrimitive.vert";
// @ts-ignore
import renderOutlineFrag from "./Shaders/renderOutline.frag";
// @ts-ignore
import renderOutlineVert from "./Shaders/renderOutline.vert";

import ui from "./ui.js";

// @ts-ignore
import editor from "./editor.ts";

var parameters=
{
    passesPerBatch:undefined as number,
    passes:undefined as number,
    gpuBufferWidth:undefined as number,
    gpuBufferHeight:undefined as number,
    sceneBounds:undefined as number[],
    offscreenWidth:undefined as number,
    offscreenHeight:undefined as number
};
var isRunning=false;
var rays=1;
var tracer=undefined as Tracer;
var offscreenBuffer=undefined as Texture;
var gl=undefined as any;
var extensions=undefined as any;
var geometry=undefined as any;
var rhoRGB=undefined as Texture;
var shaders=undefined as any;



function init()
{
    ui.init();
    editor.init();
    // @ts-ignore
    gl=$("#canvas")[0].getContext("webgl");
    extensions={};
    extensions.drawBuffersExt = gl.getExtension('WEBGL_draw_buffers');
    extensions.textureFloatExt = gl.getExtension('OES_texture_float');
    extensions.vaoExt = gl.getExtension('OES_vertex_array_object');
    extensions.floatBufferExt = gl.getExtension('WEBGL_color_buffer_float');
    extensions.texFloatLinExt = gl.getExtension('OES_texture_float_linear');
    offscreenBuffer=new Texture(gl,0,gl.RGBA,1,1,0,gl.RGBA,gl.FLOAT,null,[{key:gl.TEXTURE_MIN_FILTER,value:gl.LINEAR},
        {key:gl.TEXTURE_MAG_FILTER,value:gl.LINEAR},
        {key:gl.TEXTURE_WRAP_S,value:gl.CLAMP_TO_EDGE},
        {key:gl.TEXTURE_WRAP_T,value:gl.CLAMP_TO_EDGE}]);
    //init rhoRGB
    {
    const level=0;
    const internalFormat = gl.RGB;
    const width=36;
    const height=1;
    const border=0;
    const srcFormat = gl.RGB;
    const srcType = gl.FLOAT;
    const rho_R=[ 0.021592459, 0.020293111, 0.021807906, 0.023803297, 0.025208132, 0.025414957, 0.024621282, 0.020973705, 0.015752802, 0.01116804, 0.008578277, 0.006581877, 0.005171723, 0.004545205, 0.00414512, 0.004343112, 0.005238155, 0.007251939, 0.012543656, 0.028067132, 0.091342277, 0.484081092, 0.870378324, 0.939513128, 0.960926994, 0.968623763, 0.971263883, 0.972285819, 0.971898742, 0.972691859, 0.971734812, 0.97234454, 0.97150339, 0.970857997, 0.970553866, 0.969671404 ];
    const rho_G=[ 0.010542406, 0.010878976, 0.011063512, 0.010736566, 0.011681813, 0.012434719, 0.014986907, 0.020100392, 0.030356263, 0.063388962, 0.173423837, 0.568321142, 0.827791998, 0.916560468, 0.952002841, 0.964096452, 0.970590861, 0.972502542, 0.969148203, 0.955344651, 0.892637233, 0.5003641, 0.116236717, 0.047951391, 0.027873526, 0.020057963, 0.017382174, 0.015429109, 0.01543808, 0.014546826, 0.015197773, 0.014285896, 0.015069123, 0.015506263, 0.015545797, 0.016302839 ];
    const rho_B=[ 0.967865135, 0.968827912, 0.967128582, 0.965460137, 0.963110055, 0.962150324, 0.960391811, 0.958925903, 0.953890935, 0.925442998, 0.817997886, 0.42509696, 0.167036273, 0.078894327, 0.043852038, 0.031560435, 0.024170984, 0.020245519, 0.01830814, 0.016588218, 0.01602049, 0.015554808, 0.013384959, 0.012535491, 0.011199484, 0.011318274, 0.011353953, 0.012285073, 0.012663188, 0.012761325, 0.013067426, 0.013369566, 0.013427487, 0.01363574, 0.013893597, 0.014025757 ];
    let pixels = [];
    for(let i=0;i<36;i++)
    {
        pixels.push(rho_R[i]);
        pixels.push(rho_G[i]);
        pixels.push(rho_B[i]);
    }
    rhoRGB=new Texture(gl,0,gl.RGB,36,1,0,gl.RGB,gl.FLOAT,new Float32Array(pixels),[{key:gl.TEXTURE_MIN_FILTER,value:gl.LINEAR},
        {key:gl.TEXTURE_MAG_FILTER,value:gl.LINEAR},
        {key:gl.TEXTURE_WRAP_S,value:gl.CLAMP_TO_EDGE},
        {key:gl.TEXTURE_WRAP_T,value:gl.CLAMP_TO_EDGE}]);
    }
    //Fullscreen quad geometry
    geometry={};
    {
        let vertexArray=[0.,0.,
        1.0,0.0,
        1.0,1.0,
        0.0,0.0,
        1.0,1.0,
        0.0,1.0
        ];
        let vbo=gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexArray), gl.STATIC_DRAW);
        let vao=extensions.vaoExt.createVertexArrayOES();
        extensions.vaoExt.bindVertexArrayOES(vao);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
        geometry.screen={vbo:vbo,vao:vao,count:6};
    }
    //Line geometry
    {
        let vertexArray=[0.0,0.0,
        1.0,0.0];
        let vbo=gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexArray), gl.STATIC_DRAW);
        let vao=extensions.vaoExt.createVertexArrayOES();
        extensions.vaoExt.bindVertexArrayOES(vao);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
        geometry.lineOutline={vbo:vbo,vao:vao,count:vertexArray.length};
    }
    //Circle geometry
    {
        let circleEdges=24;
        let vertexArray=[
        ];
        for(let i=0;i<circleEdges+1;i++)
        {
            let angle=i/(2.0*Math.PI*circleEdges);
            vertexArray.push(Math.cos(angle));
            vertexArray.push(Math.sin(angle));
        }
        let vbo=gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexArray), gl.STATIC_DRAW);
        let vao=extensions.vaoExt.createVertexArrayOES();
        extensions.vaoExt.bindVertexArrayOES(vao);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
        geometry.circleOutline={vbo:vbo,vao:vao,count:vertexArray.length};
    }

    shaders={};
    shaders.sampleLight=new Shader(gl,genericVert,sampleLightFrag,{in_pos:0});
    shaders.intersectLight=new Shader(gl,genericVert,intersectLightFrag,{in_pos:0});
    shaders.intersectLine=new Shader(gl,genericVert,intersectLineFrag,{in_pos:0});
    shaders.intersectCircle=new Shader(gl,genericVert,intersectCircleFrag,{in_pos:0});
    shaders.renderLines=new Shader(gl,renderLinesVert,renderLinesFrag,{uv_vert:0});
    shaders.sampleBRDF=new Shader(gl,genericVert,sampleBrdfFrag,{in_pos:0});
    shaders.renderScreenBuffer=new Shader(gl,genericVert,renderScreenBufferFrag,{in_pos:0});
    shaders.initIntersections=new Shader(gl,genericVert,initIntersectionsFrag,{in_pos:0});
    shaders.renderTextureDEBUG = new Shader(gl,genericVert,renderTextureDEBUGFrag,{in_pos:0});
    shaders.renderColoredPrimitive = new Shader(gl,renderColoredPrimitiveVert,renderColoredPrimitiveFrag,{in_pos:0});
    shaders.renderOutline = new Shader(gl,renderOutlineVert,renderOutlineFrag,{in_pos:0});


    //init page onclick 
    $("#runButton").bind("click",run);
    $("#saveButton").bind("click",save);
    window.requestAnimationFrame(draw);
}

function validateNumber(value:any,min:number,max:number,integer=false):boolean
{
    let flag:boolean=true;
    flag=flag&&(value!==undefined);
    flag=flag&&(value instanceof Number);
    if(integer)
    {
        flag=flag&&Number.isInteger(value);
    }
    flag=flag&&(value>min);
    flag=flag&&(value<max);
    return flag;
}
export const ObjectType=
{
  CIRCLE:0,
  LINE:1
};
export const NormalType=
{
  F:0,
  B:1,
  FB:2
};
export const LightType=
{
  POINT:0,
  POINTDIR:1,
  POINTANG:2,
  CIRCLE:3,
  CIRCLEANG:4,
  LINE:5,
  LINEDIR:6
};
interface ITransform
{
    mat:mat3,
    invMat:mat3
}
interface ISceneLight
{
    type:number,
    color:number[],
    angle:number,
    transform:ITransform
}
interface ISceneObject
{
    type:number,
    material:number,
    normalType:number,
    transform:ITransform
}
interface IScene
{
    objects:ISceneObject[],
    lights:ISceneLight[]
}
function createLine(p1:vec2,p2:vec2,normalType:number,material:number):ISceneObject
{
  let obj:ISceneObject={type:0,material:0,normalType:0,transform:undefined};
  obj.type = ObjectType.LINE;
  obj.material = material;
  obj.normalType = normalType;
  obj.transform = createTransform(p1, Math.atan2(p2.get(1) - p1.get(1), p2.get(0) - p1.get(0)), vec2.scalar(vec2.distance(p1, p2)));
  return obj;
}
function createTransform(t:vec2,r:number,s:vec2):ITransform
{
    let mat = mat3.identity();
    mat = mat3.translate(mat, t);
    mat = mat3.rotate(mat, r);
    mat = mat3.scale(mat, s);
    let invMat = mat3.inverse(mat);
    let transform:ITransform={mat:invMat,invMat:mat};
    return transform;
}
function createCircle(center:vec2,radius:number,normalType:number,material:number):ISceneObject
{
    let obj:ISceneObject={type:0,material:0,normalType:0,transform:undefined};
    obj.type = ObjectType.CIRCLE;
    obj.material = material;
    obj.normalType = normalType;
    obj.transform = createTransform(center, 0.0, vec2.scalar(radius));
    return obj;
}
function degToRad(degree:number):number
{
    return degree*Math.PI/180.0;
}
function run()
{
    if(isRunning==true)
        return;
    //@ts-ignore
    parameters=ui.getParameters();
    ui.setProgress(0);

    let scene:IScene={objects:[],lights:[]};
    /*scene.objects.push(createLine(new vec2([0.0,0.0]),new vec2([0.5,0.0]),NormalType.F,0));
    scene.objects.push(createLine(new vec2([0.5,0.0]),new vec2([0.5,0.5]),NormalType.F,0));
    scene.objects.push(createLine(new vec2([0.5,0.5]),new vec2([0.0,0.0]),NormalType.F,0));*/
    scene.lights.push({type:LightType.POINT,
      color:[1.,1.,1.],
      angle:degToRad(0.0),
      transform:createTransform(new vec2([0.,0.5]),degToRad(-40.0),new vec2([0.03,0.03]))
    });

    offscreenBuffer.destroy(gl);
    offscreenBuffer=new Texture(gl,0,gl.RGBA,parameters.offscreenWidth,parameters.offscreenHeight,0,gl.RGBA,gl.FLOAT,null,[{key:gl.TEXTURE_MIN_FILTER,value:gl.LINEAR},
        {key:gl.TEXTURE_MAG_FILTER,value:gl.LINEAR},
        {key:gl.TEXTURE_WRAP_S,value:gl.CLAMP_TO_EDGE},
        {key:gl.TEXTURE_WRAP_T,value:gl.CLAMP_TO_EDGE}]);
    tracer=new Tracer(gl,extensions,geometry,parameters,offscreenBuffer,rhoRGB,shaders,scene);
    isRunning=true;
}

function save()//TODO
{
    if(isRunning==true)
        return;
    let exposure=$("#exposure").val();

    /*
    Texture saveBuffer=new Texture(,,,);
    gl.bindFramebuffer(gl.FRAMEBUFFER,tracer.fbo);
    gl.viewport(0, 0, parameters.offscreenBufferWidth , parameters.offscreenBufferHeight );
    gl.clearColor(0, 0, 0, 1); 
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.disable(gl.CULL_FACE);
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, saveBuffer.get(), 0);
    offscreenBuffer.bind(gl,0);
    shaders.renderScreenBuffer.bind(gl);
    shaders.renderScreenBuffer.setUniform("exposure",Math.pow(2.0,exposure));
    shaders.renderScreenBuffer.setUniform("rays",rays);
    shaders.renderScreenBuffer.setUniform("buffer",0);
    shaders.renderScreenBuffer.bindUniforms(gl);
    ext.bindVertexArrayOES(geometry.screen.vao);
    gl.drawArrays(gl.TRIANGLES,0,geometry.screen.count);
    gl.framebufferTexture2D(
            gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, null, 0);
    Texture.unbind(gl,0);
    let output=[];
    */
    //create buffer texture
    //render to it
    //save it
    //destory buffer
}
function getCorrectSize(screenW:number, screenH:number, 
    imgW:number, imgH:number):{w:number,h:number,x:number,y:number}
{
	let screenRatio = (screenW) / (screenH);
	let imageRatio = (imgW) / (imgH);
	let sizePos={w:0,h:0,x:0,y:0};
    if (imageRatio > screenRatio)
    {
        sizePos.w = screenW;// float(baseImage.getWidth());
        sizePos.h = screenW / imageRatio;
        sizePos.x = 0;
        sizePos.y = (screenH - sizePos.h) / 2;
    }
    else
    {
        sizePos.w = imageRatio*screenH;
        sizePos.h = screenH;
        sizePos.x = (screenW - sizePos.w) / 2;
        sizePos.y=0
    }
	return sizePos;
}
function resize(canvas:any):void {
    // Lookup the size the browser is displaying the canvas.
    var displayWidth  = canvas.clientWidth;
    var displayHeight = canvas.clientHeight;
  
    // Check if the canvas is not the same size.
    if (canvas.width  != displayWidth ||
        canvas.height != displayHeight) {
  
      // Make the canvas the same size
      canvas.width  = displayWidth;
      canvas.height = displayHeight;
    }
  }
function renderOffscreenBuffer()
{
    let exposure:number = ui.getExposure() as number;

    let ext=extensions.vaoExt;
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);
    resize(gl.canvas);
    let sizePos=getCorrectSize(gl.drawingBufferWidth,
        gl.drawingBufferHeight,
        parameters.offscreenWidth,
        parameters.offscreenHeight);
    gl.viewport(sizePos.x, sizePos.y, sizePos.w , 
        sizePos.h );
    gl.clearColor(0, 0, 0, 1); 
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.disable(gl.CULL_FACE);
    offscreenBuffer.bind(gl,0);
    shaders.renderScreenBuffer.bind(gl);
    shaders.renderScreenBuffer.setUniform("exposure",Math.pow(2.0,exposure));
    shaders.renderScreenBuffer.setUniform("rays",rays);
    shaders.renderScreenBuffer.setUniform("buffer",0);
    shaders.renderScreenBuffer.bindUniforms(gl);
    ext.bindVertexArrayOES(geometry.screen.vao);
    gl.drawArrays(gl.TRIANGLES,0,geometry.screen.count);
    Texture.unbind(gl,0);
}
function computeBatch()
{
    for(let i=0;i<parameters.passesPerBatch&&tracer.passes<parameters.passes;i++)
    {
        tracer.computePass();
    }
    let progress=tracer.passes*100/parameters.passes;
    ui.setProgress(progress);
    rays=tracer.passes;
    if(tracer.passes>=parameters.passes)
    {
        tracer.postRender();
        tracer.destroy();
        isRunning=false;
        //play sound
        ui.playAudio();
    }
}
function draw()
{
    if(isRunning)
    {
        computeBatch();
    }
    renderOffscreenBuffer();
    window.requestAnimationFrame(draw);
}

init();