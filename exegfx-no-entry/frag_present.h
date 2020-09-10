/* File generated with Shader Minifier 1.1.6
 * http://www.ctrl-alt-test.fr
 */
#ifndef FRAG_PRESENT_H_
# define FRAG_PRESENT_H_
# define VAR_T "s"

const char *present_frag =
 "#version 120\n"
 "uniform sampler2D s;"
 "void main()"
 "{"
   "vec2 v=gl_FragCoord.xy/gl_TexCoord[0].xy;"
   "vec4 g=texture2D(s,v);"
   "vec3 p=g.xyz/g.w;"
   "v-=.5;"
   "p*=1.-dot(v,v)*2.;"
   "p*=10.;"
   "p/=p+1.;"
   "p=pow(p,vec3(.45));"
   "p=smoothstep(0.,1.,p);"
   "p=pow(p,vec3(1,1.05,1.1));"
   "p+=.02;"
   "gl_FragColor=vec4(p,1);"
 "}";

#endif // FRAG_PRESENT_H_
