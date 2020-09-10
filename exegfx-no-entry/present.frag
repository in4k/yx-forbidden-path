#version 120
uniform sampler2D T;


void main(){
	vec2 uv=gl_FragCoord.xy/gl_TexCoord[0].xy;
    vec4 tex=texture2D(T,uv);
    
    // divide by sample-count
	vec3 color=tex.rgb/tex.a;
    
    // vignette to darken the corners
	uv-=.5;
	color *= 1.-dot(uv,uv)*2.;
    
    // tonemap
    color *= 10.;
    color/=color+1.;
    
    // gamma correction
	color=pow(color, vec3(.45));
	color=smoothstep(0.,1.,color);
	//color=pow(color, vec3(1.2));
    
    //gray
    //color=vec3(dot(color,vec3(.2126,.7152,.7022)));
	//color=vec3(color.r+color.g)*.5;
	//color=color.ggg;
    
    // tint
    color=pow(color,vec3(1,1.05,1.1));
    
    // lift the black level
    color+=.02;
    
	gl_FragColor=vec4(color,1);
}