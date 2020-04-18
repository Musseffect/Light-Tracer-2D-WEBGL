
precision mediump float;

uniform sampler2D in_ro_rd;
uniform sampler2D in_t_mat_normal;
uniform mat3 transform;
uniform int materialIndex;
uniform int normalType;

//out vec4 out_t_mat_normal; glFragColor = ;

varying vec2 uv;

struct Ray2D
{
    vec2 ro;
    vec2 rd;
};

#define B 1
#define FB 2

float circle(in Ray2D ray, out vec2 normal)//circle at 0,0 with radius 1
{
	float a = dot(ray.rd, ray.rd);
	float b = dot(ray.rd, ray.ro);
	float c = dot(ray.ro, ray.ro) - 1.0;
	float d = b * b - c * a;
	if (d >= 0.0)
	{
		d = sqrt(d);
		float t = (-b - d) / a;
		if (t < 0.0)
		{
			t = (-b + d) / a;
		}
		normal = normalize(ray.ro + ray.rd*t);
		return t;
	}
	return -1.0;
}

vec2 localToWorldN(mat3 transform,in vec2 normal)
{
	return vec2(vec3(normal, 0.0)*transform);
}

Ray2D worldToLocal(mat3 transform, in Ray2D ray)
{
	Ray2D result;
	result.ro = vec2(transform*vec3(ray.ro, 1.0));
	result.rd = vec2(transform*vec3(ray.rd, 0.0));
	return result;
}

float intersectObject(in Ray2D ray, out vec2 normal)
{
	Ray2D tRay;
	tRay = worldToLocal(transform, ray);
	float t = circle(tRay, normal);
	normal = normalize(localToWorldN(transform, normal));
	return t;
}

void main()
{
    vec4 ray=texture2D(in_ro_rd,uv);
    vec4 t_mat_normal=texture2D(in_t_mat_normal,uv);

    Ray2D ray2d = Ray2D(ray.xy,ray.zw);
    vec2 normal;
    float t = intersectObject(ray2d,normal);
    if(t<=t_mat_normal.x&&t>=0.0)
    {
        if (normalType==B)
		{
                normal = -normal;
		}else if(normalType==FB)
		{
                normal = normal * sign(-dot(normal, ray2d.rd));
		}
        t_mat_normal.x=t;
        t_mat_normal.y=float(materialIndex);
        t_mat_normal.zw=normal;
    }
    gl_FragColor=vec4(t_mat_normal);
}