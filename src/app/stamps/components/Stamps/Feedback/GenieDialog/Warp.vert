varying vec2 vQuadUV;

void main(){
    vQuadUV=position.xy*.5+.5;
    gl_Position=vec4(position.xy,0.,1.);
}