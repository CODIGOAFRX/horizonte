// Escenas en WebGL, sin librerías: el agujero negro (portada y descenso) y los planetas.
import { PLANETAS, SGR_A, G, G0, C, radioS, gravedad, vEscape, marea, MSOL, ANIO, num, cifras, duracion } from './fisica.js';

const VERT = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';

const RUIDO = `
float hash(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float ruido(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);
  return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*ruido(p);p=p*2.03+7.1;a*=.5;}return s;}
`;

// Cada píxel lanza un rayo de luz hacia atrás y lo integra en la métrica de Schwarzschild
// (unidades de rs): d²x/dλ² = −(3/2)·h²·x/r⁵. El disco está en el plano y = 0, entre la última
// órbita estable (3 rs) y 14 rs, con brillo Doppler y corrimiento al rojo gravitatorio.
const AGUJERO = `precision highp float;
uniform vec2 uRes;uniform float uT,uDist,uIncl,uMira,uRoll,uCentro,uAlto,uFoco;
${RUIDO}
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
    col+=b*b*negro(.6+hash(id+11.)*1.6)*(k==0?1.6:4.);}
  float banda=exp(-pow(dot(d,normalize(vec3(.35,.9,.2)))*5.,2.));
  col+=banda*vec3(.016,.02,.034)*pow(fbm(d*5.)*1.5,2.);
  return col;}
void main(){
  vec2 uv=(gl_FragCoord.xy-.5*uRes)/uRes.y;uv-=vec2(uCentro,uAlto);
  float cr=cos(uRoll),sr=sin(uRoll);uv=mat2(cr,-sr,sr,cr)*uv;
  vec3 ro=uDist*vec3(0.,sin(uIncl),-cos(uIncl));
  vec3 dentro=normalize(-ro),lado=normalize(cross(vec3(0.,1.,0.),dentro));
  float gm=uMira*3.14159;vec3 fw=normalize(cos(gm)*dentro+sin(gm)*lado);
  vec3 rt=normalize(cross(vec3(0.,1.,0.),fw)),up=cross(fw,rt);
  vec3 p=ro,v=normalize(fw*uFoco+uv.x*rt+uv.y*up);
  vec3 hv=cross(p,v);float h2=dot(hv,hv);
  vec3 col=vec3(0.);float paso=1.;bool cae=false;
  float lim=uDist*1.5+30.;
  for(int i=0;i<190;i++){
    float r2=dot(p,p),r=sqrt(r2);
    if(r<1.){cae=true;break;}
    if(r>lim)break;
    float dt=clamp(.075*r,.02,4.);
    v+=-1.5*h2*p/(r2*r2*r)*dt;
    vec3 pn=p+v*dt;
    if(p.y*pn.y<0.){
      vec3 c=mix(p,pn,p.y/(p.y-pn.y));float rc=length(c.xz);
      if(rc>3.&&rc<14.){
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
  if(!cae){float az=min(1./sqrt(1.-1./uDist),7.);col+=paso*cielo(normalize(v))*mix(vec3(1.),vec3(.75,.88,1.3)*az,smoothstep(1.,3.,az));}
  col=1.-exp(-col*1.25);
  gl_FragColor=vec4(pow(col,vec3(.4545)),1.);
}`;

const PLANETA = `precision highp float;
uniform vec2 uRes;uniform float uT,uRad,uOff,uTipo,uAnillo,uSemilla,uCentro;
uniform vec3 uA,uB,uCc,uAtm;
${RUIDO}
void main(){
  vec2 uv=(gl_FragCoord.xy-.5*uRes)/uRes.y;
  vec3 col=vec3(0.);
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
    }else if(uTipo<1.5){ // océanos, continentes, nubes
      float h=fbm(sp*1.3)+.12*fbm(sp*6.);
      float tierra=smoothstep(.52,.56,h);
      vec3 suelo=mix(uB,uCc,smoothstep(.56,.75,h));
      suelo=mix(suelo,vec3(.9,.92,.95),smoothstep(.8,.92,abs(s.y)+.08*h));
      c=mix(uA*(.7+.6*h),suelo,tierra);brillo=1.-tierra;
      float nub=smoothstep(.52,.75,fbm(sp*2.4+vec3(uT*.02,0.,4.)));
      c=mix(c,vec3(.95),nub*.85);brillo*=1.-nub;
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
    return (w, h, u) => {
        gl.viewport(0, 0, w, h);
        for (const k in u) {
            const l = loc[k] ??= gl.getUniformLocation(p, k);
            const v = u[k];
            if (typeof v === 'number') gl.uniform1f(l, v); else if (v.length === 2) gl.uniform2fv(l, v); else gl.uniform3fv(l, v);
        }
        gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
}

// Baja la resolución interna si el equipo no llega a un ritmo fluido
function ajuste(escena) {
    let lentos = 0;
    return dt => {
        lentos = dt > 0.034 ? lentos + 1 : Math.max(0, lentos - 1);
        if (lentos > 12 && escena.escala > 0.34) { escena.escala *= 0.82; lentos = 0; }
    };
}

const mezcla = (a, b, t) => a + (b - a) * t;
const suave = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
// En pantallas anchas la figura se desplaza a la derecha para dejar sitio al texto
const centro = (w, h) => (w / h > 1.15 ? Math.min(0.26, (w / h - 1.15) * 0.4) : 0);

export function portada(canvas) {
    const pinta = programa(canvas, AGUJERO);
    if (!pinta) return null;
    const escena = {
        escala: Math.min(devicePixelRatio || 1, 1.5),
        pintar(p, t, w, h, dt) {
            const dist = mezcla(30, 22, p);
            pinta(w, h, { uRes: [w, h], uT: t, uDist: dist, uIncl: mezcla(0.1, 0.15, p), uMira: 0, uRoll: -0.2, uCentro: centro(w, h), uAlto: 0.1, uFoco: 1.45 });
            medir(dt);
            return { r: num(dist, 1) };
        },
    };
    const medir = ajuste(escena);
    return escena;
}

export function descenso(canvas) {
    const pinta = programa(canvas, AGUJERO);
    if (!pinta) return null;
    const rs = radioS(SGR_A), rsEstelar = radioS(10 * MSOL);
    const escena = {
        escala: Math.min(devicePixelRatio || 1, 1.5),
        pintar(p, t, w, h, dt) {
            // Los pasos del texto caen en r = 22, 9, 3, 1,8 y 1,1 radios; se interpola en log(r − 1)
            const k = Math.min(p / 0.2, RUTA.length - 1.0001), i = Math.floor(k);
            const x = 1 + Math.exp(mezcla(RUTA[i], RUTA[i + 1], k - i));
            const mira = 0.42 * suave(0.2, 0.42, p) + 0.58 * suave(0.62, 0.8, p);
            const dentro = p > 0.965;
            pinta(w, h, {
                uRes: [w, h], uT: t, uDist: x, uIncl: mezcla(0.15, 0.42, suave(0, 0.7, p)), uMira: mira, uFoco: mezcla(1.45, 0.8, suave(0.15, 0.6, p)),
                uRoll: mezcla(-0.2, 0, suave(0.3, 0.78, p)), uAlto: 0.1 * (1 - suave(0, 0.3, p)), uCentro: centro(w, h) * (1 - suave(0.3, 0.6, p)),
            });
            medir(dt);
            const g = a => (a / G0 >= 0.001 ? `${cifras(a / G0)} g` : 'menos de 0,001 g');
            return dentro
                ? { r: 'menos de 1', km: 'dentro', ritmo: 'sin reloj lejano', escape: 'más que la luz', marea: 'crece sin límite', mareaE: 'crece sin límite', '--negro': 1 }
                : {
                    r: num(x, 2),
                    km: `${cifras(x * rs / 1e9)} millones de km`,
                    ritmo: num(Math.sqrt(1 - 1 / x), 3),
                    escape: `${num(Math.sqrt(1 / x) * 100, 1)} % de c`,
                    marea: g(marea(SGR_A, x * rs)),
                    mareaE: g(marea(10 * MSOL, x * rsEstelar)),
                    '--negro': suave(0.9, 0.965, p),
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
                uSemilla: a.s, uA: a.a, uB: a.b, uCc: a.c, uAtm: a.atm, uCentro: centro(w, h),
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
