#version 130
#define iResolution gl_TexCoord[0]
#define iTime gl_TexCoord[0].z
#define pi acos(-1.)

vec2 rotate(vec2 a, float b)
{
    float c = cos(b);
    float s = sin(b);
    return vec2(
        a.x * c - a.y * s,
        a.x * s + a.y * c
    );
}

float sdBox( vec3 p, vec3 b )
{
    p=abs(p)-b;
    return max(max(p.x,p.y),p.z);
}

float sdTorus( vec3 p, vec2 t )
{
  vec2 q = vec2(length(p.xz)-t.x,p.y);
  return length(q)-t.y;
}

vec2 hash2( const float n ) {
	return fract(sin(vec2(n,n+1.))*vec2(43758.5453123));
}

int m;

// distance function
float scenediff(vec3 p)
{
    float d = 1e9;
    
    float tunnel = length(p.yx)-1.5;
    d=-tunnel;
    
    // ridges
    {
        vec3 q=p;
    	q.z=mod(q.z,.4)-.2;
    	d=min(d,sdTorus(q.xzy,vec2(1.51,.02)));
    }
    
    // floor
    float ground = p.y+1.;
    d=min(d,ground);
    
    // tiles
    {
        vec3 q=p;
        q.y+=.998;
        q.xz=rotate(q.xz,-pi*.25);
        q.xz=mod(q.xz,.1)-.05;
        d=max(d,.005-length(q.yx));
        d=max(d,.005-length(q.yz));
    }
    
    return d;
}

float scenelite(vec3 p)
{
    float a=4.93;
    //a=10.;
    a=6.;
    //p.z = mod(p.z-a,a*2.)-a;
    
    /*p.y-=1.;
    float d = length(p.yx)-.05;
    
    
    //d=max(d,abs(mod(p.z,5.)-2.5)-.1);
    
    return d;
    */
    
    
    float d=1e9;
    
    // lamps
    {
        vec3 q=p;
        q.x=abs(q.x);
        q.xy+=vec2(-1.1,1);
        d=min(d,max(
            length(q.yx)-.05,
            abs(mod(q.z-1.,2.)-1.)-.01
        ));
        
        // minus lamps on grill
        d=max(d,1.-abs(p.z));
    }
    
    
    //lasers
    {
        vec3 q=p;
        q.xy=rotate(q.xy,-pi*.25);
        d = min(d,max(
            abs(q.z)-.1,
            abs(mod(q.y-.1,.2)-.1)-.01
        ));
    }
    
    
    return d;
    
    
    //p.y -= 1.;
    
    //p.y += (atan(p.x,p.z)/(pi*2.)) * .8;
    
   // p=p.zxy;
    
    /*return max(
        max(
            sdBox(p,vec3(2.1,9,2.1)),
            -sdBox(p,vec3(2,10,2))
        ),
        abs(mod(p.y,.8)-.4)-.01
	);*/
}

float scene(vec3 p)
{
    float diff=scenediff(p);
    float lite=scenelite(p);
    m=(lite<diff)?1:0;
    return min(lite,diff);
}

// ray bouncing function "borrowed" from I can't remember where
vec2 rv2;
vec3 B(vec3 n) {
    float theta = 2. * pi * rv2.x;
    float phi = acos(1. - 2. * rv2.y);
    float x = sin(phi) * cos(theta);
    float y = sin(phi) * sin(theta);
    float z = cos(phi);
    
    vec3 a = normalize(vec3(x,y,z));
    return dot(a,n)<0.?-a:a;
}


vec3 trace(vec3 cam, vec3 dir)
{
    vec3 accum = vec3(1);
    for(int bounce=0;bounce<4;++bounce)
    {
        // near-clip plane, can't remember why I did this
        float t=0.;
        float k;
        for(int i=0;i<100;++i)
        {
            k = scene(cam+dir*t);
            t += k;
            if (abs(k) < .001)
                break;
        }
        
		vec3 h = cam+dir*t;
			
        // if we hit something
        if(abs(k)<.001)
        {
            if (m==1){
                if (abs(h.z)<0.2){
					//return accum*.15; // force b&w
                	return vec3(1,0.15,0.15) * accum;
                }else{
					//return accum*2.; // force b&w
                    return vec3(5,2,.5)*accum;
                  	//return vec3(1,0.6,0.1)*4. * accum; // NO. too sickly yellow.
                }
            }
            
			vec2 o = vec2(.001, 0);
			k=scene(h);
			vec3 n = normalize(vec3(
				scene(h+o.xyy) - k, //-scene(h-o.xyy),
				scene(h+o.yxy) - k, //-scene(h-o.yxy),
				scene(h+o.yyx) - k  //-scene(h-o.yyx)
			));

            float roughness = .85;
            if (h.y<=-.999) {
                if (rv2.x<.95){
                	accum *= 0.125;
                	roughness = .01;
                }
            }
            
            cam = h+n*.001;
            vec3 mirror = reflect(dir,n);
            vec3 bounce = B(n);
            dir= normalize(mix(mirror,bounce,roughness));
            accum *= mix(1.,dot(dir,n),roughness);
        }
    }
    
    return vec3(0);
}

vec2 bokeh(){
	vec2 a=rv2;
    if(a.y>a.x)
        a=1.-a;
    a.y*=pi*2./a.x;
    return a.x*vec2(cos(a.y),sin(a.y));
}

void main()
{
    vec2 uv = gl_FragCoord.xy/iResolution.xy-.5;

    // random function borrowed from I can't remember where
    float seed = iTime;
    //seed+=mod(gl_FragCoord.x,1.34672);
    //seed-=mod(gl_FragCoord.y,1.72357);
	rv2 = hash2( seed );
    
    // jitter camera for antialiasing
    uv += (rv2-.5)/iResolution.xy;
    
    // correct UVs for aspect ratio
    uv.x*=iResolution.x/iResolution.y;

	{
		float blockSize=exp2(clamp(floor(length(uv)*9.),2.,9.));
		seed+=mod(floor(gl_FragCoord.x/blockSize),1.34672);
		seed+=mod(floor(gl_FragCoord.y/blockSize),1.72357);
		rv2=hash2(seed);
	}
	
    // make an orthographic camera
	//vec3 cam = vec3(uv*5.,-10.);
    //vec3 dir = vec3(0,0,1);
    vec3 cam = vec3(0,0,-8.);
    vec3 dir = normalize(vec3(uv,1));
    
    float ds=.005;
    vec2 bokehJitter=bokeh();
    cam.xy+=bokehJitter*ds;
    dir.xy-=bokehJitter*ds*dir.z/8.;
    
    cam.y -=.25;
    
    dir.yz = rotate(dir.yz, .06);
    
    // compute the pixel color
	vec4 pixel = vec4(trace(cam,dir),1);
    
	gl_FragColor = pixel.r >= 0. ? pixel : vec4(0);
}