precision mediump float;

uniform sampler2D buffer;
uniform float exposure;
uniform float rays;
varying vec2 uv;

//out vec3 fragColor;

void main()
{
	const float gamma = 2.2;
	vec4 bufferColor = texture2D(buffer,uv);
	vec3 color = vec3(bufferColor.rgb)/rays;
	vec3 mapped = vec3(1.0) - exp(-color * exposure);
    mapped = pow(mapped, vec3(1.0 / gamma));
	if(bufferColor.w>0.5)
	{
		mapped=vec3(1.0);
	}
    gl_FragColor = vec4(mapped,1.0);
}