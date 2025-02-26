
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export function ChatBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup with gradient background
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf1f0fb); // Light purple background matching the chat
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    camera.position.set(0, 0, 8); // Moved camera back for better view
    controls.update();
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = false;
    controls.enablePan = false; // Disable panning for better focus
    controls.autoRotate = true; // Add subtle auto-rotation
    controls.autoRotateSpeed = 0.5; // Slow rotation speed

    // Enhanced lighting setup
    const ambientLight = new THREE.AmbientLight(0x404040, 3);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x3b82f6, 1);
    pointLight1.position.set(5, 5, 5);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x10b981, 1);
    pointLight2.position.set(-5, -5, 5);
    scene.add(pointLight2);

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
          size: 0.15, // Even smaller size for better readability
          depth: 0.02, // Thinner depth for more subtle 3D effect
          curveSegments: 12,
          bevelEnabled: true, // Enable bevel for softer edges
          bevelThickness: 0.005,
          bevelSize: 0.005,
          bevelSegments: 3
        });
        
        // Create a message bubble geometry
        textGeometry.computeBoundingBox();
        const textWidth = textGeometry.boundingBox!.max.x - textGeometry.boundingBox!.min.x;
        const textHeight = textGeometry.boundingBox!.max.y - textGeometry.boundingBox!.min.y;
        
        const bubbleGeometry = new THREE.RoundedBoxGeometry(
          textWidth + 0.4, // Add padding
          textHeight + 0.2,
          0.1,
          8,
          0.1
        );
        
        // Create materials
        const textMaterial = new THREE.MeshStandardMaterial({ 
          color: isTenant ? 0xffffff : 0xffffff, // White text for both
          metalness: 0.1,
          roughness: 0.6,
        });
        
        const bubbleMaterial = new THREE.MeshStandardMaterial({
          color: isTenant ? 0x3b82f6 : 0x10b981, // Blue for tenant, green for landlord
          metalness: 0.1,
          roughness: 0.3,
        });

        // Create meshes
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        const bubbleMesh = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
        
        // Create a group to hold both the bubble and text
        const messageGroup = new THREE.Group();
        messageGroup.add(bubbleMesh);
        messageGroup.add(textMesh);
        
        // Position the text inside the bubble
        textMesh.position.set(-textWidth/2 + 0.2, -textHeight/2 + 0.1, 0.06);
        
        // Position the entire message group
        messageGroup.position.set(
          (isTenant ? -2 : 2), // Left or right side
          2 - index * 0.8, // Vertical stacking
          -2 - index * 0.1 // Slight depth variation
        );
        
        // Start with zero scale
        messageGroup.scale.set(0, 0, 0);
        scene.add(messageGroup);
        textMeshes.push(messageGroup);

        // Animate in after a delay
        setTimeout(() => {
          animateMessage(index);
        }, index * 800); // Faster message appearance
      }

      messages.forEach((msg, i) => addMessage(msg, i));

      function animateMessage(index: number) {
        if (index < textMeshes.length) {
          const group = textMeshes[index];
          const duration = 800;
          const start = Date.now();
          
          function updateScale() {
            const now = Date.now();
            const progress = Math.min(1, (now - start) / duration);
            
            // Bounce easing
            const scale = 1 + Math.sin(progress * Math.PI) * 0.1;
            group.scale.set(scale, scale, scale);
            
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
      
      // Gentle floating animation for messages
      textMeshes.forEach((group, index) => {
        const time = Date.now() * 0.001;
        group.position.y += Math.sin(time + index) * 0.0001; // Subtle vertical movement
        group.rotation.x = Math.sin(time + index) * 0.01; // Very subtle rotation
        group.rotation.y = Math.cos(time + index) * 0.01;
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
      textMeshes.forEach(group => {
        group.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            (child.material as THREE.Material).dispose();
          }
        });
        scene.remove(group);
      });
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
