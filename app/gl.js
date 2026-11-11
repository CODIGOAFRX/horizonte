// Escenas en WebGL, sin librerías: el agujero negro (portada y descenso) y los planetas.
import { mascaraTierra, ANCHO, ALTO } from './tierra.js';
import { PLANETAS, SGR_A, G, G0, C, radioS, gravedad, vEscape, marea, MSOL, ANIO, num, cifras, duracion } from './fisica.js';

const VERT = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';

const RUIDO = `
float hash(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float ruido(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);
  return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*ruido(p);p=p*2.03+7.1;a*=.5;}return s;}
`;

// Cielo de fondo: dos capas de estrellas con color de cuerpo negro y, si uNiebla lo pide, la banda tenue
// de la galaxia. La portada va sin banda: el espacio se queda negro y sólo brilla lo que está iluminado.
const CIELO = `uniform float uEstrellas,uNiebla;
vec3 negro(float t){ // rampa de cuerpo negro, t relativo
  vec3 c=mix(vec3(.5,.04,0.),vec3(1.,.36,.08),smoothstep(.15,.5,t));
  c=mix(c,vec3(1.,.78,.5),smoothstep(.45,.9,t));
  c=mix(c,vec3(.9,.93,1.),smoothstep(.9,1.5,t));
  return mix(c,vec3(.62,.75,1.),smoothstep(1.5,2.4,t));}
vec3 cielo(vec3 d){
  vec3 col=vec3(0.);
  for(int k=0;k<2;k++){
    float s=k==0?90.:38.;vec3 q=d*s,id=floor(q),f=fract(q)-.5;
    float h=hash(id+float(k)*31.);
    vec3 o=(vec3(hash(id+3.),hash(id+5.),hash(id+9.))-.5)*.6;
    float b=step(k==0?.86:.93,h)*smoothstep(k==0?.11:.07,0.,length(f-o));
    col+=b*b*negro(.6+hash(id+11.)*1.6)*(k==0?1.6:4.)*uEstrellas;}
  float banda=exp(-pow(dot(d,normalize(vec3(.35,.9,.2)))*5.,2.));
  col+=uNiebla*banda*vec3(.016,.02,.034)*pow(fbm(d*5.)*1.5,2.);
  return col;}
`;

// Cada píxel lanza un rayo de luz hacia atrás y lo integra en la métrica de Schwarzschild
// (unidades de rs): d²x/dλ² = −(3/2)·h²·x/r⁵. El disco está en el plano y = 0, entre la última
// órbita estable (3 rs) y 14 rs, con brillo Doppler y corrimiento al rojo gravitatorio.
const AGUJERO = `precision highp float;
uniform vec2 uRes;uniform float uT,uDist,uIncl,uMira,uRoll,uCentro,uAlto,uFoco,uPasos,uOrden,uGiro;
${RUIDO}
${CIELO}
void main(){
  vec2 uv=(gl_FragCoord.xy-.5*uRes)/uRes.y;uv-=vec2(uCentro,uAlto);
  float cr=cos(uRoll),sr=sin(uRoll);uv=mat2(cr,-sr,sr,cr)*uv;
  vec3 ro=uDist*vec3(0.,sin(uIncl),-cos(uIncl));
  vec3 dentro=normalize(-ro),lado=normalize(cross(vec3(0.,1.,0.),dentro));
  float gm=uMira*3.14159;vec3 fw=normalize(cos(gm)*dentro+sin(gm)*lado);
  vec3 rt=normalize(cross(vec3(0.,1.,0.),fw)),up=cross(fw,rt);
  vec3 p=ro,v=normalize(fw*uFoco+uv.x*rt+uv.y*up);
  vec3 hv=cross(p,v);float h2=dot(hv,hv);
  vec3 col=vec3(0.);float paso=1.,cruces=0.;bool cae=false;
  float lim=uDist*1.5+30.;
  for(int i=0;i<190;i++){
    if(float(i)>=uPasos)break;
    float r2=dot(p,p),r=sqrt(r2);
    if(r<1.){cae=true;break;}
    if(r>lim)break;
    float dt=clamp(.075*r,.02,4.);
    v+=-1.5*h2*p/(r2*r2*r)*dt;
    vec3 pn=p+v*dt;
    if(p.y*pn.y<0.){
      vec3 c=mix(p,pn,p.y/(p.y-pn.y));float rc=length(c.xz);
      cruces+=1.;
      if(rc>3.&&rc<14.&&cruces<=uOrden){
        float beta=sqrt(.5/rc);
        vec3 vd=normalize(vec3(-c.z,0.,c.x));
        float dop=sqrt(1.-beta*beta)/(1.+beta*dot(vd,normalize(v)));
        float z=dop*sqrt(1.-1./rc);
        float w=.9*pow(rc,-1.5),f1=fract(uT*.05),f2=fract(uT*.05+.5);
        float a1=atan(c.z,c.x)+w*f1*40.,a2=atan(c.z,c.x)+w*f2*40.;
        float n1=fbm(vec3(cos(a1)*rc*.9,sin(a1)*rc*.9,rc*1.7));
        float n2=fbm(vec3(cos(a2)*rc*.9,sin(a2)*rc*.9,rc*1.7+9.));
        float n=mix(n1,n2,abs(f1*2.-1.));
        float dens=smoothstep(3.,3.5,rc)*smoothstep(14.,8.,rc)*(.35+1.3*n*n);
        float temp=pow(3./rc,.75)*1.25*z;
        vec3 e=negro(temp)*pow(z,3.)*dens*1.7;
        float op=clamp(dens*.9,0.,1.);
        col+=paso*e;paso*=1.-op;
      }
    }
    p=pn;
  }
  if(!cae){float az=min(1./sqrt(1.-1./uDist),7.);vec3 vc=normalize(v);float cg=cos(uGiro),sg=sin(uGiro);vc.xz=mat2(cg,-sg,sg,cg)*vc.xz;col+=paso*cielo(vc)*mix(vec3(1.),vec3(.75,.88,1.3)*az,smoothstep(1.,3.,az));}
  col=1.-exp(-col*1.25);
  gl_FragColor=vec4(pow(col,vec3(.4545)),1.);
}`;

const PLANETA = `precision highp float;
uniform vec2 uRes;uniform float uT,uRad,uOff,uTipo,uAnillo,uSemilla,uCentro;
uniform vec3 uA,uB,uCc,uAtm;uniform sampler2D uMapa;uniform float uViaje;
${RUIDO}
// Fondo: estrellas que titilan y se desplazan un poco al pasar de un planeta a otro, una galaxia espiral
// lejana y, cada pocos segundos, una estrella fugaz
vec3 fondo(vec2 uv){
  vec3 col=vec3(0.);
  for(int k=0;k<2;k++){
    float s=k==0?27.:12.;vec2 q=uv*s+vec2(uViaje*(k==0?.35:.8),float(k)*7.3),id=floor(q),f=fract(q)-.5;
    float h=hash(vec3(id,float(k)*31.));
    vec2 o=(vec2(hash(vec3(id,3.)),hash(vec3(id,5.)))-.5)*.7;
    float tw=.72+.28*sin(uT*(.6+2.4*hash(vec3(id,7.)))+h*40.);
    float b=step(k==0?.8:.9,h)*smoothstep(k==0?.075:.05,0.,length(f-o));
    col+=b*b*mix(vec3(1.,.78,.58),vec3(.72,.84,1.),hash(vec3(id,11.)))*(k==0?.42:1.1)*tw;}
  vec2 g=uv-vec2(uCentro-.62+uViaje*.006,.33);g=mat2(.8,-.6,.6,.8)*g;g.y/=.4;
  float gr=length(g)/.085,br=.5+.5*cos(2.*atan(g.y,g.x)-4.*log(gr+.05));
  col+=exp(-gr*2.2)*(.3+br*br)*vec3(.5,.6,1.)*.13+exp(-gr*gr*30.)*vec3(1.,.85,.65)*.2;
  float n=floor(uT/8.),tt=fract(uT/8.)*8./.8;
  if(tt<1.){
    vec2 ini=vec2((hash(vec3(n,1.,2.))*2.-1.)*.5*uRes.x/uRes.y,.12+.34*hash(vec3(n,4.,5.)));
    vec2 dir=normalize(vec2(hash(vec3(n,6.,7.))>.5?-1.:1.,-.3-.3*hash(vec3(n,8.,9.))));
    vec2 pa=uv-(ini+dir*tt*.42);float lo=dot(pa,-dir),an=length(pa+dir*lo);
    col+=vec3(.9,.95,1.)*smoothstep(.0028,0.,an)*step(0.,lo)*clamp(1.-lo/.11,0.,1.)*sin(tt*3.14159)*.9;}
  return col;}
void main(){
  vec2 uv=(gl_FragCoord.xy-.5*uRes)/uRes.y;
  vec3 col=fondo(uv);
  vec2 q=(uv-vec2(uCentro+uOff,.02))/uRad;
  float r=length(q);
  vec3 L=normalize(vec3(-.62,.34,.7));
  float incl=.42;vec3 N=vec3(0.,cos(incl),sin(incl)); // normal del plano de los anillos
  float tz=-(q.x*N.x+q.y*N.y)/N.z;float rho=length(vec3(q,tz));
  float banda=smoothstep(1.28,1.34,rho)*smoothstep(2.3,2.2,rho)*(.45+.55*ruido(vec3(rho*26.,0.,3.)))*(1.-.8*smoothstep(.04,0.,abs(rho-1.95)));
  vec3 anillo=mix(uB,uA,ruido(vec3(rho*9.,1.,1.)))*.9;
  float az=r<1.?sqrt(1.-r*r):0.;
  if(uAnillo>.5&&tz<az&&r>=1.)col=mix(col,anillo,banda*.85);
  if(uAnillo>.5&&tz<az&&r<1.)col=vec3(0.);
  if(r<1.){
    vec3 n=vec3(q,az);
    float ang=uT*.07+uSemilla;float ca=cos(ang),sa=sin(ang);
    vec3 s=vec3(n.x*ca+n.z*sa,n.y,-n.x*sa+n.z*ca);
    s.xy=mat2(cos(.3),-sin(.3),sin(.3),cos(.3))*s.xy;
    vec3 sp=s*2.2+uSemilla*13.;
    vec3 c;float brillo=0.;
    if(uTipo<.5){ // roca
      float h=fbm(sp*1.6);float cr=fbm(sp*5.);
      c=mix(uA,uB,smoothstep(.3,.7,h));c=mix(c,uCc,smoothstep(.55,.75,cr)*.6);
    }else if(uTipo<1.5){ // la Tierra: costas calcadas de un mapa real (uMapa), color y nubes por ruido
      vec3 e=vec3(mat2(cos(.41),-sin(.41),sin(.41),cos(.41))*n.xy,n.z); // eje inclinado 23,4 grados
      float lat=asin(clamp(e.y,-1.,1.)),lon=atan(e.x,e.z)-uT*.07-uSemilla,al=abs(lat);
      float lw=mod(lon+3.14159,6.28318)-3.14159;
      float tierra=smoothstep(.3,.7,texture2D(uMapa,vec2(lon/6.28318+.5,lat/3.14159+.5)).r);
      vec3 g=vec3(cos(lat)*sin(lon),sin(lat),cos(lat)*cos(lon)); // punto fijo en la superficie, gira con ella
      float h=fbm(g*3.1+2.),fino=fbm(g*11.+5.);
      float seco=smoothstep(.2,.34,al)*smoothstep(.66,.5,al)*smoothstep(.36,.56,h+.25*fino);
      vec3 suelo=mix(vec3(.1,.24,.08),vec3(.2,.3,.12),fino);
      suelo=mix(suelo,vec3(.66,.54,.34),seco);
      suelo=mix(suelo,vec3(.34,.33,.25),smoothstep(.9,1.1,al+.1*h));
      float groen=step(-1.3,lw)*step(lw,-.2)*step(1.03,lat);
      float hielo=max(smoothstep(1.16,1.24,al+.1*fino),max(groen,step(lat,-1.05)));
      suelo=mix(suelo,vec3(.93,.95,.97),hielo);
      vec3 mar=uA*(.6+.45*h);
      mar=mix(mar,vec3(.86,.9,.94),smoothstep(1.3,1.38,lat+.08*fino)); // banquisa del Ártico
      c=mix(mar,suelo,tierra);brillo=1.-tierra;
      float nub=smoothstep(.56,.8,fbm(sp*2.4+vec3(uT*.02,0.,4.)));
      c=mix(c,vec3(.95),nub*.75);brillo*=1.-nub;
    }else{ // gigante de gas: bandas en latitud con turbulencia
      float lat=s.y*uSemilla*1.1+.5*fbm(sp*vec3(.7,2.4,.7))-.25;
      float b=smoothstep(.2,.8,.5+.5*sin(lat*9.));
      c=mix(uA,uB,b);c=mix(c,uCc,smoothstep(.6,.9,fbm(sp*vec3(1.,5.,1.)+3.))*.5);
    }
    float d=dot(n,L);float luz=smoothstep(-.12,.6,d);
    c*=luz*(uTipo>1.5?.92:1.12)+.012;
    vec3 hh=normalize(L+vec3(0.,0.,1.));
    c+=brillo*pow(max(dot(n,hh),0.),60.)*.7*luz;
    c+=uAtm*pow(1.-az,2.6)*smoothstep(-.3,.5,d)*1.1;
    // sombra del anillo sobre el planeta no se calcula; el anillo por delante sí se pinta
    col=c;
    if(uAnillo>.5&&tz>=az)col=mix(col,anillo*(.35+.65*smoothstep(-.2,.3,dot(normalize(vec3(q,tz)),L)+.4)),banda*.85);
  }else{
    float halo=exp(-(r-1.)*26.)*smoothstep(-.5,.6,dot(normalize(vec3(q,0.)),L));
    col+=uAtm*halo*.6;
    if(uAnillo>.5&&tz>=az)col=mix(col,anillo,banda*.85);
  }
  gl_FragColor=vec4(pow(clamp(col,0.,1.),vec3(.4545)),1.);
}`;

// La travesía. Cada píxel lanza un rayo y lo integra en la métrica de Ellis, ds² = −dt² + dl² + (b₀² + l²)dΩ²
// (unidades de b₀): l'' = h²·l/(1 + l²)² y φ' = h/(1 + l²), con h = √(1 + l²)·sen α constante. Los rayos con
// h < 1 cruzan la garganta y enseñan el cielo del otro lado; los demás dan la vuelta y enseñan el propio.
const TRAVESIA = `precision highp float;
uniform vec2 uRes;uniform float uT,uL,uCentro,uFoco;
${RUIDO}
${CIELO}
vec3 otro(vec3 d){ // el cielo del otro lado: estrellas más cálidas y una galaxia espiral de frente
  vec3 col=cielo(d.zxy)*vec3(1.25,1.,.8);
  vec3 g0=normalize(vec3(.06,.03,1.)),e1=normalize(cross(vec3(0.,1.,0.),g0)),e2=cross(g0,e1);
  float z=dot(d,g0);
  if(z>.15){
    vec2 q=vec2(dot(d,e1),dot(d,e2))/z;q=mat2(.86,-.5,.5,.86)*q;q.y/=.45;
    float r=length(q)/.24,th=atan(q.y,q.x);
    float brazo=.5+.5*cos(2.*th-5.*log(r+.05)+uT*.015);
    float polvo=fbm(vec3(q*17.,2.)),grumo=fbm(vec3(q*55.,5.));
    float disco=exp(-r*2.7)*(.2+1.25*brazo*brazo*(.4+polvo))*smoothstep(1.7,.7,r);
    col+=disco*mix(vec3(.45,.6,1.),vec3(1.,.7,.6),smoothstep(.62,.8,grumo)*brazo)*1.1;
    col+=exp(-r*r*36.)*vec3(1.,.83,.6)*1.2+exp(-r*7.)*vec3(1.,.8,.6)*.35;}
  return col;}
void main(){
  vec2 uv=(gl_FragCoord.xy-.5*uRes)/uRes.y;uv.x-=uCentro;
  float ca=cos(uT*.012),sa=sin(uT*.012);uv=mat2(ca,-sa,sa,ca)*uv;
  float rho=length(uv);vec2 tr=rho>1e-5?uv/rho:vec2(1.,0.);
  float alfa=atan(rho,uFoco);
  float l=uL,pl=-cos(alfa),h=sqrt(1.+l*l)*sin(alfa),phi=0.;
  for(int i=0;i<110;i++){
    float r2=1.+l*l;
    float dt=clamp(.1*sqrt(r2),.04,3.);
    pl+=h*h*l/(r2*r2)*dt;l+=pl*dt;phi+=h/(1.+l*l)*dt;
    if(abs(l)>34.)break;
  }
  float ar=pl,at=h/sqrt(1.+l*l),c=cos(phi),s=sin(phi);
  float dx=ar*c-at*s,dy=ar*s+at*c; // componentes sobre el eje hacia la cámara y sobre la dirección del píxel
  vec3 d=normalize(vec3(tr*dy,-dx));
  vec3 col=l>0.?cielo(d):otro(d);
  col=1.-exp(-col*1.25);
  gl_FragColor=vec4(pow(col,vec3(.4545)),1.);
}`;

function programa(canvas, frag) {
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' });
    if (!gl) return null;
    const sh = (tipo, src) => {
        const s = gl.createShader(tipo);
        gl.shaderSource(s, src); gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
        return s;
    };
    const p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(p, sh(gl.FRAGMENT_SHADER, frag));
    gl.bindAttribLocation(p, 0, 'a');
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    gl.useProgram(p);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const loc = {};
    const pinta = (w, h, u) => {
        gl.viewport(0, 0, w, h);
        for (const k in u) {
            const l = loc[k] ??= gl.getUniformLocation(p, k);
            const v = u[k];
            if (typeof v === 'number') gl.uniform1f(l, v); else if (v.length === 2) gl.uniform2fv(l, v); else gl.uniform3fv(l, v);
        }
        gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    // Espera a que la gráfica termine el fotograma: sirve para medir lo que cuesta de verdad
    const pixel = new Uint8Array(4);
    // Sube una textura de un canal (un byte por celda) a la unidad 0
    pinta.textura = (datos, w, h) => {
        gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, w, h, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, datos);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    };
    pinta.sincroniza = () => gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
    return pinta;
}

// Baja la resolución interna si el equipo no llega a un ritmo fluido. `aguante` es cuántos
// fotogramas lentos tolera antes de bajar y `suelo`, la escala mínima.
function ajuste(escena, { aguante = 12, suelo = 0.34 } = {}) {
    let lentos = 0;
    return dt => {
        lentos = dt > 0.034 ? lentos + 1 : Math.max(0, lentos - 1);
        if (lentos > aguante && escena.escala > suelo) { escena.escala = Math.max(suelo, escena.escala * 0.82); lentos = 0; }
    };
}

const mezcla = (a, b, t) => a + (b - a) * t;
const suave = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
// En pantallas anchas la figura se desplaza a la derecha para dejar sitio al texto
const centro = (w, h) => (w / h > 1.15 ? Math.min(0.26, (w / h - 1.15) * 0.4) : 0);

// La cámara de la portada da una vuelta lenta al agujero: el disco, que es simétrico, no cambia,
// pero el cielo de fondo desfila y la lente lo arrastra y lo estira alrededor de la sombra
const GIRO = 0.035;

export function portada(canvas) {
    const pinta = programa(canvas, AGUJERO);
    if (!pinta) return null;
    const escena = {
        escala: Math.min(devicePixelRatio || 1, 1.5),
        pintar(p, t, w, h, dt) {
            const dist = mezcla(30, 22, p);
            pinta(w, h, { uRes: [w, h], uT: t, uDist: dist, uIncl: mezcla(0.1, 0.15, p), uMira: 0, uRoll: -0.2, uCentro: centro(w, h), uAlto: 0.1, uFoco: 1.45, uPasos: 190, uOrden: 9, uEstrellas: 1, uNiebla: 0, uGiro: t * GIRO });
            medir(dt);
            return { r: num(dist, 1) };
        },
    };
    const medir = ajuste(escena);
    return escena;
}

// `opciones` aligera la escena para quien la incrusta (el portfolio): `escala` de partida,
// `pasos` de integración por rayo (190 como máximo), `orden` (cuántas imágenes del disco se
// pintan: 2 deja la directa y la lenteada y quita el anillo fino, que a baja resolución
// sale punteado) y `estrellas` (0 las apaga). Con `presupuesto` (milisegundos de gráfica por
// fotograma) la resolución deja de fiarse del ritmo de la página: se mide lo que tarda la
// gráfica y la escala sube o baja entre `suelo` y `techo` para ajustarse a él.
export function descenso(canvas, seccion, opciones = {}) {
    const pinta = programa(canvas, AGUJERO);
    const pasos = Math.min(190, opciones.pasos || 190);
    const { presupuesto = 0, suelo = 0.34, techo = 1.5 } = opciones;
    let cuadros = 0;
    if (!pinta) return null;
    const rs = radioS(SGR_A), rsEstelar = radioS(10 * MSOL);
    const escena = {
        escala: opciones.escala || Math.min(devicePixelRatio || 1, 1.5),
        pintar(p, t, w, h, dt) {
            // Los pasos del texto caen en r = 22, 9, 3, 1,8 y 1,1 radios; se interpola en log(r − 1)
            const k = Math.min(p / 0.2, RUTA.length - 1.0001), i = Math.floor(k);
            const x = 1 + Math.exp(mezcla(RUTA[i], RUTA[i + 1], k - i));
            const mira = 0.42 * suave(0.2, 0.42, p) + 0.58 * suave(0.62, 0.8, p);
            const dentro = p > 0.965;
            const mide = presupuesto && ++cuadros > 6 && cuadros % 5 === 0;
            const t0 = mide ? performance.now() : 0;
            pinta(w, h, {
                uOrden: opciones.orden || 9, uEstrellas: opciones.estrellas ?? 1, uNiebla: 1, uGiro: 0,
                uRes: [w, h], uT: t, uDist: x, uIncl: mezcla(0.15, 0.42, suave(0, 0.7, p)), uMira: mira, uFoco: mezcla(1.45, 0.8, suave(0.15, 0.6, p)), uPasos: pasos,
                uRoll: mezcla(-0.2, 0, suave(0.3, 0.78, p)), uAlto: 0.1 * (1 - suave(0, 0.3, p)), uCentro: centro(w, h) * (1 - suave(0.3, 0.6, p)),
            });
            if (mide) {
                pinta.sincroniza();
                const ms = Math.max(0.5, performance.now() - t0);
                const ideal = escena.escala * Math.sqrt(presupuesto / ms);
                const nueva = Math.min(techo, Math.max(suelo, escena.escala + (ideal - escena.escala) * 0.5));
                if (Math.abs(nueva - escena.escala) > escena.escala * 0.07) escena.escala = nueva;
            } else if (!presupuesto) medir(dt);
            const g = a => (a / G0 >= 0.001 ? `${cifras(a / G0)} g` : 'menos de 0,001 g');
            return dentro
                ? { r: 'menos de 1', km: 'dentro', ritmo: 'sin reloj lejano', escape: 'más que la luz', marea: 'crece sin límite', mareaE: 'crece sin límite' }
                : {
                    r: num(x, 2),
                    km: `${cifras(x * rs / 1e9)} millones de km`,
                    ritmo: num(Math.sqrt(1 - 1 / x), 3),
                    escape: `${num(Math.sqrt(1 / x) * 100, 1)} % de c`,
                    marea: g(marea(SGR_A, x * rs)),
                    mareaE: g(marea(10 * MSOL, x * rsEstelar)),
                };
        },
    };
    const medir = ajuste(escena, opciones);
    return escena;
}

// La cámara entra por la boca, cruza la garganta (l = 0) y sale al otro lado mirando siempre hacia delante
export function travesia(canvas) {
    const pinta = programa(canvas, TRAVESIA);
    if (!pinta) return null;
    const escena = {
        escala: Math.min(devicePixelRatio || 1, 1.5),
        pintar(p, t, w, h, dt) {
            const l = mezcla(7, -5, suave(0.02, 0.8, p));
            pinta(w, h, { uRes: [w, h], uT: t, uL: l, uCentro: centro(w, h) * (1 - suave(0.25, 0.6, p)), uFoco: 1.15, uEstrellas: 1, uNiebla: 1 });
            medir(dt);
            return {
                lado: l > 0.15 ? 'universo de partida' : l < -0.15 ? 'el otro lado' : 'en la garganta',
                l: `${num(l, 2)} b₀`,
                boca: l < -0.15 ? 'a tu espalda' : `${num(2 * Math.asin(1 / Math.sqrt(1 + l * l)) * 180 / Math.PI, 0)}°`,
            };
        },
    };
    const medir = ajuste(escena);
    return escena;
}

const RUTA = [22, 9, 3, 1.8, 1.1, 1.015].map(r => Math.log(r - 1));

// Aspecto de cada planeta: tipo (0 roca, 1 océanos, 2 gas), tres colores, atmósfera y radio en pantalla
const ASPECTO = [
    { tipo: 0, a: [.42, .4, .38], b: [.62, .58, .54], c: [.28, .26, .25], atm: [0, 0, 0], rad: .2, s: 1.3 },
    { tipo: 2, a: [.86, .7, .42], b: [.93, .82, .58], c: [.72, .52, .3], atm: [.9, .7, .35], rad: .25, s: 0.9 },
    { tipo: 1, a: [.05, .2, .45], b: [.2, .42, .16], c: [.5, .42, .26], atm: [.3, .55, 1], rad: .26, s: 2.1 },
    { tipo: 0, a: [.68, .32, .16], b: [.82, .48, .28], c: [.4, .2, .12], atm: [.8, .45, .3], rad: .22, s: 3.4 },
    { tipo: 2, a: [.78, .62, .46], b: [.93, .86, .74], c: [.72, .36, .22], atm: [.8, .7, .55], rad: .36, s: 2.2 },
    { tipo: 2, a: [.8, .7, .5], b: [.92, .84, .64], c: [.7, .6, .42], atm: [.85, .78, .55], rad: .2, s: 1.6, anillo: 1 },
    { tipo: 2, a: [.56, .8, .84], b: [.64, .86, .88], c: [.5, .76, .82], atm: [.5, .85, .95], rad: .28, s: 0.5 },
    { tipo: 2, a: [.16, .3, .78], b: [.26, .42, .88], c: [.6, .7, .95], atm: [.3, .45, 1], rad: .28, s: 1.2 },
];

export function planetas(canvas, seccion) {
    const pinta = programa(canvas, PLANETA);
    if (!pinta) return null;
    pinta.textura(mascaraTierra(), ANCHO, ALTO);
    const masa = seccion.querySelector('#masa');
    const tierra = PLANETAS.find(q => q.nombre === 'Tierra'), gTierra = gravedad(tierra.M, tierra.R);
    const escena = {
        escala: Math.min(devicePixelRatio || 1, 1.5),
        pintar(p, t, w, h) {
            const k = Math.min(p * (PLANETAS.length - 1) + 0.5, PLANETAS.length - 0.001);
            const i = Math.floor(k), f = k - i;
            const fuera = f < 0.14 ? -((1 - f / 0.14) ** 2) : f > 0.86 ? ((f - 0.86) / 0.14) ** 2 : 0;
            const a = ASPECTO[i], pl = PLANETAS[i];
            const estrecho = w / h < 1;
            pinta(w, h, {
                uRes: [w, h], uT: t, uRad: a.rad * (estrecho ? 0.62 : 1), uOff: -fuera * 1.4, uTipo: a.tipo, uAnillo: a.anillo || 0,
                uSemilla: a.s, uA: a.a, uB: a.b, uCc: a.c, uAtm: a.atm, uCentro: centro(w, h), uViaje: p * (PLANETAS.length - 1),
            });
            const g = gravedad(pl.M, pl.R);
            const kg = Math.min(Math.max(Number(masa?.value) || 70, 1), 500);
            return {
                nombre: pl.nombre,
                g: `${num(g, 2)} m/s²`,
                peso: `${num(kg * g / gTierra, 1)} kg`,
                escape: `${num(vEscape(pl.M, pl.R) / 1000, 1)} km/s`,
                reloj: `${duracion(G * pl.M / (pl.R * C * C) * ANIO)} al año`,
            };
        },
    };
    return escena;
}
