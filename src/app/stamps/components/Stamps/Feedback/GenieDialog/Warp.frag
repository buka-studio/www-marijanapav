precision highp float;

varying vec2 vQuadUV;

uniform sampler2D uTexture;
uniform float uRangeLeft;
uniform float uRangeRight;
uniform float uMotionBlur;
uniform int uEasingFunction;
uniform bool uIsReversed;
uniform float uProgress;
uniform int uSide;

const int BLUR_SAMPLES=7;
const float PI=3.1415926535;

float yPoint(float y0,float y1,float x){
    float theta=x*PI;
    float t=(1.-cos(theta))*.5;
    return mix(y0,y1,t);
}

float remap(float val,float inLow,float inHigh,float outLow,float outHigh){
    float t=(val-inLow)/(inHigh-inLow);
    return mix(outLow,outHigh,t);
}

float easeOutCubic(float x){return 1.-pow(1.-x,3.);}
float easeInCubic(float x){return x*x*x;}
float easeInOutCubic(float x){
    return x<.5?4.*x*x*x:1.-pow(-2.*x+2.,3.)/2.;
}
float easeSpring(float x){
    x=clamp(x,0.,1.);
    float damping=6.;
    float freq=12.;
    float decay=exp(-damping*x);
    return 1.-decay*cos(freq*x);
}

void main(){
    vec2 uv=vQuadUV;
    
    bool isTop=(uSide==1);
    float direction=isTop?-1.:1.;
    
    float p=clamp(uProgress,0.,1.);
    float x=(uIsReversed)?(1.-p):p;
    float t;
    
    if(uEasingFunction==0)t=easeOutCubic(x);
    else if(uEasingFunction==1)t=easeInCubic(x);
    else if(uEasingFunction==2)t=easeInOutCubic(x);
    else if(uEasingFunction==3)t=easeSpring(x);
    else t=x;
    
    float hProgress=clamp(t/.4,0.,1.);
    float curveY=isTop?(1.-uv.y):uv.y;
    
    float right=mix(1.,uRangeRight,hProgress);
    float left=mix(0.,uRangeLeft,hProgress);
    
    float xRight=yPoint(right,1.,curveY);
    float xLeft=yPoint(left,0.,curveY);
    
    float newUvX=remap(uv.x,xLeft,xRight,0.,1.);
    
    float vProgress=clamp((t-.3)/.7,0.,1.);
    float yStart=mix(0.,1.,vProgress);
    
    float newUvY=uv.y+(yStart*direction);
    
    vec4 texColor=vec4(0.);
    
    if(uMotionBlur>0.&&vProgress>0.){
        float blurStrength=uMotionBlur*.05*vProgress;
        for(int i=-BLUR_SAMPLES;i<=BLUR_SAMPLES;i++){
            float offset=float(i)/float(BLUR_SAMPLES)*blurStrength;
            texColor+=texture(uTexture,vec2(newUvX,newUvY+offset));
        }
        texColor/=float(BLUR_SAMPLES*2+1);
    }else{
        texColor=texture(uTexture,vec2(newUvX,newUvY));
    }
    
    float aaWidthX=fwidth(newUvX);
    float maskX=smoothstep(0.-aaWidthX,0.+aaWidthX,newUvX)*(1.-smoothstep(1.-aaWidthX,1.+aaWidthX,newUvX));
    
    float aaWidthY=fwidth(newUvY);
    float maskY=1.;
    
    if(isTop){
        maskY=smoothstep(0.-aaWidthY,0.+aaWidthY,newUvY);
    }else{
        maskY=1.-smoothstep(1.-aaWidthY,1.+aaWidthY,newUvY);
    }
    
    float mask=maskX*maskY;
    
    gl_FragColor=texColor*mask;
}