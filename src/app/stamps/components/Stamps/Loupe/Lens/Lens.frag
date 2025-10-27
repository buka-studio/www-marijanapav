// todo: cleanup and simplify
precision highp float;

varying vec2 vQuadUV;

uniform sampler2D uSourceTex;
uniform vec2 uSourceSizePx;
uniform vec2 uLensCenterPx;
uniform float uLensMagnification;
uniform float uLensIOR;
uniform float uAberrationAmount;
uniform float uLensThickness;
uniform float uBevelStartR;
uniform float uLensRadiusPx;
uniform float uLensOblateness;
uniform float uRefractionDisplacementScale;

const float IOR_AIR=1.;
const float EPS=1e-6;

vec2 calcPixelOffsetUV(vec2 unitDiskCoords,vec2 invSourceSizePx){
    vec2 pixelOffset=unitDiskCoords*uLensRadiusPx;
    return pixelOffset*invSourceSizePx;
}

vec2 calcMagnificationUVOffset(vec2 unitDiskCoords,vec2 invSourceSizePx){
    return calcPixelOffsetUV(unitDiskCoords,invSourceSizePx)/max(EPS,uLensMagnification);
}

void calcFrontSurfacePointAndNormal(vec2 unitDiskCoords,float zScale,out vec3 frontPoint,out vec3 frontNormal){
    float radiusSq=dot(unitDiskCoords,unitDiskCoords);
    float zAxisDepth=zScale*sqrt(max(0.,1.-radiusSq));
    frontPoint=vec3(unitDiskCoords,zAxisDepth);
    frontNormal=normalize(vec3(unitDiskCoords,zAxisDepth/(zScale*zScale)));
}

bool intersectBackEllipsoid(vec3 rayOrigin,vec3 rayDir,float thickness,float zScale,out vec3 hitPoint){
    vec3 backCenter=vec3(0.,0.,-thickness);
    vec3 originToCenter=rayOrigin-backCenter;
    
    float zScaleSq=zScale*zScale;
    float quadA=dot(rayDir.xy,rayDir.xy)+(rayDir.z*rayDir.z)/zScaleSq;
    float quadB=2.*(dot(originToCenter.xy,rayDir.xy)+(originToCenter.z*rayDir.z)/zScaleSq);
    float quadC=dot(originToCenter.xy,originToCenter.xy)+(originToCenter.z*originToCenter.z)/zScaleSq-1.;
    
    float discriminant=quadB*quadB-4.*quadA*quadC;
    if(discriminant<0.){
        return false;
    }
    
    float sqrtDiscriminant=sqrt(max(0.,discriminant));
    float tNear=(-quadB-sqrtDiscriminant)/(2.*quadA);
    float tFar=(-quadB+sqrtDiscriminant)/(2.*quadA);
    
    float hitTime;
    if(tNear>EPS){
        hitTime=tNear;
    }else{
        hitTime=tFar;
    }
    
    if(hitTime<=0.){
        return false;
    }
    
    hitPoint=rayOrigin+rayDir*hitTime;
    return true;
}

vec3 calcBackEllipsoidNormal(vec3 backPoint,float thickness,float zScale){
    vec3 backCenter=vec3(0.,0.,-thickness);
    vec3 local=backPoint-backCenter;
    float zScaleSq=zScale*zScale;
    
    return normalize(vec3(local.xy,local.z/zScaleSq));
}

vec2 traceRefractionDisplInRadii(vec2 unitDiskCoords,float ior,float zScale,float thickness){
    vec3 frontPoint;
    vec3 frontNormal;
    calcFrontSurfacePointAndNormal(unitDiskCoords,zScale,frontPoint,frontNormal);
    
    vec3 incomingAirDir=vec3(0.,0.,-1.);
    vec3 dirInsideGlass=refract(incomingAirDir,frontNormal,IOR_AIR/ior);
    if(length(dirInsideGlass)<EPS){
        return vec2(0.);
    }
    
    vec3 backSurfacePoint;
    bool didHit=intersectBackEllipsoid(frontPoint,dirInsideGlass,thickness,zScale,backSurfacePoint);
    if(!didHit){
        return vec2(0.);
    }
    
    vec3 backSurfaceNormal=calcBackEllipsoidNormal(backSurfacePoint,thickness,zScale);
    vec3 outgoingAirDir=refract(dirInsideGlass,-backSurfaceNormal,ior/IOR_AIR);
    if(length(outgoingAirDir)<EPS){
        return vec2(0.);
    }
    
    float timeToImagePlane=-backSurfacePoint.z/outgoingAirDir.z;
    vec2 projectedXY=backSurfacePoint.xy+outgoingAirDir.xy*timeToImagePlane;
    
    return(projectedXY-unitDiskCoords)*uRefractionDisplacementScale;
}

vec3 calcShadingNormal(vec2 unitDiskCoords,float zAxisDepth){
    return normalize(vec3(-unitDiskCoords,zAxisDepth));
}

void main(){
    vec2 invSourceSizePx=1./uSourceSizePx;
    
    vec2 sourceCenterUV=uLensCenterPx*invSourceSizePx;
    sourceCenterUV.y=1.-sourceCenterUV.y;
    
    vec2 unitDiskCoords=vQuadUV*2.-1.;
    float radiusSq=dot(unitDiskCoords,unitDiskCoords);
    float radius=sqrt(radiusSq);
    if(radius>1.){
        discard;
    }
    
    float zScale=clamp(uLensOblateness,.2,1.);
    
    vec2 magnificationUVOffset=calcMagnificationUVOffset(unitDiskCoords,invSourceSizePx);
    
    float iorRed=uLensIOR-uAberrationAmount;
    float iorGreen=uLensIOR;
    float iorBlue=uLensIOR+uAberrationAmount;
    
    vec2 displRadiiRed=traceRefractionDisplInRadii(unitDiskCoords,iorRed,zScale,uLensThickness);
    vec2 displRadiiGreen=traceRefractionDisplInRadii(unitDiskCoords,iorGreen,zScale,uLensThickness);
    vec2 displRadiiBlue=traceRefractionDisplInRadii(unitDiskCoords,iorBlue,zScale,uLensThickness);
    
    vec2 displUVRed=calcPixelOffsetUV(displRadiiRed,invSourceSizePx);
    vec2 displUVGreen=calcPixelOffsetUV(displRadiiGreen,invSourceSizePx);
    vec2 displUVBlue=calcPixelOffsetUV(displRadiiBlue,invSourceSizePx);
    
    float rimFeatherAmount=smoothstep(uBevelStartR,1.,radius);
    float edgeDisplAttenuation=1.-rimFeatherAmount*.12;
    
    vec2 uvRed=sourceCenterUV+magnificationUVOffset+displUVRed*edgeDisplAttenuation;
    vec2 uvGreen=sourceCenterUV+magnificationUVOffset+displUVGreen*edgeDisplAttenuation;
    vec2 uvBlue=sourceCenterUV+magnificationUVOffset+displUVBlue*edgeDisplAttenuation;
    
    vec3 refractedCol=vec3(
        texture2D(uSourceTex,uvRed).r,
        texture2D(uSourceTex,uvGreen).g,
        texture2D(uSourceTex,uvBlue).b
    );
    
    float zAxisDepth=sqrt(max(0.,1.-radiusSq));
    vec3 shadingNormal=calcShadingNormal(unitDiskCoords,zAxisDepth);
    vec3 viewDir=vec3(0.,0.,1.);
    vec3 lightDir=normalize(vec3(.35,.55,1.));
    
    float fresnelReflectanceAtNormal=pow((uLensIOR-1.)/(uLensIOR+1.),2.);
    float viewDotNormal=clamp(dot(viewDir,shadingNormal),0.,1.);
    float fresnel=fresnelReflectanceAtNormal+(1.-fresnelReflectanceAtNormal)*pow(1.-viewDotNormal,5.);
    
    vec3 halfVec=normalize(viewDir+lightDir);
    float specular=pow(max(dot(shadingNormal,halfVec),0.),80.)*.35;
    
    float rimBoostAmount=smoothstep(.78,.98,radius)*.5;
    float innerDimAmount=smoothstep(.55,1.,radius)*.18;
    
    vec3 highlightCol=vec3(specular*fresnel)+vec3(rimBoostAmount*fresnel);
    vec3 shadedCol=refractedCol*(1.-innerDimAmount)+highlightCol;
    
    gl_FragColor=vec4(shadedCol,1.);
}
