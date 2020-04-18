
uniform vec4 sceneBound;

attribute vec2 in_pos;

uniform mat3 transform;


void main()
{
    vec3 pos=(transform*vec3(in_pos,1.0));
    pos.xy=(pos.xy/pos.z-sceneBound.xy)/(sceneBound.zw-sceneBound.xy);
    gl_Position=vec4(pos.xy*2.0-1.0,0.0,1.0);
}