
uniform sampler2D in_pos_1;
uniform sampler2D in_pos_2;
uniform sampler2D in_colorData;

uniform vec4 sceneBound;

attribute vec3 uv_vert;

varying vec3 color;
varying float alpha;

void main()
{
    vec2 pos_1=texture2D(in_pos_1,uv_vert.xy).xy;
    vec2 pos_2=texture2D(in_pos_2,uv_vert.xy).xy;
    pos_1=(pos_1-sceneBound.xy)/(sceneBound.zw-sceneBound.xy)*2.0-1.0;
    pos_2=(pos_2-sceneBound.xy)/(sceneBound.zw-sceneBound.xy)*2.0-1.0;
    vec2 position=mix(pos_1,pos_2,uv_vert.z);

    vec2 dir=pos_2-pos_1;
    alpha=length(dir)/max(abs(dir.x),abs(dir.y));
    color=texture2D(in_colorData,uv_vert.xy).xyz*alpha;
    gl_Position=vec4(position,0.0,1.0);
}