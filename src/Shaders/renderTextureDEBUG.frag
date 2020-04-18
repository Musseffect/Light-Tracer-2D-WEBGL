
precision mediump float;

uniform sampler2D in_tex;

varying vec2 uv;

float toWaveIntensity(vec3 rgb, float wavelength)
{
	float number = (wavelength - 380.0) / (730.0 - 380.0);
	number = max(min(1.0, number), 0.0);
	/*float bin = floor(number * 35.0);
	float next = min(35., bin + 1.);*/
    float bin=number*35.0;
    /*vec3 rhoBin = texture2D(rho_RGB,vec2((2.0*bin+1.)/72.,0.5)).xyz;
    vec3 rhoNext = texture2D(rho_RGB,vec2((2.0*next+1.)/72.0,0.5)).xyz;*/
    vec3 rho=texture2D(in_tex,vec2((2.0*bin+1.)/72.,0.5)).xyz;
    return dot(rho,rgb);
	/*return dot(
        mix(rhoBin, 
        rhoNext, 
    fract(number*35.0))
    , rgb);*/
}

void main()
{
    gl_FragColor=vec4(texture2D(in_tex,uv).xy,0.0,0.0);
    //gl_FragColor=vec4(vec3(toWaveIntensity(vec3(1.0,0.0,0.0),mix(380.0,730.0,uv.x))),0.0);
}


