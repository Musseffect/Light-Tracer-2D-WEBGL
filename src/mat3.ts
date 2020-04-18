
// @ts-ignore
import vec2 from './vec2.ts';

//column major
class mat3
{
    value:number[];
    constructor(values:number[])
    {
        this.value=values.slice();
    }
    static createMat3(values:number[]):mat3
    {
        return new mat3(values.slice());
    }
    static identity():mat3
    {
        let mat=new mat3([1.0,0.0,0.0,
            0.0,1.0,0.0,
            0.0,0.0,1.0]);
        return mat;
    }
    static translate(mat:mat3,translate:vec2):mat3
    {
        let arr=mat.value.slice();
        arr[6]=arr[0]*translate.get(0)+arr[3]*translate.get(1)+arr[6];
        arr[7]=arr[1]*translate.get(0)+arr[4]*translate.get(1)+arr[7];
        arr[8]=arr[2]*translate.get(0)+arr[5]*translate.get(1)+arr[8];
        return new mat3(arr);
    }
    static rotate(mat:mat3,angle:number):mat3
    {
        let c=Math.cos(angle);
        let s=Math.sin(angle);
        let arr=mat.value.slice();
        for(let i=0;i<3;i++)
        {
            arr[i]=mat.value[i]*c+mat.value[3+i]*s;
            arr[i+3]=mat.value[i]*-s+mat.value[i+3]*c;
        }
        return new mat3(arr);
    }
    static scale(mat:mat3,scale:vec2):mat3
    {
        let arr=mat.value.slice();
        for(let i=0;i<3;i++)
            arr[i]*=scale.get(0);
        for(let i=3;i<6;i++)
            arr[i]*=scale.get(1);
        return new mat3(arr);
    }
    static inverse(mat:mat3):mat3
    {
        let adj=[0,0,0,
        0,0,0,
        0,0,0];
        adj[0]=mat.value[4]*mat.value[8]-mat.value[5]*mat.value[7];
        adj[1]=mat.value[2]*mat.value[7]-mat.value[1]*mat.value[8];
        adj[2]=mat.value[1]*mat.value[5]-mat.value[2]*mat.value[4];
        adj[3]=mat.value[5]*mat.value[6]-mat.value[3]*mat.value[8];
        adj[4]=mat.value[0]*mat.value[8]-mat.value[2]*mat.value[6];
        adj[5]=mat.value[3]*mat.value[2]-mat.value[0]*mat.value[5];
        adj[6]=mat.value[3]*mat.value[7]-mat.value[4]*mat.value[6];
        adj[7]=mat.value[6]*mat.value[1]-mat.value[0]*mat.value[7];
        adj[8]=mat.value[0]*mat.value[4]-mat.value[1]*mat.value[3];

        let det=mat.value[0]*mat.value[4]*mat.value[8]+
        mat.value[2]*mat.value[3]*mat.value[7]+
        mat.value[6]*mat.value[1]*mat.value[5]-
        mat.value[2]*mat.value[4]*mat.value[6]-
        mat.value[1]*mat.value[3]*mat.value[8]-
        mat.value[0]*mat.value[5]*mat.value[7];
        for(let i=0;i<9;i++)
        {
            adj[i]=adj[i]/det;
        }
        return new mat3(adj);
    }
    get(i:number,j:number):number
    {
        return this.value[j+i*3];
    }
    array():number[]
    {
        return this.value;
    }
}


export default mat3;