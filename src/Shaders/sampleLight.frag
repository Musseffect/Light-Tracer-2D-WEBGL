#extension GL_EXT_draw_buffers : require 
#define PI 3.1415926535898
precision highp float;
precision highp int;

uniform sampler2D in_rng;
uniform sampler2D rho_RGB;

uniform vec3 lightColor;
uniform int type;
uniform float angle;
uniform mat3 invTransform;
uniform float lightCount;
uniform float seed;


/*out vec4 out_ro_rd;
out vec4 out_color;
out float out_rng;*/

varying vec2 uv;

#define POINT 0
#define POINTDIR 1
#define POINTANG 2
#define CIRCLE 3
#define CIRCLEANG 4
#define LINE 5
#define LINEDIR 6

#define spectrumLow 380.0
#define spectrumHigh 730.0


struct Ray2D
{
    vec2 ro;
    vec2 rd;
};

//http://www.aussiedwarf.com/2017/05/09/Random10Bit
float rand(vec2 state)
{
    vec3 product = vec3(  sin( dot(state, vec2(0.129898,0.78233))),
                        sin( dot(state, vec2(0.689898,0.23233))),
                        sin( dot(state, vec2(0.434198,0.51833))) );
                        
                        
  vec3 weighting = vec3(4.37585453723, 2.465973, 3.18438);

  return fract(dot(weighting, product));
}
float random (vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))*
        43758.5453123);
}
float rand1f(inout vec4 state)
{
    state.x=random(state.xx+seed+gl_FragCoord.yx);
    float ret=state.x;
    state.x+=rand(state.y+gl_FragCoord.yx+seed);
    return ret;
    return random(state.xz);
}

vec2 getUniformCircle(inout vec4 state)
{
	float angle = rand1f(state)*2.0*PI;
	return vec2(cos(angle), sin(angle));
}

Ray2D localToWorld(mat3 invTransform,Ray2D ray)
{
    Ray2D result;
	result.ro = vec2(invTransform*vec3(ray.ro, 1.0));
	result.rd = vec2(invTransform*vec3(ray.rd, 0.0));
    return result;
}

Ray2D sample(inout vec4 state,out float pdf)
{
    Ray2D ray;
    if(type==POINT)
    {
        ray.ro = vec2(0.0, 0.0);
        ray.rd = getUniformCircle(state);
        pdf = 1.0/(2.0*PI);
    }else if(type==POINTDIR)
    {
        ray.ro = vec2(0.0, 0.0);
        ray.rd = vec2(1.0, 0.0);
        pdf = 1.0;
    }else if(type==POINTANG)
    {
        ray.ro = vec2(0.0, 0.0);
        float _angle = (rand1f(state) - 0.5)*angle;
        ray.rd = vec2(cos(_angle), sin(_angle));
        pdf = 1.0 / (angle);
    }else if(type==CIRCLE)
    {
        ray.ro = getUniformCircle(state);
        ray.rd = getUniformCircle(state);
        pdf = 1.0/(4.0*PI*PI);
    }else if(type==CIRCLEANG)
    {
        float _angle = (rand1f(state) - 0.5)*angle;
        ray.ro = vec2(cos(_angle), sin(_angle));
        ray.rd = getUniformCircle(state);
        pdf = 1.0 / (angle*PI*2.0);
    }else if(type==LINE)
    {
        ray.ro = vec2(0.0, rand1f(state) - 0.5);
        ray.rd = getUniformCircle(state);
        pdf = 1.0/(2.0*PI);//unit length line
    }else if(type==LINEDIR)
    {
        ray.ro = vec2(0.0, rand1f(state) - 0.5);
        ray.rd = vec2(1.0, 0.0);
        pdf = 1.0;//unit length line
    }
	ray = localToWorld(invTransform, ray);
	ray.rd = normalize(ray.rd);
	return ray;
}

float xFit_1931(float wave)
{
	float t1 = (wave - 442.0)*((wave < 442.0) ? 0.0624 : 0.0374);
	float t2 = (wave - 599.8)*((wave < 599.8) ? 0.0264 : 0.0323);
	float t3 = (wave - 501.1)*((wave < 501.1) ? 0.0490 : 0.0382);
	return 0.362*exp(-0.5*t1*t1) + 1.056*exp(-0.5*t2*t2)
		- 0.065*exp(-0.5*t3*t3);
}

float yFit_1931(float wave)
{
	float t1 = (wave - 568.8)*((wave < 568.8) ? 0.0213 : 0.0247);
	float t2 = (wave - 530.9)*((wave < 530.9) ? 0.0613 : 0.0322);
	return 0.821*exp(-0.5*t1*t1) + 0.286*exp(-0.5*t2*t2);
}

float zFit_1931(float wave)
{
	float t1 = (wave - 437.0)*((wave < 437.0) ? 0.0845 : 0.0278);
	float t2 = (wave - 459.0)*((wave < 459.0) ? 0.0385 : 0.0725);
	return 1.217*exp(-0.5*t1*t1) + 0.681*exp(-0.5*t2*t2);
}

vec3 XYZToRGB(vec3 xyz)
{
	mat3 XYZ_to_RGB=mat3(2.3706743, -0.9000405, -0.4706338,
		-0.5138850, 1.4253036, 0.0885814,
		0.0052982, -0.0146949, 1.0093968);
	return xyz*XYZ_to_RGB;
}

float toWaveIntensity(vec3 rgb, float wavelength)
{
	float number = (wavelength - 380.0) / (730.0 - 380.0);
	number = max(min(1.0, number), 0.0);
	/*float bin = floor(number * 35.0);
	float next = min(35., bin + 1.);*/
    float bin=number*35.0;
    /*vec3 rhoBin = texture2D(rho_RGB,vec2((2.0*bin+1.)/72.,0.5)).xyz;
    vec3 rhoNext = texture2D(rho_RGB,vec2((2.0*next+1.)/72.0,0.5)).xyz;*/
    vec3 rho=texture2D(rho_RGB,vec2((2.0*bin+1.)/72.,0.5)).xyz;
    return dot(rho,rgb);
	/*return dot(
        mix(rhoBin, 
        rhoNext, 
    fract(number*35.0))
    , rgb);*/
}


void main()
{
    vec4 rng = texture2D(in_rng,uv);
    float pdf=1.0;
    Ray2D ray=sample(rng,pdf);
    pdf=pdf/lightCount;
	ray.ro += ray.rd*0.001;
	float wavelength = mix(spectrumHigh, spectrumLow, rand1f(rng));
	float intensity = toWaveIntensity(lightColor, wavelength)*pdf;
    vec3 color=intensity*max(XYZToRGB(vec3(xFit_1931(wavelength), yFit_1931(wavelength), zFit_1931(wavelength))), 0.0);
    
    gl_FragData[0]=vec4(ray.ro,ray.rd);
    gl_FragData[1]=vec4(color,wavelength);
    gl_FragData[2]=vec4(rng);
    /*
    out vec4 out_ro_rd;
    out vec4 out_color;
    out float out_rng;
    */
}