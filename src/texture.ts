
interface ITextureParameter
{
    key:number,
    value:number
}
class Texture
{
    tex:number;
    constructor(gl:any,level:number,internalFormat:number,
        width:number,height:number,border:number,
        srcFormat:number,srcType:number,pixels:any,parameters?:ITextureParameter[])   
    {
        this.tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D,this.tex);
        gl.texImage2D(gl.TEXTURE_2D,level,internalFormat,width,height, border,srcFormat,srcType,pixels);
        if(parameters!=undefined)
            parameters.forEach(function(item:ITextureParameter)
            {
                gl.texParameteri(gl.TEXTURE_2D,item.key,item.value);
            });
    }
    bind(gl:any,unit:number):void
    {
        gl.activeTexture(gl.TEXTURE0+unit);
        gl.bindTexture(gl.TEXTURE_2D,this.tex);
    }
    static unbind(gl:any,unit:number):void
    {
        gl.activeTexture(gl.TEXTURE0+unit);
        gl.bindTexture(gl.TEXTURE_2D,null);
    }
    get():number
    {
        return this.tex;
    }
    destroy(gl:any):void
    {
        gl.deleteTexture(this.tex);
    }
}

export default Texture;