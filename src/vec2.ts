

class vec2
{
    a:number[];
    constructor(value:number[])
    {
        this.a=value;
    }
    static scalar(s:number):vec2
    {
        return new vec2([s,s]);
    }
    static len(vec:vec2):number
    {
        return Math.sqrt(vec2.dot(vec,vec))
    }
    static dot(vec_1:vec2,vec_2:vec2):number
    {
        return vec_1.a[0]*vec_2.a[0]+vec_1.a[1]*vec_2.a[1];
    }
    static add(vec_1:vec2,vec_2:vec2):vec2
    {
        return new vec2([vec_1.a[0]+vec_2.a[0],vec_1.a[1]+vec_2.a[1]]);
    }
    static sub(vec_1:vec2,vec_2:vec2):vec2
    {
        return new vec2([vec_1.a[0]-vec_2.a[0],vec_1.a[1]-vec_2.a[1]]);
    }
    static distance(vec_1:vec2,vec_2:vec2):number
    {
        return vec2.len(vec2.sub(vec_1,vec_2));
    }
    get(index:number):number
    {
        return this.a[index];
    }
}

export default vec2;