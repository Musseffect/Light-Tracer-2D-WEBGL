precision mediump float;

varying vec3 color;
varying float alpha;

void main()
{
    gl_FragColor=vec4(color,0.0);
}