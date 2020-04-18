#extension GL_EXT_draw_buffers : require 

precision highp float;

uniform sampler2D in_ro_rd;
uniform sampler2D in_color;
uniform sampler2D in_t_mat_normal;
uniform sampler2D in_rng;
uniform float seed;

#define EPS 0.0005



varying vec2 uv;

struct Ray2D
{
    vec2 ro;
    vec2 rd;
};


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
    state.y=rand(state.yz+seed);
    return random(state.yw+gl_FragCoord.xy);
}

vec2 getCosDistribution(vec2 dir, inout vec4 rand)
{
	vec2 normal=vec2(-dir.y, dir.x);
	float x = rand1f(rand)*2.0 - 1.0;
	return normal * x + dir * sqrt(1.0 - x * x);
}

void swap(inout float a,inout float b)
{
    float temp=a;
    a=b;
    b=temp;
}

float frDielectric(float cosThetaI, float etaI, float etaT)
{
	cosThetaI = clamp(cosThetaI, -1.0, 1.0);
	bool outside = cosThetaI > 0.0;
	if (!outside)
	{
		swap(etaI, etaT);
		cosThetaI = abs(cosThetaI);
	}
	float sinThetaI = sqrt(max(0.0, 1.0 - cosThetaI * cosThetaI));
	float sinThetaT = etaI / etaT * sinThetaI;
	float cosThetaT = sqrt(max(0.0, 1.0 - sinThetaT * sinThetaT));
	float rparl = (etaT*cosThetaI - etaI * cosThetaT) /
		(etaT*cosThetaI + etaI * cosThetaT);
	float rperp = ((etaI * cosThetaI) - (etaT * cosThetaT)) /
		((etaI * cosThetaI) + (etaT * cosThetaT));
	return (rparl*rparl + rperp * rperp)*0.5;
}

void sampleDiffuseRefl(inout Ray2D ray,inout vec2 pos, inout vec3 color,
vec2 normal,inout vec4 rand,
vec3 r)
{
    vec2 wo = getCosDistribution(normal, rand);
    float dt = dot(wo, normal);
    vec3 f = r*0.5;
    float dotn=dot(normal,-ray.rd);
    if (dotn <= 0.0)
    {
        f=vec3(0.0);
    }
    float pdf = abs(dt)*0.5;
	color *= f * abs(dt) / pdf;
	ray.ro = pos + normal*sign(dt)*EPS;//new position
	ray.rd = wo;
}
void sampleDiffuseTrans(inout Ray2D ray,inout vec2 pos, inout vec3 color,
vec2 normal,inout vec4 rand,
vec3 t)
{
    float dotn=dot(normal,-ray.rd);
    vec2 wo = getCosDistribution(-normal*sign(dotn), rand);
    float dt = dot(wo, normal);
    vec3 f = t*0.5;
    float pdf = abs(dt)*0.5;
	color *= f * abs(dt) / pdf;
	ray.ro = pos + normal*sign(dot(wo, normal))*EPS;//new position
	ray.rd = wo;
}
void sampleSpecularRefl(inout Ray2D ray,inout vec2 pos, inout vec3 color,
vec2 normal,inout vec4 rand,
float rIndex,vec3 r)
{
    vec2 wo = reflect(ray.rd, normal);
    float dt = dot(wo, normal);
    float dotn=dot(normal,-ray.rd);
    vec3 f = r*frDielectric(dotn, 1.0, rIndex) / abs(dt);
    if (dotn <= 0.0)
    {
        f = vec3(0.);
    }
    float pdf = 1.0;
	color *= f * abs(dt) / pdf;
	ray.ro = pos + normal*sign(dot(wo, normal))*EPS;//new position
	ray.rd = wo;
}
void sampleSpecular(inout Ray2D ray,inout vec2 pos, inout vec3 color,
vec2 normal,inout vec4 rand,
float rIndex,vec3 r,vec3 t)
{
    float etaA = 1.0;
    float etaB = rIndex;
    float dotn=dot(normal,-ray.rd);
    float F = frDielectric(dotn, etaA, etaB);
    float c = rand1f(rand);
    vec2 wo;
    float pdf;
    vec3 f;
    if (c < F)
    {
        wo = reflect(ray.rd, normal);
        float dt = dot(wo, normal);
        pdf = F;
        f = F * r / abs(dt);
    }
    else
    {
        bool entering = dotn < 0.0;
        float etaI = entering ? etaA : etaB;
        float etaT = entering ? etaB : etaA;
        wo = refract(ray.rd, normal*sign(dotn), etaI / etaT);
        float dt = dot(wo, normal);
        vec3 ft = t * (1.0 - F);
        pdf = 1.0 - F;
        if (dot(wo,wo) < 0.01)
            f = vec3(0.0);
        else
            f = ft / abs(dt);
        //rayInfo.speed = rayInfo.speed*(etaT / etaI);
    }
    float dt = dot(wo, normal);
	color *= f * abs(dt) / pdf;
	ray.ro = pos + normal*sign(dot(wo, normal))*EPS;//new position
	ray.rd = wo;
}

float getRefractionIndex(float wave, vec3 b, vec3 c)
{
	float waveSqr = wave * wave;
	vec3 num = b * waveSqr;
	vec3 denum = waveSqr - c;
	num = num / denum;
	return sqrt(1.0 + dot(num, vec3(1.0)));
}

void main()
{
    vec4 tmn=texture2D(in_t_mat_normal,uv);
    vec4 color=texture2D(in_color,uv);
    vec4 rng = texture2D(in_rng,uv);
    vec4 ro_rd=texture2D(in_ro_rd,uv);
    Ray2D ray=Ray2D(ro_rd.xy,ro_rd.zw);
    float t=tmn.x;
    int mat=int(tmn.y);
    vec2 normal=tmn.zw;
    vec2 hitPos=ray.ro+ray.rd*t;
    if(mat==0)
    {
        float index=getRefractionIndex(color.w/ 1000.0,vec3(1.029607, 0.1880506, 0.736488165),
        vec3(0.00516800155, 0.0166658798, 138.964129));
        
        sampleSpecular(ray,hitPos,color.xyz,normal,rng,index,vec3(0.95),vec3(0.95));
        //sampleDiffuseRefl(ray,hitPos,color.xyz,normal,rng,vec3(1.0,0.0,1.0));
    }else if(mat==1)
    {
        sampleSpecularRefl(ray,hitPos,color.xyz,normal,rng,1.5,vec3(1.0,0.0,1.0));
    }
    if(mat<0)
    {
        rand1f(rng);
        color.xyz=vec3(0.0);
        ray.ro=ray.ro+ray.rd*100.0;
    }
    gl_FragData[0]=vec4(ray.ro,ray.rd);//out_ro_rd;
    gl_FragData[1]=color;//out_color
    gl_FragData[2]=vec4(rng);//out_rng
}