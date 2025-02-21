
import { useAuthState } from "@/hooks/useAuthState";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useRef } from "react";
import * as THREE from "three";
import { Building2, Network, Key, Shield, ArrowRight } from "lucide-react";

export default function InfoPage() {
  const { isLoading, isAuthenticated } = useAuthState();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0x4f46e5, 2);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Create platform base
    const platformGeometry = new THREE.CylinderGeometry(5, 5, 0.2, 32, 1, false);
    const platformMaterial = new THREE.MeshPhongMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.3,
      shininess: 100,
    });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    scene.add(platform);

    // Create connection lines
    const connectionMaterial = new THREE.LineBasicMaterial({ 
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.5 
    });

    // Create floating cubes representing different user types
    const createFloatingCube = (color: number, position: THREE.Vector3) => {
      const geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
      const material = new THREE.MeshPhongMaterial({
        color,
        transparent: true,
        opacity: 0.9,
        shininess: 100,
      });
      const cube = new THREE.Mesh(geometry, material);
      cube.position.copy(position);
      scene.add(cube);
      return cube;
    };

    // Create data particles
    const particleCount = 100;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount * 3; i += 3) {
      const radius = Math.random() * 5;
      const angle = Math.random() * Math.PI * 2;
      particlePositions[i] = Math.cos(angle) * radius;
      particlePositions[i + 1] = (Math.random() - 0.5) * 4;
      particlePositions[i + 2] = Math.sin(angle) * radius;
      particleSizes[i / 3] = Math.random() * 0.1;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));

    const particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(0x60a5fa) },
      },
      vertexShader: `
        attribute float size;
        uniform float time;
        varying vec3 vColor;
        void main() {
          vec3 pos = position;
          pos.y += sin(time + position.x) * 0.2;
          pos.x += cos(time + position.z) * 0.2;
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
          vColor = vec3(0.4, 0.6, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          float r = distance(gl_PointCoord, vec2(0.5));
          if (r > 0.5) discard;
          gl_FragColor = vec4(vColor, 1.0 - r * 2.0);
        }
      `,
      transparent: true,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // Position camera
    camera.position.set(0, 4, 8);
    camera.lookAt(0, 0, 0);

    // Animation loop
    let time = 0;
    const animate = () => {
      requestAnimationFrame(animate);
      time += 0.005;

      // Update particle animation
      particleMaterial.uniforms.time.value = time;

      // Rotate platform
      platform.rotation.y += 0.002;

      // Update camera position based on mouse
      camera.position.x += (mousePosition.x * 8 - camera.position.x) * 0.05;
      camera.position.y += (mousePosition.y * 4 + 4 - camera.position.y) * 0.05;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    // Handle mouse movement
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: -(e.clientY / window.innerHeight - 0.5) * 2
      });
    };

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);
    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [mousePosition]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="text-lg text-gray-800">Loading...</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900">
      {/* 3D Animation Container */}
      <div ref={containerRef} className="absolute inset-0 pointer-events-none" />

      {/* Content Overlay */}
      <div className="relative z-10">
        <div className="container mx-auto px-6 pt-32 pb-20">
          <div className="flex flex-col items-center text-center space-y-8">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000"></div>
              <div className="relative p-6 bg-white/10 rounded-full backdrop-blur-xl border border-white/20 shadow-xl">
                <img 
                  src="/lovable-uploads/9c23bc1b-4e8c-433e-a961-df606dc6a2c6.png" 
                  alt="AdminChirii.ro Logo" 
                  className="w-16 h-16 transform group-hover:scale-110 transition-transform duration-300"
                />
              </div>
            </div>
            <h1 className="text-6xl font-bold text-white tracking-tight">
              Welcome to the Future of<br />Property Management
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl">
              Experience a revolutionary platform that brings together landlords, tenants, and service providers 
              in one seamless, intelligent ecosystem.
            </p>
            {!isAuthenticated && (
              <Button 
                onClick={() => navigate('/auth')}
                className="relative group px-8 py-6 text-lg bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 opacity-0 group-hover:opacity-20 blur transition-opacity duration-300" />
                <span className="relative flex items-center gap-2">
                  Get Started Now
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Button>
            )}
          </div>
        </div>

        {/* Features Grid */}
        <div className="container mx-auto px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Building2,
                title: "Smart Property Management",
                description: "AI-driven insights and automated property operations"
              },
              {
                icon: Network,
                title: "Unified Platform",
                description: "Seamlessly connect all stakeholders in one ecosystem"
              },
              {
                icon: Key,
                title: "Digital Access Control",
                description: "Secure and smart access management system"
              },
              {
                icon: Shield,
                title: "Enhanced Security",
                description: "Enterprise-grade security for your property data"
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="group relative"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-500" />
                <div className="relative p-8 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 transition-transform duration-300 group-hover:-translate-y-2">
                  <div className="inline-flex p-4 rounded-xl bg-gradient-to-r from-blue-500/20 to-indigo-500/20 mb-6">
                    <feature.icon className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-4">{feature.title}</h3>
                  <p className="text-gray-300">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
