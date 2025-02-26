
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

    // Controls setup
    const controls = new OrbitControls(camera, renderer.domElement);
    camera.position.set(2, 0, 12);
    controls.update();
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
    controls.minPolarAngle = Math.PI / 2.5;
    controls.maxPolarAngle = Math.PI / 1.5;

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0x404040, 3);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    // Chat messages
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
    let animationStartTime = Date.now();
    let isAnimating = true;

    // Load font and create messages
    const loader = new FontLoader();
    loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {
      function createTypingIndicator(isTenant: boolean) {
        const group = new THREE.Group();
        const dotGeometry = new THREE.SphereGeometry(0.03, 16, 16);
        const dotMaterial = new THREE.MeshStandardMaterial({ 
          color: 0xcccccc,
          metalness: 0.1,
          roughness: 0.3,
        });

        for (let i = 0; i < 3; i++) {
          const dot = new THREE.Mesh(dotGeometry, dotMaterial);
          dot.position.x = i * 0.1 - 0.1;
          group.add(dot);
        }

        group.position.set(isTenant ? 2 : 6, 2, -2);
        group.visible = false;
        scene.add(group);
        return group;
      }

      function addMessage(message: { text: string; sender: string }, index: number) {
        const isTenant = message.sender === "tenant";
        const textGeometry = new TextGeometry(message.text, {
          font: font,
          size: 0.15,
          depth: 0.01,
          curveSegments: 12,
          bevelEnabled: false
        });
        
        textGeometry.computeBoundingBox();
        const textWidth = textGeometry.boundingBox!.max.x - textGeometry.boundingBox!.min.x;
        const textHeight = textGeometry.boundingBox!.max.y - textGeometry.boundingBox!.min.y;
        
        const textMaterial = new THREE.MeshStandardMaterial({ 
          color: 0x000000,
          metalness: 0,
          roughness: 1,
        });

        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        const messageGroup = new THREE.Group();
        messageGroup.add(textMesh);
        
        textMesh.position.set(-textWidth/2, -textHeight/2, 0);
        
        messageGroup.position.set(
          (isTenant ? 2 : 6),
          4 - index * 1.2,
          -2 - index * 0.1
        );
        
        messageGroup.rotation.set(0, 0, 0);
        messageGroup.visible = false;
        scene.add(messageGroup);
        messageGroups.push(messageGroup);

        return messageGroup;
      }

      function startAnimation() {
        // Reset all messages to invisible
        messageGroups.forEach(group => {
          group.visible = false;
        });
        if (typingIndicator) {
          typingIndicator.visible = false;
        }
        animationStartTime = Date.now();
        isAnimating = true;
      }

      // Create all messages
      const messageElements = messages.map((msg, i) => addMessage(msg, i));
      typingIndicator = createTypingIndicator(true);

      // Function to play the animation sequence
      function playMessageSequence() {
        messages.forEach((message, index) => {
          const showTyping = () => {
            if (typingIndicator && isAnimating) {
              typingIndicator.visible = true;
              typingIndicator.position.x = message.sender === "tenant" ? 2 : 6;
              typingIndicator.position.y = 4 - index * 1.2;
            }
          };

          const hideTyping = () => {
            if (typingIndicator) {
              typingIndicator.visible = false;
            }
          };

          setTimeout(showTyping, message.delay);
          setTimeout(() => {
            if (isAnimating) {
              hideTyping();
              const messageGroup = messageElements[index];
              messageGroup.visible = true;
              messageGroup.scale.set(1, 1, 1);

              // If this is the last message, schedule a restart
              if (index === messages.length - 1) {
                setTimeout(() => {
                  startAnimation();
                  playMessageSequence();
                }, 3000); // Wait 3 seconds before restarting
              }
            }
          }, message.delay + 1500);
        });
      }

      // Start the initial animation
      playMessageSequence();
    });

    // Animation loop
    function animate() {
      requestAnimationFrame(animate);
      
      if (typingIndicator && typingIndicator.visible) {
        typingIndicator.children.forEach((dot, i) => {
          const time = Date.now() * 0.003;
          (dot as THREE.Mesh).position.y = Math.sin(time + i) * 0.05;
        });
      }

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
      // Cleanup
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
