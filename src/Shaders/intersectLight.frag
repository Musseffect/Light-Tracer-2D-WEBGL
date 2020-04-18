precision mediump float;

uniform sampler2D in_ro_rd;
uniform sampler2D in_t_mat_normal;
uniform mat3 transform;
uniform int lightType;
uniform float angle;

varying vec2 uv;

#define POINT 0
#define POINTDIR 1
#define POINTANG 2
#define CIRCLE 3
#define CIRCLEANG 4
#define LINE 5
#define LINEDIR 6

struct Ray2D
{
    vec2 ro;
    vec2 rd;
};

Ray2D worldToLocal(mat3 transform, in Ray2D ray)
{
	Ray2D result;
	result.ro = vec2(transform*vec3(ray.ro, 1.0));
	result.rd = vec2(transform*vec3(ray.rd, 0.0));
	return result;
}

float intersectLight(Ray2D ray,mat3 transform)
{
    ray = worldToLocal(transform, ray);
    if(lightType==CIRCLE)
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
			return t;
		}
    }else if(lightType==CIRCLEANG)
    {
		float a = dot(ray.rd, ray.rd);
		float b = dot(ray.rd, ray.ro);
		float c = dot(ray.ro, ray.ro) - 1.0;
		float d = b * b - c * a;
		if (d >= 0.0)
		{
			float ax = -cos(angle);
			d = sqrt(d);
			float t = (-b - d) / a;
			if (t < 0.0)
			{
				t = (-b + d) / a;
			}
			else
			{
				vec2 p = ray.ro + ray.rd*t;
				if (p.x < ax)
				{
					t = (-b + d) / a;
					p = ray.ro + ray.rd*t;
					if (p.x < ax)
						return -1.0;
				}
			}
			return t;
		}
    }else if(lightType==LINE||lightType==LINEDIR)
    {
		float t = (-ray.ro.x) / ray.rd.x;
		if (t >= 0.0)
		{
			vec2 point = ray.ro + ray.rd*t;
			if (abs(point.y) <= 0.5)
			{
				return t;
			}
		}
    }
    return -1.0;
}


void main()
{
    vec4 ray=texture2D(in_ro_rd,uv);
    vec4 t_mat_normal=texture2D(in_t_mat_normal,uv);

    Ray2D ray2d = Ray2D(ray.xy,ray.zw);

    float t = intersectLight(ray2d,transform);
    if(t<t_mat_normal.x&&t>=0.0)
    {
        t_mat_normal.x=-1.0;
        t_mat_normal.y=-1.0;
    }
    gl_FragColor=vec4(t_mat_normal);
}