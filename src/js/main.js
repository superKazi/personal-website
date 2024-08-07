import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  WebGLRenderer,
  PerspectiveCamera,
  Mesh,
  PlaneGeometry,
  ShaderMaterial,
  Scene,
  Color,
  DisplayP3ColorSpace,
  SRGBColorSpace,
  ACESFilmicToneMapping,
} from "three";

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", animations);
} else {
  animations();
}

/**
 * set up animations
 */
function animations() {
  const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;
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

  // values from outside javascript world
  uniform float uTick;
  uniform float uWidth;
  uniform float uHeight;
  uniform float uMobileOrDesktopDistCheck;
  uniform float uColor;
  varying vec2 vUv;

  // creates blobby circle animation
  void main() {
    vec2 center = vUv - 0.5;
    // maintains aspect ratio
    center.x *= uWidth / uHeight;
    float dist = length(center);
    
    // creates transparency
    float alpha = smoothstep(uMobileOrDesktopDistCheck + dist, uMobileOrDesktopDistCheck, dist);

    float noise = snoise(vec3(center, uTick * .6));
    vec3 color = hsl2rgb(uColor + noise * 0.3, 0.8, 0.8);
    gl_FragColor = vec4(color, alpha);
  }
`;

  /**
   * threejs boilerplate
   */
  const landscapeOrientation = window.matchMedia("(orientation: landscape)");

  const renderer = new WebGLRenderer({
    canvas: document.querySelector("canvas"),
    antialias: true,
  });

  const camera = new PerspectiveCamera(
    50,
    renderer.domElement.clientWidth / renderer.domElement.clientHeight,
    1,
    10,
  );

  const mesh = new Mesh(
    new PlaneGeometry(2, 2),
    new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTick: { value: 1.0 },
        uWidth: { value: renderer.domElement.clientWidth },
        uHeight: { value: renderer.domElement.clientHeight },
        uColor: { value: 0.6 },
        uMobileOrDesktopDistCheck: {
          value: landscapeOrientation.matches ? 0.3 : 0.15,
        },
      },
    }),
  );

  landscapeOrientation.addEventListener(
    "change",
    (e) => {
      e.matches
        ? (mesh.material.uniforms.uMobileOrDesktopDistCheck.value = 0.3)
        : (mesh.material.uniforms.uMobileOrDesktopDistCheck.value = 0.15);
    },
    { passive: true },
  );

  const scene = new Scene();
  scene.background = new Color(0xffffff);
  scene.add(mesh);
  renderer.outputColorSpace = window.matchMedia("(color-gamut: p3)").matches
    ? DisplayP3ColorSpace
    : SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.compile(scene, camera);
  /**
   * use gsap to run threejs raf, since it's a relatively simple shader
   * we can handle resize in the raf instead of worrying about desyncs
   * during a window resize listener.
   */
  gsap.ticker.fps(60);
  gsap.ticker.add(
    (time, deltaTime, frame) => {
      mesh.material.uniforms.uTick.value = frame * 0.0075;
      mesh.material.uniforms.uWidth.value = renderer.domElement.clientWidth;
      mesh.material.uniforms.uHeight.value = renderer.domElement.clientHeight;

      if (resizeRendererToDisplaySize(renderer)) {
        camera.aspect =
          renderer.domElement.clientWidth / renderer.domElement.clientHeight;
        camera.updateProjectionMatrix();
      }

      renderer.render(scene, camera);
    },
    false,
    false,
  );

  /**
   * setup text animations and blobby scroll color and size change interaction
   */
  const mm = gsap.matchMedia();

  mm.add("(prefers-reduced-motion: no-preference)", () => {
    gsap.registerPlugin(ScrollTrigger);

    ScrollTrigger.config({
      ignoreMobileResize: true,
    });

    const topTl = gsap.timeline({
      autoRemoveChildren: true,
    });

    const meshTl = gsap.timeline({
      autoRemoveChildren: true,
      scrollTrigger: {
        trigger: "main",
        start: "top top",
        scrub: 2,
        invalidateOnRefresh: true,
      },
    });

    topTl
      .to("h1, p", {
        opacity: 1,
        duration: 0.4,
        ease: "linear",
        stagger: 0.15,
      })
      .to(
        "h1, p",
        {
          y: 0,
          duration: 1.8,
          ease: "elastic.out(1, 0.4)",
          stagger: 0.15,
        },
        "<5%",
      );

    meshTl
      .to(mesh.material.uniforms.uColor, {
        value: 0.2,
        ease: "none",
      })
      .to(
        mesh.material.uniforms.uMobileOrDesktopDistCheck,
        {
          value: () => (landscapeOrientation.matches ? 0.45 : 0.25),
          ease: "none",
        },
        0,
      );

    ScrollTrigger.batch(["h2", "div > *", "h3"], {
      start: "top bottom",
      end: "bottom bottom",
      invalidateOnRefresh: true,
      once: true,
      onEnter: (batch) => {
        const itemsTl = gsap.timeline({ autoRemoveChildren: true });

        itemsTl
          .to(batch, {
            opacity: 1,
            duration: 0.4,
            ease: "linear",
            stagger: 0.15,
          })
          .to(
            batch,
            {
              y: 0,
              duration: 1.8,
              ease: "elastic.out(1, 0.4)",
              stagger: 0.15,
            },
            "<5%",
          );
      },
    });
  });
}

/**
 * resize helper
 */
function resizeRendererToDisplaySize(renderer) {
  const canvas = renderer.domElement;
  const pixelRatio = window.devicePixelRatio;
  const width = Math.floor(canvas.clientWidth * pixelRatio);
  const height = Math.floor(canvas.clientHeight * pixelRatio);
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    renderer.setSize(width, height, false);
  }
  return needResize;
}

/**
 * handle service worker
 */
!(async function handleServiceWorker() {
  if ("serviceWorker" in navigator) {
    try {
      const { Workbox } = await import("workbox-window");
      const wb = new Workbox("/sw.js");

      wb.addEventListener("installed", (event) => {
        if (event.isUpdate) {
          window.location.reload();
        }
      });

      wb.register();
    } catch (err) {
      console.error(err);
    }
  }
})();

/**
 * polite console
 */
const politeString =
  document.documentElement.dataset.city === "unknown"
    ? `%cThanks for checking out my site!`
    : `%cThanks for checking out my site all the way from ${document.documentElement.dataset.city}!`;

console.log(
  politeString,
  `font-family: Inter, Roboto, "Helvetica Neue", "Arial Nova",
  "Nimbus Sans", Arial, sans-serif; text-transform: uppercase; font-weight:     bold; letter-spacing: .12em; font-size: 3rem; color: black;`,
);
