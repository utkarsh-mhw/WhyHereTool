import { useEffect, useRef, useState } from 'react';

type InteractiveThreeSceneProps = {
  className?: string;
};

// Global singleton to ensure Three.js is only imported once across all component instances
declare global {
  var __THREE_MODULE__: any;
  var __THREE_MODULE_PROMISE__: Promise<any> | null;
  var __THREE_SCENE_INITIALIZED__: boolean;
}

// Initialize global flags
if (typeof globalThis.__THREE_SCENE_INITIALIZED__ === 'undefined') {
  globalThis.__THREE_SCENE_INITIALIZED__ = false;
}

function getThreeModule() {
  // Check if we already have the module loaded
  if (globalThis.__THREE_MODULE__) {
    return Promise.resolve(globalThis.__THREE_MODULE__);
  }
  
  // Check if we're already loading it
  if (globalThis.__THREE_MODULE_PROMISE__) {
    return globalThis.__THREE_MODULE_PROMISE__;
  }
  
  // Start loading
  globalThis.__THREE_MODULE_PROMISE__ = import('three').then((THREE) => {
    globalThis.__THREE_MODULE__ = THREE;
    globalThis.__THREE_MODULE_PROMISE__ = null; // Clear the promise after loading
    return THREE;
  });
  
  return globalThis.__THREE_MODULE_PROMISE__;
}

export function InteractiveThreeScene({ className = '' }: InteractiveThreeSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<any>(null);
  const rendererRef = useRef<any>(null);
  const animationIdRef = useRef<number | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    // Use global flag to prevent multiple initializations even in StrictMode
    if (globalThis.__THREE_SCENE_INITIALIZED__) {
      return;
    }
    
    if (!containerRef.current) return;

    let isMounted = true;
    globalThis.__THREE_SCENE_INITIALIZED__ = true;

    // Use singleton Three.js module
    getThreeModule().then((THREE) => {
      if (!isMounted || !containerRef.current) return;

      const container = containerRef.current;
      const width = container.clientWidth;
      const height = container.clientHeight;

      // Scene
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      // Camera
      const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
      camera.position.z = 8;

      // Renderer
      const renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true 
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // Lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);

      const pointLight1 = new THREE.PointLight(0x10b981, 2, 100);
      pointLight1.position.set(5, 5, 5);
      scene.add(pointLight1);

      const pointLight2 = new THREE.PointLight(0x14b8a6, 2, 100);
      pointLight2.position.set(-5, -5, 5);
      scene.add(pointLight2);

      const pointLight3 = new THREE.PointLight(0x06b6d4, 1.5, 100);
      pointLight3.position.set(0, 5, -5);
      scene.add(pointLight3);

      // Geometries
      const geometries: any[] = [];

      // Central dodecahedron with glass material
      const dodecaGeometry = new THREE.DodecahedronGeometry(1.5, 0);
      const dodecaMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x10b981,
        metalness: 0.9,
        roughness: 0.1,
        transmission: 0.9,
        thickness: 0.5,
        transparent: true,
        opacity: 0.8,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        emissive: 0x10b981,
        emissiveIntensity: 0.2
      });
      const dodeca = new THREE.Mesh(dodecaGeometry, dodecaMaterial);
      dodeca.castShadow = true;
      scene.add(dodeca);
      geometries.push(dodeca);

      // Rotating rings
      const createRing = (radius: number, color: number, rotationAxis: 'x' | 'y' | 'z') => {
        const ringGeometry = new THREE.TorusGeometry(radius, 0.08, 16, 100);
        const ringMaterial = new THREE.MeshPhongMaterial({
          color,
          transparent: true,
          opacity: 0.6,
          emissive: color,
          emissiveIntensity: 0.3
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.castShadow = true;
        
        if (rotationAxis === 'x') ring.rotation.x = Math.PI / 2;
        if (rotationAxis === 'y') ring.rotation.y = Math.PI / 2;
        
        scene.add(ring);
        return ring;
      };

      const ring1 = createRing(2.5, 0x10b981, 'x');
      const ring2 = createRing(3, 0x14b8a6, 'y');
      const ring3 = createRing(3.5, 0x06b6d4, 'z');
      geometries.push(ring1, ring2, ring3);

      // Orbiting spheres (data nodes)
      const sphereGeometry = new THREE.SphereGeometry(0.15, 32, 32);
      const spheres: any[] = [];
      const numSpheres = 8;
      
      for (let i = 0; i < numSpheres; i++) {
        const material = new THREE.MeshPhongMaterial({
          color: 0x10b981,
          emissive: 0x10b981,
          emissiveIntensity: 0.5,
          shininess: 100
        });
        const sphere = new THREE.Mesh(sphereGeometry, material);
        sphere.castShadow = true;
        scene.add(sphere);
        spheres.push(sphere);
      }

      // Particle field
      const particlesGeometry = new THREE.BufferGeometry();
      const particleCount = 300;
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);
      
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 20;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
        
        const color = new THREE.Color();
        color.setHSL(0.5 + Math.random() * 0.1, 0.7, 0.5);
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
      }

      particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      
      const particlesMaterial = new THREE.PointsMaterial({
        size: 0.05,
        vertexColors: true,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
      });
      const particles = new THREE.Points(particlesGeometry, particlesMaterial);
      scene.add(particles);

      // Mouse interaction
      const mouse = { x: 0, y: 0 };
      const handleMouseMove = (event: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      };
      container.addEventListener('mousemove', handleMouseMove);

      // Animation loop
      const animate = () => {
        if (!isMounted) return;

        const time = Date.now() * 0.001;

        // Rotate central dodecahedron
        dodeca.rotation.x = time * 0.3;
        dodeca.rotation.y = time * 0.2;

        // Rotate rings at different speeds
        ring1.rotation.z = time * 0.4;
        ring2.rotation.z = time * 0.3;
        ring3.rotation.z = time * 0.2;

        // Mouse interaction - tilt based on mouse position
        const targetRotationX = mouse.y * 0.3;
        const targetRotationY = mouse.x * 0.3;
        dodeca.rotation.x += (targetRotationX - dodeca.rotation.x) * 0.05;
        dodeca.rotation.y += (targetRotationY - dodeca.rotation.y) * 0.05;

        // Orbit spheres
        spheres.forEach((sphere, i) => {
          const angle = (time + i * (Math.PI * 2 / numSpheres)) * 0.5;
          const radius = 3.5;
          sphere.position.x = Math.cos(angle) * radius;
          sphere.position.z = Math.sin(angle) * radius;
          sphere.position.y = Math.sin(angle * 2) * 0.5;
          
          // Pulse effect
          const scale = 1 + Math.sin(time * 2 + i) * 0.2;
          sphere.scale.set(scale, scale, scale);
        });

        // Particle rotation
        particles.rotation.y = time * 0.05;
        particles.rotation.x = Math.sin(time * 0.3) * 0.2;

        // Camera subtle movement
        camera.position.x = Math.sin(time * 0.2) * 0.5;
        camera.position.y = Math.cos(time * 0.3) * 0.5;
        camera.lookAt(0, 0, 0);

        renderer.render(scene, camera);
        animationIdRef.current = requestAnimationFrame(animate);
      };

      animate();

      // Handle resize
      const handleResize = () => {
        if (!container) return;
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight;

        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
      };

      window.addEventListener('resize', handleResize);

      // Cleanup
      return () => {
        isMounted = false;
        container.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('resize', handleResize);
        
        if (animationIdRef.current) {
          cancelAnimationFrame(animationIdRef.current);
        }

        geometries.forEach(mesh => {
          if (mesh.geometry) mesh.geometry.dispose();
          if (mesh.material) {
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((mat: any) => mat.dispose());
            } else {
              mesh.material.dispose();
            }
          }
        });

        spheres.forEach(sphere => {
          if (sphere.geometry) sphere.geometry.dispose();
          if (sphere.material) {
            if (Array.isArray(sphere.material)) {
              sphere.material.forEach((mat: any) => mat.dispose());
            } else {
              sphere.material.dispose();
            }
          }
        });

        if (particlesGeometry) particlesGeometry.dispose();
        if (particlesMaterial) particlesMaterial.dispose();

        if (rendererRef.current) {
          rendererRef.current.dispose();
          if (container && rendererRef.current.domElement && container.contains(rendererRef.current.domElement)) {
            container.removeChild(rendererRef.current.domElement);
          }
        }
      };
    }).catch((error) => {
      console.error('Failed to load Three.js:', error);
    });

    // Cleanup when component unmounts - reset the global flag so it can reinitialize on return
    return () => {
      isMounted = false;
      // Reset the flag so the scene can be recreated when user returns to home page
      globalThis.__THREE_SCENE_INITIALIZED__ = false;
    };
  }, []); // Empty dependency array - only run once

  return (
    <div 
      ref={containerRef} 
      className={className}
      style={{ width: '100%', height: '100%' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    />
  );
}