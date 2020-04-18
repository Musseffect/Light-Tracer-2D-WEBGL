
export const ObjectType=
{
  CIRCLE:0,
  LINE:1
};
export const NormalType=
{
  F:0,
  B:1,
  FB:2
};
export const LightType=
{
  POINT:0,
  POINTDIR:1,
  POINTANG:2,
  CIRCLE:3,
  CIRCLEANG:4,
  LINE:5,
  LINEDIR:6
};


const MaterialType=
{
  DIFFUSEREFL:0,
  DIFFUSETRANS:1,
  DIFFUSEMIX:2,
  SPECULARREFL:3,
  SPECULARTRANSM:4,
  SPECULARGLASS:5,
  SPECULARMIX:6
};





function generateMaterialFunction(material:any)
{
  let functionCall="";
  switch(material.type)
  {
    case MaterialType.DIFFUSEREFL:
      functionCall=`diffuseRefl(inout Ray2D ray,inout vec2 pos, inout vec3 color,
        vec2 normal,inout vec4 rand,
        float rIndex,`+material.rColor+`);`;
      break;
    case MaterialType.DIFFUSETRANS:
        functionCall=`diffuseRefl(inout Ray2D ray,inout vec2 pos, inout vec3 color,
          vec2 normal,inout vec4 rand,
          float rIndex,`+material.tColor+`);`;
    break;
    case MaterialType.DIFFUSEMIX:
        functionCall=`diffuseRefl(inout Ray2D ray,inout vec2 pos, inout vec3 color,
          vec2 normal,inout vec4 rand,
          float rIndex,`+material.rColor+","+material.tColor+","+material.kt+`);`;
    break;
    case MaterialType.SPECULARREFL:
        functionCall=`diffuseRefl(inout Ray2D ray,inout vec2 pos, inout vec3 color,
          vec2 normal,inout vec4 rand,
          float rIndex,`+material.rColor+`);`;
    break;
    case MaterialType.SPECULARTRANSM:
        functionCall=`diffuseRefl(inout Ray2D ray,inout vec2 pos, inout vec3 color,
          vec2 normal,inout vec4 rand,
          float rIndex,`+material.tColor+`);`;
    break;
    case MaterialType.SPECULARGLASS:
        functionCall=`diffuseRefl(inout Ray2D ray,inout vec2 pos, inout vec3 color,
          vec2 normal,inout vec4 rand,
          float rIndex,`+material.rColor+","+material.tColor+`);`;
          break;
    case MaterialType.SPECULARMIX:
        functionCall=`diffuseRefl(inout Ray2D ray,inout vec2 pos, inout vec3 color,
          vec2 normal,inout vec4 rand,
          float rIndex,`+material.rColor+","+material.tColor+","+material.kt+`);`;
    break;
  }
  return functionCall;
}

function setupMaterials(materials:any[])
{
  let shader=`sampleMaterial(int material,inout Ray2D ray){`;
  for(let i=0;i<materials.length;i++)
  {
    shader+="if(material=="+i+"){"+generateMaterialFunction(materials[i])+"}";
    if(i!=materials.length-1)
    {
      shader+="else ";
    }
  }
  shader+="}";
}