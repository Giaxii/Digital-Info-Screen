// Touch-Optimized 2D Physics Engine with Inertial Custom Scroll and Volumetric Scale
// Fully solves overlap prevention, outline rendering, and edge scaling

class BubbleSimulation {
  constructor(containerElement, onBubbleClick) {
    this.container = containerElement;
    this.onBubbleClick = onBubbleClick;
    this.bubbles = [];
    this.animationFrameId = null;
    this.running = false;
    
    // Boundary size (recalculated on load/resize)
    this.width = this.container.clientWidth || 400;
    this.containerHeight = this.container.clientHeight || 800;
    this.height = this.containerHeight;
    
    // Simulated scrolling variables
    this.scrollY = 0;
    this.targetScrollY = 0;
    this.maxScrollY = 0;
    
    this.maybeDragging = false;
    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;
    this.startScrollY = 0;
    this.scrollVelocity = 0;
    this.lastPointerY = 0;
    this.lastPointerTime = 0;
    
    // Bind resize and scroll-drag event listeners
    this.setupEventListeners();
    this.setupDragListeners();
  }

  setupEventListeners() {
    window.addEventListener("resize", () => {
      this.width = this.container.clientWidth;
      this.containerHeight = this.container.clientHeight || 800;
      
      const cols = this.width >= 500 ? 3 : 2;
      const rows = Math.ceil(this.bubbles.length / cols);
      const rowHeight = cols === 3 ? 240 : 210;
      
      this.height = Math.max(this.containerHeight, rows * rowHeight + 100);
      this.maxScrollY = Math.max(0, this.height - this.containerHeight);
    });
  }

  setupDragListeners() {
    this.container.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      this.maybeDragging = true;
      this.isDragging = false;
      this.startX = e.clientX;
      this.startY = e.clientY;
      this.startScrollY = this.scrollY;
      this.lastPointerY = e.clientY;
      this.lastPointerTime = Date.now();
      this.scrollVelocity = 0;
    });

    this.container.addEventListener("pointermove", (e) => {
      if (!this.maybeDragging) return;
      
      const dist = Math.hypot(e.clientX - this.startX, e.clientY - this.startY);
      
      // If pointer moved more than 8px, transition into active drag mode
      if (!this.isDragging && dist > 8) {
        this.isDragging = true;
        this.container.setPointerCapture(e.pointerId);
      }
      
      if (this.isDragging) {
        const deltaY = e.clientY - this.startY;
        this.targetScrollY = this.startScrollY - deltaY;
        
        // Calculate drag velocity for inertia momentum
        const now = Date.now();
        const dt = now - this.lastPointerTime;
        if (dt > 0) {
          // Calculate pixels per frame velocity
          this.scrollVelocity = (this.lastPointerY - e.clientY) / dt * 16;
        }
        this.lastPointerY = e.clientY;
        this.lastPointerTime = now;
      }
    });

    this.container.addEventListener("pointerup", (e) => {
      this.maybeDragging = false;
      if (this.isDragging) {
        this.isDragging = false;
        try {
          this.container.releasePointerCapture(e.pointerId);
        } catch (err) {}
      }
    });

    this.container.addEventListener("pointercancel", (e) => {
      this.maybeDragging = false;
      this.isDragging = false;
    });
  }

  setCountries(countriesList) {
    // Stop running simulation
    this.stop();
    
    // Clear DOM container
    this.container.innerHTML = "";
    this.bubbles = [];
    
    if (!countriesList || countriesList.length === 0) return;
    
    this.width = this.container.clientWidth || 400;
    this.containerHeight = this.container.clientHeight || 800;
    const count = countriesList.length;
    
    // Responsive column count based on container width
    const cols = this.width >= 500 ? 3 : 2;
    const rows = Math.ceil(count / cols);
    const rowHeight = cols === 3 ? 240 : 210;
    this.height = Math.max(this.containerHeight, rows * rowHeight + 100);
    
    // Reset custom scrolling
    this.scrollY = 0;
    this.targetScrollY = 0;
    this.maxScrollY = Math.max(0, this.height - this.containerHeight);
    this.scrollVelocity = 0;
    
    countriesList.forEach((country, index) => {
      // Create DOM element
      const bubbleEl = document.createElement("div");
      bubbleEl.className = "country-bubble";
      bubbleEl.dataset.id = country.id;
      
      // Glassmorphic circle content with precise outline SVG path
      bubbleEl.innerHTML = `
        <div class="bubble-inner">
          <svg class="country-map-svg">
            <path d="${country.svgPath}" fill="none" stroke="rgba(255, 255, 255, 0.85)" stroke-width="1.2" vector-effect="non-scaling-stroke" stroke-linejoin="round" />
          </svg>
          <div class="bubble-label">${country.name}</div>
        </div>
      `;
      
      // Append to container
      this.container.appendChild(bubbleEl);
      
      // Calculate responsive bubble radius
      const initialRadius = this.getResponsiveBubbleRadius();
      
      // Distribute starting positions in a 2 or 3 column grid
      const row = Math.floor(index / cols);
      const col = index % cols;
      
      let colOffset;
      if (cols === 3) {
        colOffset = col === 0 ? 0.20 : (col === 1 ? 0.50 : 0.80);
      } else {
        colOffset = col === 0 ? 0.28 : 0.72;
      }
      
      const px = this.width * colOffset + (Math.random() - 0.5) * 10;
      const py = 150 + row * rowHeight + (Math.random() - 0.5) * 10;
      
      // Bubble physics object
      const bubble = {
        country: country,
        element: bubbleEl,
        x: px,
        y: py,
        anchorX: px, // local spring center home anchor
        anchorY: py, // local spring center home anchor
        vx: (Math.random() - 0.5) * 0.1,
        vy: (Math.random() - 0.5) * 0.1,
        baseRadius: initialRadius,
        radius: initialRadius,
        targetRadius: initialRadius,
        mass: initialRadius * initialRadius,
        noiseSeed: Math.random() * 100,
        clickTriggered: false
      };
      
      // Touch Tap gesture handler
      let pStartX = 0;
      let pStartY = 0;
      let pStartTime = 0;
      
      bubbleEl.addEventListener("pointerdown", (e) => {
        if (e.button !== 0) return;
        pStartX = e.clientX;
        pStartY = e.clientY;
        pStartTime = Date.now();
        bubbleEl.classList.add("touch-active");
      });
      
      bubbleEl.addEventListener("pointerup", (e) => {
        bubbleEl.classList.remove("touch-active");
        
        const dragDist = Math.hypot(e.clientX - pStartX, e.clientY - pStartY);
        const duration = Date.now() - pStartTime;
        
        // Only trigger click if pointer was not dragged (separation of scroll vs tap)
        if (dragDist < 8 && duration < 350) {
          if (bubble.clickTriggered) return;
          bubble.clickTriggered = true;
          
          bubbleEl.classList.add("tapped");
          
          setTimeout(() => {
            this.onBubbleClick(bubble);
          }, 180);
        }
      });
      
      bubbleEl.addEventListener("pointercancel", () => {
        bubbleEl.classList.remove("touch-active");
      });
      
      this.bubbles.push(bubble);
    });
    
    // Dynamically adjust SVG viewboxes using getBBox to fit their real paths
    const adjustBubbleViewBoxes = () => {
      let allDone = true;
      this.bubbles.forEach(b => {
        if (!b.viewBoxSet) {
          const svg = b.element.querySelector(".country-map-svg");
          if (svg) {
            try {
              const path = svg.querySelector("path");
              const bbox = path.getBBox();
              if (bbox.width > 0 && bbox.height > 0) {
                const maxDim = Math.max(bbox.width, bbox.height);
                const centerX = bbox.x + bbox.width / 2;
                const centerY = bbox.y + bbox.height / 2;
                const size = maxDim * 1.3; // 30% padding (15% on each side)
                svg.setAttribute("viewBox", `${centerX - size / 2} ${centerY - size / 2} ${size} ${size}`);
                b.viewBoxSet = true;
              } else {
                allDone = false;
              }
            } catch (e) {
              allDone = false;
            }
          }
        }
      });
      if (!allDone && this.running) {
        requestAnimationFrame(adjustBubbleViewBoxes);
      }
    };
    requestAnimationFrame(adjustBubbleViewBoxes);
    
    this.start();
  }

  getResponsiveBubbleRadius() {
    if (this.width < 500) {
      return 105; // radius 105px (diameter 210px) on bezel/mobile simulator
    }
    return 125; // radius 125px (diameter 250px) on large screens
  }

  start() {
    if (this.running) return;
    this.running = true;
    
    // Soft scale-in entry animation
    this.bubbles.forEach((b, i) => {
      b.element.style.transform = `scale(0)`;
      b.element.style.opacity = `0`;
      
      setTimeout(() => {
        if (!this.running) return;
        b.element.style.transition = "transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.8s ease";
        b.element.style.opacity = `1`;
        b.element.style.transform = `scale(1)`;
        
        setTimeout(() => {
          if (b.element && this.running) {
            b.element.style.transition = "";
            b.element.style.transform = "";
          }
        }, 850);
      }, i * 100);
    });

    this.loop();
  }

  stop() {
    this.running = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  loop() {
    if (!this.running) return;
    this.update();
    this.animationFrameId = requestAnimationFrame(() => this.loop());
  }

  update() {
    const time = Date.now() * 0.001;
    const drag = 0.96; // strong drag damping to make movement subtle
    const speedLimit = 0.45; // lower speed limit
    
    const currentBaseRadius = this.getResponsiveBubbleRadius();
    
    // 1. Calculate simulated scrolling physics (elastic boundaries and inertia momentum)
    if (!this.isDragging) {
      this.scrollVelocity *= 0.92; // Damping
      this.targetScrollY += this.scrollVelocity;
    } else {
      this.scrollVelocity *= 0.5; // Drag dampening
    }
    
    // Elastic bounds correction
    const minS = 0;
    const maxS = this.maxScrollY;
    if (this.targetScrollY < minS) {
      if (!this.isDragging) {
        this.targetScrollY += (minS - this.targetScrollY) * 0.15; // spring back
      } else {
        this.targetScrollY = minS + (this.targetScrollY - minS) * 0.45; // stretch drag resistance
      }
    } else if (this.targetScrollY > maxS) {
      if (!this.isDragging) {
        this.targetScrollY += (maxS - this.targetScrollY) * 0.15; // spring back
      } else {
        this.targetScrollY = maxS + (this.targetScrollY - maxS) * 0.45; // stretch drag resistance
      }
    }
    
    // Smoothly interpolate current scroll Y
    this.scrollY += (this.targetScrollY - this.scrollY) * 0.25;
    
    // 2. Calculate dynamic scroll-linked scale and opacity
    this.bubbles.forEach(b => {
      b.baseRadius = currentBaseRadius;
      
      // Calculate vertical position relative to viewport (0 = top, 1 = bottom)
      const relativeY = (b.y - this.scrollY) / this.containerHeight;
      const clampedRelY = Math.max(0, Math.min(1, relativeY));
      const offset = Math.abs(clampedRelY - 0.5) * 2; // 0 at center, 1 at edges
      
      // Dynamic scale: 1.0 in center, 0.40 at the edges
      const scrollScale = 1.0 - Math.pow(offset, 2) * 0.60;
      b.targetRadius = b.baseRadius * scrollScale;
      
      // Smoothly interpolate radius to avoid jitters
      b.radius += (b.targetRadius - b.radius) * 0.15;
      
      // Dynamic opacity: 1.0 in center, fade out completely (0.0) at the very edges
      const scrollOpacity = Math.max(0.0, 1.0 - Math.pow(offset, 2) * 1.0);
      b.element.style.opacity = scrollOpacity;
    });

    // 3. Apply floating physics forces and boundary clamping
    this.bubbles.forEach(b => {
      // Gentle sine/cosine floating motion
      const floatForce = 0.0018;
      b.vx += Math.sin(time + b.noiseSeed) * floatForce;
      b.vy += Math.cos(time * 0.8 + b.noiseSeed) * floatForce;
      
      // Anchor restoring force to keep bubbles row-aligned in the scrollable space
      const ax = b.anchorX - b.x;
      const ay = b.anchorY - b.y;
      b.vx += ax * 0.00015;
      b.vy += ay * 0.00015;

      // Apply drag damping
      b.vx *= drag;
      b.vy *= drag;

      // Velocity limit clamping
      const currentSpeed = Math.hypot(b.vx, b.vy);
      if (currentSpeed > speedLimit) {
        b.vx = (b.vx / currentSpeed) * speedLimit;
        b.vy = (b.vy / currentSpeed) * speedLimit;
      }

      // Update coordinates
      b.x += b.vx;
      b.y += b.vy;

      // Wall boundaries in world coordinates
      const minX = b.radius + 15;
      const maxX = this.width - b.radius - 15;
      const minY = b.radius + 15;
      const maxY = this.height - b.radius - 15;

      if (b.x < minX) {
        b.x = minX;
        b.vx = Math.abs(b.vx) * 0.5;
      } else if (b.x > maxX) {
        b.x = maxX;
        b.vx = -Math.abs(b.vx) * 0.5;
      }

      if (b.y < minY) {
        b.y = minY;
        b.vy = Math.abs(b.vy) * 0.5;
      } else if (b.y > maxY) {
        b.y = maxY;
        b.vy = -Math.abs(b.vy) * 0.5;
      }
    });

    // 4. Strict collision resolution (3 iterations to prevent overlays entirely)
    for (let step = 0; step < 3; step++) {
      for (let i = 0; i < this.bubbles.length; i++) {
        for (let j = i + 1; j < this.bubbles.length; j++) {
          const b1 = this.bubbles[i];
          const b2 = this.bubbles[j];
          
          const dx = b2.x - b1.x;
          const dy = b2.y - b1.y;
          const dist = Math.hypot(dx, dy);
          const minDist = b1.radius + b2.radius + 15; // 15px safe spacing gap
          
          if (dist < minDist) {
            const nx = dx / dist;
            const ny = dy / dist;
            
            const overlap = minDist - dist;
            b1.x -= nx * overlap * 0.5;
            b1.y -= ny * overlap * 0.5;
            b2.x += nx * overlap * 0.5;
            b2.y += ny * overlap * 0.5;
            
            const kx = b1.vx - b2.vx;
            const ky = b1.vy - b2.vy;
            const vn = kx * nx + ky * ny;
            
            if (vn > 0) {
              const impulse = (2 * vn) / (b1.mass + b2.mass);
              b1.vx -= impulse * b2.mass * nx * 0.8;
              b1.vy -= impulse * b2.mass * ny * 0.8;
              b2.vx += impulse * b1.mass * nx * 0.8;
              b2.vy += impulse * b1.mass * ny * 0.8;
            }
          }
        }
      }
    }

    // 5. Render to DOM (Subtract scrollY to offset elements inside container)
    this.bubbles.forEach(b => {
      b.element.style.left = `${b.x - b.radius}px`;
      b.element.style.top = `${b.y - b.radius - this.scrollY}px`;
      b.element.style.width = `${b.radius * 2}px`;
      b.element.style.height = `${b.radius * 2}px`;
    });
  }

  // Zoom clicked bubble to cover screen
  zoomIntoBubble(clickedBubble, callback) {
    this.stop();
    
    const scrollTop = this.scrollY;
    const cy = this.containerHeight / 2;
    const cx = this.width / 2;
    
    this.bubbles.forEach(b => {
      if (b === clickedBubble) {
        b.element.style.zIndex = "100";
        b.element.style.transition = "all 0.9s cubic-bezier(0.25, 1, 0.5, 1)";
        
        const viewportDiag = Math.hypot(window.innerWidth, window.innerHeight);
        const scale = (viewportDiag / b.radius) * 1.1;
        
        b.element.style.left = `${cx - b.radius}px`;
        b.element.style.top = `${cy - b.radius}px`;
        b.element.style.transform = `scale(${scale})`;
        
        const label = b.element.querySelector(".bubble-label");
        const mapSvg = b.element.querySelector(".country-map-svg");
        if (label) {
          label.style.transition = "opacity 0.3s ease";
          label.style.opacity = "0";
        }
        if (mapSvg) {
          mapSvg.style.transition = "opacity 0.4s ease";
          mapSvg.style.opacity = "0";
        }
      } else {
        const dx = b.x - clickedBubble.x;
        const dy = b.y - clickedBubble.y;
        const angle = Math.atan2(dy, dx);
        const flyDist = Math.max(window.innerWidth, window.innerHeight) * 0.8;
        
        b.element.style.transition = "all 0.7s cubic-bezier(0.25, 1, 0.5, 1)";
        b.element.style.left = `${b.x + Math.cos(angle) * flyDist - b.radius}px`;
        b.element.style.top = `${b.y - scrollTop + Math.sin(angle) * flyDist - b.radius}px`;
        b.element.style.opacity = "0";
        b.element.style.transform = "scale(0.3)";
      }
    });
    
    setTimeout(callback, 850);
  }
}
