// @ts-ignore
import Texture from "./texture.ts";
const ObjectType=
{
  CIRCLE:0,
  LINE:1
};
const NormalType=
{
  F:0,
  B:1,
  FB:2
};
const LightType=
{
  POINT:0,
  POINTDIR:1,
  POINTANG:2,
  CIRCLE:3,
  CIRCLEANG:4,
  LINE:5,
  LINEDIR:6
};
class Tracer
{
    fbo:number;
    textures:any;
    counters:any;
    geometry:any;
    offscreenBuffer:Texture;
    parameters:any;
    gl:any;
    rhoRGB:Texture;
    shaders:any;
    scene:any;
    extensions:any;
    passes:number;
    constructor(gl:any,extensions:any,geometry:any,parameters:any,offscreenBuffer:Texture,rhoRGB:Texture,shaders:any,scene:any)
    {
        this.passes=0;
        this.gl=gl;
        this.extensions=extensions;
        this.scene=scene;
        this.rhoRGB=rhoRGB;
        this.shaders=shaders;
        this.parameters=parameters;
        this.offscreenBuffer=offscreenBuffer;
        this.geometry={};
        this.textures={
            ro_rd:[],
            color:[],
            t_mat_normal:[],
            rng_state:[]
        };
        this.fbo=gl.createFramebuffer();
        {
            let vertexArray=[];
            let height=parameters.gpuBufferHeight;
            let width=parameters.gpuBufferWidth;
            for(let j=0;j<height;j++)
            {
                for(let i=0;i<width;i++)
                {
                  let uv=[0.0,0.0];
                  uv[0]=(2.0*i+1.0)/(width*2.0);
                  uv[1]=(2.0*j+1.0)/(height*2.0);
                  vertexArray.push(uv[0]);
                  vertexArray.push(uv[1]);
                  vertexArray.push(0.0);
                  vertexArray.push(uv[0]);
                  vertexArray.push(uv[1]);
                  vertexArray.push(1.0);
                }
              }
              //create array buffer
              let vao=extensions.vaoExt.createVertexArrayOES();
              extensions.vaoExt.bindVertexArrayOES(vao);
              let vbo = gl.createBuffer();
              gl.bindBuffer(gl.ARRAY_BUFFER,vbo);
              gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexArray), gl.STATIC_DRAW);
              gl.enableVertexAttribArray(0);
              gl.vertexAttribPointer(0,3,gl.FLOAT,false,0,0);
              this.geometry.lines={vao:vao,vbo:vbo,count:width*height*6};
        }
        this.geometry.screen=geometry.screen;
        this.geometry.lineOutline=geometry.lineOutline;
        this.geometry.circleOutline=geometry.circleOutline;
        let textureParameters=[
            {
                key:gl.TEXTURE_MIN_FILTER,
                value:gl.NEAREST
            },
            {
                key:gl.TEXTURE_MAG_FILTER,
                value:gl.NEAREST
            },
            {
                key:gl.TEXTURE_WRAP_S,
                value:gl.CLAMP_TO_EDGE
            },
            {
                key:gl.TEXTURE_WRAP_T,
                value:gl.CLAMP_TO_EDGE
            }
        ];
        //init ro_rd texture
        {
            this.textures.ro_rd.push(
                new Texture(gl,0,gl.RGBA,parameters.gpuBufferWidth,parameters.gpuBufferHeight,
                    0,gl.RGBA,gl.FLOAT,null,textureParameters)
            );
            this.textures.ro_rd.push(
                new Texture(gl,0,gl.RGBA,parameters.gpuBufferWidth,parameters.gpuBufferHeight,
                    0,gl.RGBA,gl.FLOAT,null,textureParameters)
            );
        }
        //init color texture
        {
        this.textures.color.push(
            new Texture(gl,0,gl.RGBA,parameters.gpuBufferWidth,parameters.gpuBufferHeight,
                0,gl.RGBA,gl.FLOAT,null,textureParameters)
        );
        this.textures.color.push(
            new Texture(gl,0,gl.RGBA,parameters.gpuBufferWidth,parameters.gpuBufferHeight,
                0,gl.RGBA,gl.FLOAT,null,textureParameters)
        );
        }
        //init t_mat_normal texture
        {
            this.textures.t_mat_normal.push(
                new Texture(gl,0,gl.RGBA,parameters.gpuBufferWidth,parameters.gpuBufferHeight,
                    0,gl.RGBA,gl.FLOAT,null,textureParameters)
            );
            this.textures.t_mat_normal.push(
                new Texture(gl,0,gl.RGBA,parameters.gpuBufferWidth,parameters.gpuBufferHeight,
                    0,gl.RGBA,gl.FLOAT,null,textureParameters)
            );
        }
        //init rng_state texture
        {
            let pixels=[];
            let width=parameters.gpuBufferWidth;
            let height=parameters.gpuBufferHeight;
            for(let i=0;i<width*height;i++)
            {  
              pixels.push(Math.random());
              pixels.push(Math.random());
              pixels.push(Math.random());
              pixels.push(Math.random());
            }
            let pixelArray=new Float32Array(pixels);
            this.textures.rng_state.push(
                new Texture(gl,0,gl.RGBA,parameters.gpuBufferWidth,parameters.gpuBufferHeight,
                    0,gl.RGBA,gl.FLOAT,pixelArray,textureParameters)
            );
            this.textures.rng_state.push(
                new Texture(gl,0,gl.RGBA,parameters.gpuBufferWidth,parameters.gpuBufferHeight,
                    0,gl.RGBA,gl.FLOAT,pixelArray,textureParameters)
            );
        }
        this.counters={
            t_mat_normal:0,
            color:0,
            rng_state:0,
            ro_rd:0
        };
    }
    postRender():void
    {
        this.renderOutlines();
    }
    computePass():void
    {
            //sample light
        this.sampleLight();
        for(var j=0;j<=this.parameters.rayDepth;j++)
        {
            //init texture with intersectionData
            this.initIntersectionsBuffer();
            //find intersection
            this.intersectObjects();
            //find intersection with lights
            this.intersectLights();
            //sample brdf
            this.sampleBrdf();
            //render lines
            this.renderLines();
            //this.renderDebug();
        }
        let errorEnum=this.gl.getError();
        if(errorEnum==this.gl.INVALID_FRAMEBUFFER_OPERATION)
        {
            console.log(this.passes);
        }
        this.passes++;
    }
    advanceCounter(key:string)
    {
        this.counters[key]=(this.counters[key]+1)%2;
    }
    sampleLight()
    {
        let {gl,textures,rhoRGB,scene,counters,fbo,geometry,shaders,parameters} = this;
        let ext=this.extensions.drawBuffersExt;
        let vaoExt=this.extensions.vaoExt;

        shaders.sampleLight.bind(gl);
        textures.rng_state[counters.rng_state].bind(gl,0);
        this.advanceCounter("rng_state");
        rhoRGB.bind(gl,1);
        shaders.sampleLight.setUniform("in_rng",0);
        shaders.sampleLight.setUniform("rho_RGB",1);
        var lightIndex = Math.floor(Math.random()*scene.lights.length);
        var light=scene.lights[lightIndex];
        shaders.sampleLight.setUniform("lightColor",light.color);
        shaders.sampleLight.setUniform("type",light.type);
        shaders.sampleLight.setUniform("angle",light.angle);
        shaders.sampleLight.setUniform("invTransform",light.transform.invMat.array());
        shaders.sampleLight.setUniform("lightCount",scene.lights.length);
        shaders.sampleLight.setUniform("seed",Math.random());
        shaders.sampleLight.bindUniforms(gl);
      
        gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, ext.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D,textures.ro_rd[counters.ro_rd].get(), 0);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, ext.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D,textures.color[counters.color].get(), 0);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, ext.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D,textures.rng_state[counters.rng_state].get(), 0);
        ext.drawBuffersWEBGL([
        ext.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0]
        ext.COLOR_ATTACHMENT1_WEBGL, // gl_FragData[1]
        ext.COLOR_ATTACHMENT2_WEBGL, // gl_FragData[2]
      ]);
        //bind vao
        vaoExt.bindVertexArrayOES(geometry.screen.vao);
        gl.viewport(0, 0,parameters.gpuBufferWidth ,parameters.gpuBufferHeight);
        gl.disable(gl.BLEND);
        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);
        gl.drawArrays(gl.TRIANGLES, 0, geometry.screen.count);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, ext.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D,null, 0);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, ext.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D,null, 0);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, ext.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D,null, 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D,null);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D,null);
    }
    initIntersectionsBuffer()
    {
        let gl=this.gl;
        let ext=this.extensions.vaoExt;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.textures.t_mat_normal[0].get(), 0);
        //console.log(gl.checkFramebufferStatus(gl.FRAMEBUFFER).toString(16));
        this.counters.t_mat_normal=0;
        gl.viewport(0, 0, this.parameters.gpuBufferWidth, this.parameters.gpuBufferHeight);
        gl.disable(gl.BLEND);
        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);
        this.shaders.initIntersections.bind(gl);
        ext.bindVertexArrayOES(this.geometry.screen.vao);
        gl.drawArrays(gl.TRIANGLES,0,this.geometry.screen.count);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D, null, 0);
    }
    intersectObjects()
    {
        let {gl,textures,counters,fbo,geometry,shaders,parameters} = this;
        let ext=this.extensions.vaoExt;
        let self=this;
        gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);
        this.scene.objects.forEach(function(object:any)
        {
            let shader=null;
            switch(object.type)
            {
              case ObjectType.CIRCLE:
                shader=shaders.intersectCircle;
                break;
              case ObjectType.LINE:
                shader=shaders.intersectLine;
                break;
            }
            textures.ro_rd[counters.ro_rd].bind(gl,0);
            textures.t_mat_normal[counters.t_mat_normal].bind(gl,1);
            shader.bind(gl);
            shader.setUniform("in_ro_rd",0);
            shader.setUniform("in_t_mat_normal",1);
            shader.setUniform("transform",object.transform.mat.array());
            shader.setUniform("materialIndex",object.material);
            shader.setUniform("normalType",object.normalType);
            shader.bindUniforms(gl);
            self.advanceCounter("t_mat_normal");
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D,textures.t_mat_normal[counters.t_mat_normal].get(), 0);
            gl.viewport(0,0,parameters.gpuBufferWidth,parameters.gpuBufferHeight);
            gl.disable(gl.BLEND);
            gl.disable(gl.DEPTH_TEST);
            gl.disable(gl.CULL_FACE);
            ext.bindVertexArrayOES(geometry.screen.vao);
            gl.drawArrays(gl.TRIANGLES, 0, geometry.screen.count);
            Texture.unbind(gl,0);
            Texture.unbind(gl,1);
        });
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, null, 0);
    }
    intersectLights()
    {
        let gl=this.gl;
        let ext=this.extensions.vaoExt;
        let self=this;
        let {shaders,textures,counters,fbo,parameters,geometry}=this;
        gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);
        this.scene.lights.forEach(function(light:any)
        {
            let type=light.type;
            if(type!=LightType.POINT||type!=LightType.POINTANG||type!=LightType.POINTDIR)
            {
                shaders.intersectLight.bind(gl);
                textures.ro_rd[counters.ro_rd].bind(gl,0);
                textures.t_mat_normal[counters.t_mat_normal].bind(gl,1);
                self.advanceCounter("t_mat_normal");
                shaders.intersectLight.setUniform("in_ro_rd",0);
                shaders.intersectLight.setUniform("in_t_mat_normal",1);
                shaders.intersectLight.setUniform("transform",light.transform.mat.array());
                shaders.intersectLight.setUniform("lightType",light.type);
                shaders.intersectLight.setUniform("angle",light.angle);
                shaders.intersectLight.bindUniforms(gl);
                let tex=textures.t_mat_normal[counters.t_mat_normal].get();
                gl.framebufferTexture2D(
                    gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
                //console.log(gl.checkFramebufferStatus(gl.FRAMEBUFFER).toString(16));
              
                gl.viewport(0,0,parameters.gpuBufferWidth,parameters.gpuBufferHeight);
                gl.disable(gl.BLEND);
                gl.disable(gl.DEPTH_TEST);
                gl.disable(gl.CULL_FACE);
                ext.bindVertexArrayOES(geometry.screen.vao);
                gl.drawArrays(gl.TRIANGLES, 0, geometry.screen.count);
                Texture.unbind(gl,0);
                Texture.unbind(gl,1);
            }
        });
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, null, 0);
    }
    sampleBrdf()
    {
        let {gl,textures,fbo,geometry,shaders,parameters,counters}=this;
        let ext=this.extensions.drawBuffersExt;
        let vaoExt=this.extensions.vaoExt;
        textures.ro_rd[counters.ro_rd].bind(gl,0);
        textures.color[counters.color].bind(gl,1);
        textures.t_mat_normal[counters.t_mat_normal].bind(gl,2);
        textures.rng_state[counters.rng_state].bind(gl,3);
      
        this.advanceCounter("ro_rd");
        this.advanceCounter("color");
        this.advanceCounter("rng_state");
        
        shaders.sampleBRDF.bind(gl);
        shaders.sampleBRDF.setUniform("in_ro_rd",0);
        shaders.sampleBRDF.setUniform("in_color",1);
        shaders.sampleBRDF.setUniform("in_t_mat_normal",2);
        shaders.sampleBRDF.setUniform("in_rng",3);
        shaders.sampleBRDF.setUniform("seed",Math.random());
        shaders.sampleBRDF.bindUniforms(gl);
        gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, ext.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D,textures.ro_rd[counters.ro_rd].get(), 0);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, ext.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D,textures.color[counters.color].get(), 0);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, ext.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D,textures.rng_state[counters.rng_state].get(), 0);
        ext.drawBuffersWEBGL([
        ext.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0]
        ext.COLOR_ATTACHMENT1_WEBGL, // gl_FragData[1]
        ext.COLOR_ATTACHMENT2_WEBGL // gl_FragData[2]
      ]);
        vaoExt.bindVertexArrayOES(geometry.screen.vao);
        gl.viewport(0,0,parameters.gpuBufferHeight,parameters.gpuBufferHeight);
        gl.disable(gl.BLEND);
        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);
        gl.drawArrays(gl.TRIANGLES, 0, geometry.screen.count);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, ext.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D,null, 0);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, ext.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D,null, 0);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, ext.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D,null, 0);
        Texture.unbind(gl,0);
        Texture.unbind(gl,1);
        Texture.unbind(gl,2);
        Texture.unbind(gl,3);
    }
    renderLines()
    {
        let {gl,textures,offscreenBuffer,fbo,geometry,shaders,parameters,counters}=this;
        let vaoExt=this.extensions.vaoExt;

        gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D,offscreenBuffer.get(), 0);
        
        textures.ro_rd[0].bind(gl,0);
        textures.ro_rd[1].bind(gl,1);
        let colorCounter=(counters.color+1)%2;
        textures.color[colorCounter].bind(gl,2);
      
        shaders.renderLines.bind(gl);
        shaders.renderLines.setUniform("in_pos_1",0);
        shaders.renderLines.setUniform("in_pos_2",1);
        shaders.renderLines.setUniform("in_colorData",2);
        shaders.renderLines.setUniform("sceneBound",parameters.sceneBounds);
        shaders.renderLines.bindUniforms(gl);
      
        gl.viewport(0,0,parameters.offscreenWidth,parameters.offscreenHeight);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE);
        gl.blendEquation(gl.FUNC_ADD);
        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);
      
        vaoExt.bindVertexArrayOES(geometry.lines.vao);
        gl.drawArrays(gl.LINES,0,geometry.lines.count);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D, null, 0);
        Texture.unbind(gl,0);
        Texture.unbind(gl,1);
        Texture.unbind(gl,2);
    }
    renderOutlines()
    {
        let {gl,textures,fbo,geometry,shaders,offscreenBuffer,parameters,counters}=this;
        let vaoExt=this.extensions.vaoExt;
        //NOT IMPLEMENTED
        
        gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D,offscreenBuffer.get(), 0);
        gl.viewport(0,0,parameters.offscreenWidth,parameters.offscreenHeight);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE);
        gl.blendEquation(gl.FUNC_ADD);
        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);
        
        shaders.renderOutline.bind(gl);
        shaders.renderOutline.setUniform("sceneBound",parameters.sceneBounds);
        this.scene.objects.forEach(function(object:any)
        {
            let objectGeometry=null;
            switch(object.type)
            {
              case ObjectType.CIRCLE:
                objectGeometry=geometry.circleOutline;
                break;
              case ObjectType.LINE:
                objectGeometry=geometry.lineOutline;
                break;
            }
            shaders.renderOutline.setUniform("transform",object.transform.invMat.array());
            shaders.renderOutline.bindUniforms(gl);
            vaoExt.bindVertexArrayOES(objectGeometry.vao);
            gl.drawArrays(gl.LINE_STRIP,0,objectGeometry.count);
        });
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D, null, 0);
    }
    destroy()
    {
        let{gl,fbo,textures,geometry,extensions} = this;
        gl.deleteFramebuffer(fbo);
        textures.ro_rd[0].destroy(gl);
        textures.ro_rd[1].destroy(gl);
        textures.color[0].destroy(gl);
        textures.color[1].destroy(gl);
        textures.rng_state[0].destroy(gl);
        textures.rng_state[1].destroy(gl);
        textures.t_mat_normal[0].destroy(gl);
        textures.t_mat_normal[1].destroy(gl);
        
        extensions.vaoExt.deleteVertexArrayOES(geometry.lines.vao);
        gl.deleteBuffer(geometry.lines.vbo);
    }
    renderDebug()
    {
      let {gl,textures,fbo,geometry,shaders,parameters,counters}=this;
      let vaoExt=this.extensions.vaoExt;
    
      
      gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D,this.offscreenBuffer.get(), 0);
      //console.log(gl.checkFramebufferStatus(gl.FRAMEBUFFER).toString(16));
    
      //this.textures.color[1].bind(gl,0);
      textures.rng_state[counters.rng_state].bind(gl,0);

      shaders.renderTextureDEBUG.bind(gl);
      shaders.renderTextureDEBUG.setUniform("in_tex",0);
      shaders.renderTextureDEBUG.bindUniforms(gl);
    
      gl.viewport(0,0,parameters.offscreenWidth,parameters.offscreenHeight);
      gl.disable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.blendEquation(gl.FUNC_ADD);
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.CULL_FACE);
    
      vaoExt.bindVertexArrayOES(geometry.screen.vao);
      gl.drawArrays(gl.TRIANGLES,0,geometry.screen.count);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D, null, 0);
      Texture.unbind(gl,0);
    }
}

export default Tracer;