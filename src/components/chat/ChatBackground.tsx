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
    scene.background = new THREE.Color(0xffffff); // Pure white background
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(renderer.domElement);

    // Controls - Adjusted for better viewing
    const controls = new OrbitControls(camera, renderer.domElement);
    camera.position.set(0, 0, 12); // Moved camera further back
    controls.update();
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
    
    // Limit rotation to keep text readable
    controls.minPolarAngle = Math.PI / 2.5; // Limit vertical rotation
    controls.maxPolarAngle = Math.PI / 1.5;

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
      { text: "Hi, I noticed a leak in the kitchen sink. Can someone check it out?", sender: "tenant", delay: 0 },
      { text: "Thanks for letting me know. I'll send a plumber over tomorrow.", sender: "landlord", delay: 3000 },
      { text: "That would be great. What time should I expect them?", sender: "tenant", delay: 5000 },
      { text: "They should arrive between 10 AM and 12 PM. Let me know if that works for you.", sender: "landlord", delay: 8000 },
      { text: "That works. Also, the hallway light is flickering.", sender: "tenant", delay: 10000 },
      { text: "I'll have them check that as well. Thanks for reporting it!", sender: "landlord", delay: 12000 },
    ];

    let messageGroups: THREE.Group[] = [];
    let typingIndicator: THREE.Group | null = null;

    // Load font and create messages
    const loader = new FontLoader();
    loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {
      // Create typing indicator dots
      function createTypingIndicator(isTenant: boolean) {
        const group = new THREE.Group();
        const dotGeometry = new THREE.SphereGeometry(0.03, 16, 16);
        const dotMaterial = new THREE.MeshStandardMaterial({ 
          color: isTenant ? 0xffffff : 0xffffff, // White dots
          metalness: 0.1,
          roughness: 0.3,
        });

        for (let i = 0; i < 3; i++) {
          const dot = new THREE.Mesh(dotGeometry, dotMaterial);
          dot.position.x = i * 0.1 - 0.1;
          group.add(dot);
        }

        group.position.set(isTenant ? -2 : 2, 2, -2);
        group.visible = false;
        scene.add(group);
        return group;
      }

      function animateTypingIndicator() {
        if (!typingIndicator) return;
        typingIndicator.children.forEach((dot, i) => {
          const time = Date.now() * 0.003;
          (dot as THREE.Mesh).position.y = Math.sin(time + i) * 0.05;
        });
      }

      function addMessage(message: { text: string; sender: string }, index: number) {
        const isTenant = message.sender === "tenant";
        const textGeometry = new TextGeometry(message.text, {
          font: font,
          size: 0.15,
          depth: 0.02,
          curveSegments: 12,
          bevelEnabled: true,
          bevelThickness: 0.005,
          bevelSize: 0.005,
          bevelSegments: 3
        });
        
        textGeometry.computeBoundingBox();
        const textWidth = textGeometry.boundingBox!.max.x - textGeometry.boundingBox!.min.x;
        const textHeight = textGeometry.boundingBox!.max.y - textGeometry.boundingBox!.min.y;
        
        const bubbleGeometry = new THREE.BoxGeometry(
          textWidth + 0.4,
          textHeight + 0.2,
          0.1
        );
        
        const textMaterial = new THREE.MeshStandardMaterial({ 
          color: 0x000000, // Black text
          metalness: 0.1,
          roughness: 0.6,
        });
        
        const bubbleMaterial = new THREE.MeshStandardMaterial({
          color: 0xffffff, // White bubbles for both tenant and landlord
          metalness: 0.1,
          roughness: 0.3,
        });

        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        const bubbleMesh = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
        
        const messageGroup = new THREE.Group();
        messageGroup.add(bubbleMesh);
        messageGroup.add(textMesh);
        
        textMesh.position.set(-textWidth/2 + 0.2, -textHeight/2 + 0.1, 0.06);
        
        // Adjusted message positioning
        messageGroup.position.set(
          (isTenant ? -4 : 4), // Moved messages further apart horizontally
          4 - index * 1.2, // Increased vertical spacing and moved up
          -2 - index * 0.1
        );
        
        // Lock rotation for better readability
        messageGroup.rotation.set(0, 0, 0);
        
        messageGroup.scale.set(0, 0, 0);
        messageGroup.visible = false;
        scene.add(messageGroup);
        messageGroups.push(messageGroup);

        return messageGroup;
      }

      // Create all messages but keep them invisible
      const messageElements = messages.map((msg, i) => addMessage(msg, i));
      typingIndicator = createTypingIndicator(true);

      // Simulate chat conversation
      messages.forEach((message, index) => {
        const showTyping = () => {
          if (typingIndicator) {
            typingIndicator.visible = true;
            typingIndicator.position.x = message.sender === "tenant" ? -4 : 4; // Adjusted typing indicator position
            typingIndicator.position.y = 4 - index * 1.2; // Adjusted vertical position
            typingIndicator.children.forEach(dot => {
              (dot as THREE.Mesh).material = new THREE.MeshStandardMaterial({
                color: 0xeeeeee // Light gray dots
              });
            });
          }
        };

        const hideTyping = () => {
          if (typingIndicator) {
            typingIndicator.visible = false;
          }
        };

        setTimeout(showTyping, message.delay);
        setTimeout(() => {
          hideTyping();
          const messageGroup = messageElements[index];
          messageGroup.visible = true;
          animateMessage(messageGroup);
        }, message.delay + 1500);
      });

      function animateMessage(group: THREE.Group) {
        const duration = 800;
        const start = Date.now();
        
        function updateScale() {
          const now = Date.now();
          const progress = Math.min(1, (now - start) / duration);
          const scale = 1 + Math.sin(progress * Math.PI) * 0.1;
          group.scale.set(scale, scale, scale);
          
          if (progress < 1) {
            requestAnimationFrame(updateScale);
          }
        }
        
        updateScale();
      }
    });

    // Animation loop
    function animate() {
      requestAnimationFrame(animate);
      
      // Animate typing indicator
      if (typingIndicator && typingIndicator.visible) {
        typingIndicator.children.forEach((dot, i) => {
          const time = Date.now() * 0.003;
          (dot as THREE.Mesh).position.y = Math.sin(time + i) * 0.05;
        });
      }

      // Gentle floating animation for messages, without rotation
      messageGroups.forEach((group) => {
        if (group.visible) {
          const time = Date.now() * 0.001;
          group.position.y += Math.sin(time) * 0.0001;
          // Removed rotation animations
        }
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
      messageGroups.forEach(group => {
        group.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            (child.material as THREE.Material).dispose();
          }
        });
        scene.remove(group);
      });
      if (typingIndicator) {
        typingIndicator.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            (child.material as THREE.Material).dispose();
          }
        });
        scene.remove(typingIndicator);
      }
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
