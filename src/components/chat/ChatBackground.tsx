
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export function ChatBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup with white background
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    camera.position.set(0, 2, 5);
    controls.update();
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = false;

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x3b82f6, 1);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Chat conversation messages
    const messages = [
      "Tenant: Hi, I noticed a leak in the kitchen sink. Can someone check it out?",
      "Landlord: Thanks for letting me know. I'll send a plumber over tomorrow.",
      "Tenant: That would be great. What time should I expect them?",
      "Landlord: They should arrive between 10 AM and 12 PM. Let me know if that works for you.",
      "Tenant: That works. Also, the hallway light is flickering.",
      "Landlord: I'll have them check that as well. Thanks for reporting it!",
    ];

    let messageIndex = 0;
    let textMeshes: THREE.Mesh[] = [];

    // Load font and create messages
    const loader = new FontLoader();
    loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {
      function addMessage(text: string, index: number) {
        const isTenant = text.startsWith("Tenant:");
        const textGeometry = new TextGeometry(text, {
          font: font,
          size: 0.2, // Smaller size for conversation
          depth: 0.05,
          curveSegments: 12,
          bevelEnabled: false
        });
        const textMaterial = new THREE.MeshStandardMaterial({ 
          color: isTenant ? 0x3b82f6 : 0x10b981, // Blue for tenant, green for landlord
          metalness: 0.1,
          roughness: 0.2,
        });
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        
        // Center and position the text
        textGeometry.computeBoundingBox();
        const textWidth = textGeometry.boundingBox!.max.x - textGeometry.boundingBox!.min.x;
        textMesh.position.set(
          -textWidth/2 + (isTenant ? -1 : 1), // Offset left for tenant, right for landlord
          3 - index * 0.6, // Stack messages vertically
          -2 - index * 0.2 // Slight depth variation
        );
        
        // Start with zero scale
        textMesh.scale.set(0, 0, 0);
        scene.add(textMesh);
        textMeshes.push(textMesh);

        // Animate in after a delay
        setTimeout(() => {
          animateMessage(index);
        }, index * 1200); // Slightly longer delay between messages
      }

      messages.forEach((msg, i) => addMessage(msg, i));

      function animateMessage(index: number) {
        if (index < textMeshes.length) {
          const mesh = textMeshes[index];
          // Animate scale
          const duration = 1000;
          const start = Date.now();
          
          function updateScale() {
            const now = Date.now();
            const progress = Math.min(1, (now - start) / duration);
            
            // Elastic easing
            const scale = Math.pow(progress, 0.3) * 
              Math.sin(progress * Math.PI * 2.5) * 0.15 + progress;
            
            mesh.scale.set(scale, scale, scale);
            
            if (progress < 1) {
              requestAnimationFrame(updateScale);
            }
          }
          
          updateScale();
        }
      }
    });

    // Animation loop
    function animate() {
      requestAnimationFrame(animate);
      
      // Gentle floating animation for text meshes
      textMeshes.forEach((mesh, index) => {
        const time = Date.now() * 0.001;
        mesh.position.y += Math.sin(time + index) * 0.0002;
        mesh.rotation.x = Math.sin(time + index) * 0.02;
        mesh.rotation.y = Math.cos(time + index) * 0.02;
      });

      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    // Handle window resize
    function handleResize() {
      if (!containerRef.current) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      // Cleanup meshes and geometries
      textMeshes.forEach(mesh => {
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
        scene.remove(mesh);
      });
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none bg-white"
      style={{ zIndex: 0 }}
    />
  );
}
