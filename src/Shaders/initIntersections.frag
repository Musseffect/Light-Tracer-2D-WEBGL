
precision mediump float;


//out vec4 out_t_mat_normal; gl_FragColor

varying vec2 uv;

void main()
{
    vec4 t_mat_normal;
    t_mat_normal.x=10e8;
    t_mat_normal.y=-2.0;
    t_mat_normal.zw=vec2(0.0);
    gl_FragColor=vec4(t_mat_normal);
}