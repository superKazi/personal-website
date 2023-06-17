// TODO: Add better comments
import regl from "regl";
import createQuad from "primitive-quad";

/**
 * @description set up animation
 */
const fragmentShader = `
//
// Description : Array and textureless GLSL 2D/3D/4D simplex
//               noise functions.
//      Author : Ian McEwan, Ashima Arts.
//  Maintainer : ijm
//     Lastmod : 20110822 (ijm)
//     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
//               Distributed under the MIT License. See LICENSE file.
//               https://github.com/ashima/webgl-noise
//

  precision highp float;

  vec3 mod289(vec3 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
  }

  vec4 mod289(vec4 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
  }

  vec4 permute(vec4 x) {
      return mod289(((x*34.0)+1.0)*x);
  }

  vec4 taylorInvSqrt(vec4 r)
  {
    return 1.79284291400159 - 0.85373472095314 * r;
  }

float snoise(vec3 v)
  {
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

// First corner
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 =   v - i + dot(i, C.xxx) ;

// Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  //   x0 = x0 - 0.0 + 0.0 * C.xxx;
  //   x1 = x0 - i1  + 1.0 * C.xxx;
  //   x2 = x0 - i2  + 2.0 * C.xxx;
  //   x3 = x0 - 1.0 + 3.0 * C.xxx;
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
  vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y

// Permutations
  i = mod289(i);
  vec4 p = permute( permute( permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

// Gradients: 7x7 points over a square, mapped onto an octahedron.
// The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
  float n_ = 0.142857142857; // 1.0/7.0
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;
  //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

//Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

// Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                dot(p2,x2), dot(p3,x3) ) );
  }

// Matt DesLauriers
  float hue2rgb(float f1, float f2, float hue) {
    if (hue < 0.0)
        hue += 1.0;
    else if (hue > 1.0)
        hue -= 1.0;
    float res;
    if ((6.0 * hue) < 1.0)
        res = f1 + (f2 - f1) * 6.0 * hue;
    else if ((2.0 * hue) < 1.0)
        res = f2;
    else if ((3.0 * hue) < 2.0)
        res = f1 + (f2 - f1) * ((2.0 / 3.0) - hue) * 6.0;
    else
        res = f1;
    return res;
}

  vec3 hsl2rgb(vec3 hsl) {
      vec3 rgb;
      
      if (hsl.y == 0.0) {
          rgb = vec3(hsl.z); // Luminance
      } else {
          float f2;
          
          if (hsl.z < 0.5)
              f2 = hsl.z * (1.0 + hsl.y);
          else
              f2 = hsl.z + hsl.y - hsl.y * hsl.z;
              
          float f1 = 2.0 * hsl.z - f2;
          
          rgb.r = hue2rgb(f1, f2, hsl.x + (1.0/3.0));
          rgb.g = hue2rgb(f1, f2, hsl.x);
          rgb.b = hue2rgb(f1, f2, hsl.x - (1.0/3.0));
      }   
      return rgb;
  }

  vec3 hsl2rgb(float h, float s, float l) {
      return hsl2rgb(vec3(h, s, l));
  }

  uniform float time;
  uniform float width;
  uniform float height;
  varying vec2 vUv;

  void main() {
    vec2 center = vUv - 0.5;
    center.x *= width / height;
    float dist = length(center);
    float mobileOrDesktopDistCheck = width > height ? 0.333 : 0.0666; 
    
    float alpha = smoothstep(mobileOrDesktopDistCheck + 0.666, mobileOrDesktopDistCheck, dist);

    float noise = snoise(vec3(center, time * .333));
    vec3 color = hsl2rgb(0.5 + noise * 0.333, 0.666, 0.666);
    gl_FragColor = vec4(color, alpha);
  }
`;
const vertShader = `
  precision highp float;
  attribute vec3 position;
  varying vec2 vUv;

  void main () {
    gl_Position = vec4(position.xyz, 1.0);
    vUv = gl_Position.xy * 0.5 + 0.5;
  }
`;
const quad = createQuad();
const draw = regl();
const drawing = draw({
  frag: fragmentShader,
  vert: vertShader,
  attributes: {
    position: quad.positions,
  },
  uniforms: {
    time: ({ tick }) => 0.005 * tick,
    width: (context) => context.viewportWidth,
    height: (context) => context.viewportHeight,
  },
  elements: quad.cells,
});

draw.frame(drawing);
/**
 * @description remove leftover workbox sw stuff
 */

(async function killServiceWorkers() {
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    const unregisterPromises = registrations.map((registration) =>
      registration.unregister()
    );

    const allCaches = await caches.keys();
    const cacheDeletionPromises = allCaches.map((cache) =>
      caches.delete(cache)
    );

    const clearAttempted = await Promise.allSettled([
      ...unregisterPromises,
      ...cacheDeletionPromises,
    ]);

    if (clearAttempted.length > 0) {
      if (clearAttempted.includes((p) => p.status === "rejected")) {
        throw new Error(
          "There was an error clearing google workbox information"
        );
      } else {
        window.location.reload();
      }
    }
  } catch (err) {
    console.error(err);
  }
})();

(async function clearDbs() {
  try {
    const dbs = await indexedDB.databases();

    if (dbs.length > 0) {
      dbs.forEach((db) => {
        const deletedDb = indexedDB.deleteDatabase(db.name);
        deletedDb.onerror = () => {
          throw new Error("Couldn’t delete google workbox indexDB");
        };
      });
    }
  } catch (err) {
    console.error(err);
  }
})();

/**
 * @description polite console
 */

const politeString =
  document.documentElement.dataset.city === "unknown"
    ? `%cThanks for checking out my site!`
    : `%cThanks for checking out my site all the way from ${document.documentElement.dataset.city}!`;

console.log(
  politeString,
  `font-family: Inter, Roboto, "Helvetica Neue", "Arial Nova",
  "Nimbus Sans", Arial, sans-serif; text-transform: uppercase; font-weight: bold; letter-spacing: .12em; font-size: 3rem; color: black;`
);
