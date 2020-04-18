
attribute vec2 in_pos;

varying vec2 uv;

void main()
{
    gl_Position=vec4(in_pos*2.0-1.0,0.0,1.0);//
    uv=in_pos;
}