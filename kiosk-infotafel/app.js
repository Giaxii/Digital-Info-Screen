// Kiosk Application Controller

document.addEventListener("DOMContentLoaded", () => {
  // Application State
  const state = {
    currentView: "home", // "home", "detail", "companion", "uniDetail"
    activeContinent: "africa", // Default continent
    previousContinent: "africa", // Track previous continent for Australia bypass
    activeCountry: null,
    activeUniversity: null, // Track active university details screen
    testimonialCarouselIndex: 0, // Track student portrait slide
    carouselIndices: {}, // Tracks active slide index for each university carousel
    inStandby: false // Tracks if screen is currently playing standby loop ad
  };

  // Dynamically update sync QR Code images (on bezel and inside modal)
  function updateQRCode(countryId = null, uniName = null) {
    let baseUrl = "https://www.lukolb.de";
    if (countryId) {
      baseUrl += `/?country=${countryId}`;
      if (uniName) {
        baseUrl += `&uni=${encodeURIComponent(uniName)}`;
      }
    }
    
    // Generate QR using API (140px size matches CSS container width)
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(baseUrl)}`;
    
    const bottomQrImg = document.getElementById("bottomQrImg");
    const modalQrImg = document.getElementById("modalQrImg");
    
    if (bottomQrImg) {
      bottomQrImg.src = qrApiUrl;
    }
    if (modalQrImg) {
      modalQrImg.src = qrApiUrl;
    }
  }

  // DOM Elements
  const homeView = document.getElementById("homeView");
  const detailView = document.getElementById("detailView");
  const uniDetailView = document.getElementById("uniDetailView"); // New specific view
  const bubblesCanvas = document.getElementById("bubblesCanvas");
  
  // Scroll containers
  const detailScrollContainer = document.getElementById("detailScrollContainer");
  const uniDetailScrollContainer = document.getElementById("uniDetailScrollContainer");
  const tabsContainer = document.querySelector(".tabs-container");
  
  // Navigation elements
  const tabPills = document.querySelectorAll(".tab-pill");
  const backBtn = document.getElementById("backBtn");
  const uniBackBtn = document.getElementById("uniBackBtn"); // New back btn
  
  // Detail content elements
  const detailCountryBubble = document.getElementById("detailCountryBubble");
  const detailCountryName = document.getElementById("detailCountryName");
  const detailCountryFlag = document.getElementById("detailCountryFlag");
  const detailCountryDesc = document.getElementById("detailCountryDesc");
  const uniListContainer = document.getElementById("uniListContainer");
  
  // QR & Modal elements
  const qrCodeBox = document.getElementById("qrCodeBox");
  const qrModal = document.getElementById("qrModal");
  const qrModalClose = document.getElementById("qrModalClose");
  const btnScanQrSim = document.getElementById("btnScanQrSim");
  
  // University Specific view elements
  const uniHeroImg = document.getElementById("uniHeroImg");
  const uniNamePill = document.getElementById("uniNamePill");
  const uniTestimonialImg = document.getElementById("uniTestimonialImg");
  const uniTestimonialQuote = document.getElementById("uniTestimonialQuote");
  const uniTestimonialAuthor = document.getElementById("uniTestimonialAuthor");
  const uniCourseList = document.getElementById("uniCourseList");
  const uniDatesList = document.getElementById("uniDatesList");
  const btnTestimonialPrev = document.getElementById("btnTestimonialPrev");
  const btnTestimonialNext = document.getElementById("btnTestimonialNext");
  
  // Companion app elements
  const companionSimulator = document.getElementById("companionSimulator");
  const companionClose = document.getElementById("companionClose");
  const compSavedList = document.getElementById("compSavedList");
  
  // Standby overlay elements
  const btnPlayAd1 = document.getElementById("btnPlayAd1");
  const btnPlayAd2 = document.getElementById("btnPlayAd2");
  const standbyOverlay = document.getElementById("standbyOverlay");
  const standbyVideo = document.getElementById("standbyVideo");
  


  // Physics Simulation Instance
  let simulation = null;

  // Initialize Physics Simulation
  function initSimulation() {
    if (!simulation) {
      simulation = new BubbleSimulation(bubblesCanvas, onBubbleSelected);
    }
    loadContinentBubbles(state.activeContinent);
  }

  // Load countries for a selected continent
  function loadContinentBubbles(continentKey) {
    state.activeContinent = continentKey;
    
    // Update active tab UI styling
    tabPills.forEach(pill => {
      if (pill.dataset.continent === continentKey) {
        pill.classList.add("active");
      } else {
        pill.classList.remove("active");
      }
    });



    // Get countries list
    const countries = countryData[continentKey] || [];
    
    // Load into simulation
    if (simulation) {
      simulation.setCountries(countries);
    }
  }

  // Click handler when a bubble is clicked
  function onBubbleSelected(bubblePhysicsObj) {
    const country = bubblePhysicsObj.country;
    state.activeCountry = country;
    
    // 1. Play physics zoom animation
    simulation.zoomIntoBubble(bubblePhysicsObj, () => {
      // 2. Show Detail Screen or go direct to Uni if only 1 school
      if (country.universities && country.universities.length === 1) {
        state.activeUniversity = country.universities[0];
        navigateToView("uniDetail");
      } else {
        navigateToView("detail");
      }
    });
  }

  // Handle view navigation transitions
  function navigateToView(viewName) {
    state.currentView = viewName;
    
    if (viewName === "home") {
      // Setup transition classes
      detailView.classList.remove("active");
      detailView.classList.add("slide-right");
      
      uniDetailView.classList.remove("active");
      uniDetailView.classList.add("slide-right");
      
      homeView.classList.add("active");
      homeView.classList.remove("slide-left");
      
      // Re-initialize physics after slider completes
      setTimeout(() => {
        initSimulation();
      }, 300);
      
      updateQRCode(); // Reset QR Code to Home URL on home navigation
      
    } else if (viewName === "detail") {
      homeView.classList.remove("active");
      homeView.classList.add("slide-left");
      
      uniDetailView.classList.remove("active");
      uniDetailView.classList.add("slide-right");
      
      detailView.classList.remove("slide-right");
      detailView.classList.remove("slide-left");
      detailView.classList.add("active");
      
      if (detailScrollContainer) {
        detailScrollContainer.scrollTop = 0;
      }
      renderCountryDetails(state.activeCountry);
      
    } else if (viewName === "uniDetail") {
      homeView.classList.remove("active");
      homeView.classList.add("slide-left");
      
      detailView.classList.remove("active");
      detailView.classList.add("slide-left");
      
      uniDetailView.classList.remove("slide-right");
      uniDetailView.classList.add("active");
      
      if (uniDetailScrollContainer) {
        uniDetailScrollContainer.scrollTop = 0;
      }
      renderUniversitySpecificDetails(state.activeUniversity);
    }
  }

  // Populate Country Detail view elements
  function renderCountryDetails(country) {
    if (!country) return;
    
    updateQRCode(country.id); // Set QR Code to Country view URL
    
    // Render country top header circle
    detailCountryBubble.innerHTML = `
      <svg class="detail-country-svg">
        <path d="${country.svgPath}" fill="none" stroke="rgba(255, 255, 255, 0.95)" stroke-width="1.2" vector-effect="non-scaling-stroke" stroke-linejoin="round" />
      </svg>
      <div class="label">${country.name}</div>
    `;
    
    // Dynamically adjust SVG viewBox using getBBox to fit real path
    let retries = 0;
    const adjustDetailViewBox = () => {
      const svg = detailCountryBubble.querySelector(".detail-country-svg");
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
            return;
          }
        } catch (e) {}
      }
      if (retries < 30) {
        retries++;
        requestAnimationFrame(adjustDetailViewBox);
      } else if (svg) {
        svg.setAttribute("viewBox", "0 0 100 100");
      }
    };
    requestAnimationFrame(adjustDetailViewBox);
    
    // Title, Flag
    detailCountryName.textContent = country.name;
    detailCountryFlag.textContent = country.flag;
    
    // Descriptions paragraphs
    detailCountryDesc.innerHTML = country.description
      .map(p => `<p class="country-desc">${p}</p>`)
      .join("");
      
    // Render University cards
    uniListContainer.innerHTML = "";
    state.carouselIndices = {}; // Reset indices
    
    // Erasmus+ Info Note for Europe (from user request!)
    if (state.activeContinent === "europe") {
      const infoBanner = document.createElement("div");
      infoBanner.className = "erasmus-info-banner";
      infoBanner.innerHTML = `
        <div class="erasmus-banner-inner">
          <svg viewBox="0 0 24 24" class="info-icon" style="width:20px; height:20px; fill:#50e3c2; flex-shrink:0; margin-top:2px;"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
          <p style="font-size: 11px; line-height: 1.5; margin: 0; color: rgba(255,255,255,0.9);">
            <strong>Erasmus+ Note:</strong> Partner universities in Europe fall under the Erasmus+ program and your study stay is usually funded. An exception to this is <strong>Griffith College Dublin</strong>.
          </p>
        </div>
      `;
      uniListContainer.appendChild(infoBanner);
    }
    
    country.universities.forEach((uni, index) => {
      const uniId = `uni-${index}`;
      state.carouselIndices[uniId] = 0; // Set first image active
      
      // Construct slides
      const imageSlidesHTML = uni.images.map((imgUrl, imgIndex) => `
        <img class="carousel-slide-img ${imgIndex === 0 ? 'active' : ''}" 
             src="${imgUrl}" 
             alt="${uni.name} campus" 
             loading="lazy" />
      `).join("");
      
      // Determine carousel navigation buttons visibility
      const hasMultipleImages = uni.images.length > 1;
      const carouselBtnsHTML = hasMultipleImages ? `
        <div class="carousel-btn prev" data-uni-id="${uniId}">
          <svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
        </div>
        <div class="carousel-btn next" data-uni-id="${uniId}">
          <svg viewBox="0 0 24 24"><path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/></svg>
        </div>
      ` : "";

      // Assemble card elements
      const cardEl = document.createElement("div");
      cardEl.className = "uni-card";
      cardEl.innerHTML = `
        <h3 class="uni-card-title">${uni.name}</h3>
        <div class="uni-card-body">
          <div class="uni-image-carousel" id="carousel-${uniId}">
            ${imageSlidesHTML}
            ${carouselBtnsHTML}
          </div>
          <div class="uni-info-block">
            <div class="uni-meta-row">
              <span class="uni-meta-item">
                <svg viewBox="0 0 24 24" width="12" height="12"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                ${uni.location}
              </span>
              <span class="uni-meta-item">
                <svg viewBox="0 0 24 24" width="12" height="12"><path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zm0 10.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                ≈ ${uni.students}
              </span>
            </div>
            <p class="uni-card-desc">${uni.description}</p>
            <button class="uni-more-btn" data-uni-index="${index}">More Infos</button>
          </div>
        </div>
      `;
      
      uniListContainer.appendChild(cardEl);
    });

    // Add carousel controls click listeners
    const carouselBtns = uniListContainer.querySelectorAll(".carousel-btn");
    carouselBtns.forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const uniId = btn.dataset.uniId;
        const isNext = btn.classList.contains("next");
        shiftCarousel(uniId, isNext);
      });
    });

    // Add "More Infos" details triggers
    const moreBtns = uniListContainer.querySelectorAll(".uni-more-btn");
    moreBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const uniIndex = parseInt(btn.dataset.uniIndex);
        const uniObj = country.universities[uniIndex];
        state.activeUniversity = uniObj;
        navigateToView("uniDetail");
      });
    });
  }

  // Shift carousel images index
  function shiftCarousel(uniId, isNext) {
    const totalImages = state.activeCountry.universities[parseInt(uniId.split("-")[1])].images.length;
    let index = state.carouselIndices[uniId];
    
    if (isNext) {
      index = (index + 1) % totalImages;
    } else {
      index = (index - 1 + totalImages) % totalImages;
    }
    
    state.carouselIndices[uniId] = index;
    
    // Update active slide class in DOM
    const carousel = document.getElementById(`carousel-${uniId}`);
    const slides = carousel.querySelectorAll(".carousel-slide-img");
    slides.forEach((slide, sIdx) => {
      if (sIdx === index) {
        slide.classList.add("active");
      } else {
        slide.classList.remove("active");
      }
    });
  }

  // Populate University Specific details view
  function renderUniversitySpecificDetails(uni) {
    if (!uni) return;
    
    // Set active university & reset carousel
    state.activeUniversity = uni;
    state.testimonialCarouselIndex = 0;
    
    // Update Bezel QR Code to University URL
    if (state.activeCountry) {
      updateQRCode(state.activeCountry.id, uni.name);
    }
    
    // Top campus image
    uniHeroImg.src = uni.images[0] || "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=600&h=400&q=80";
    uniHeroImg.alt = `${uni.name} campus`;
    
    // University Name Capsule
    uniNamePill.textContent = `${uni.name}, ${uni.location}`;
    
    // Student Testimonial photo
    if (uni.testimonialPhotos && uni.testimonialPhotos.length > 0) {
      uniTestimonialImg.src = uni.testimonialPhotos[0];
    } else {
      uniTestimonialImg.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&h=600&q=80";
    }
    uniTestimonialImg.alt = `Student at ${uni.name}`;
    
    // Testimonial quote overlay
    if (uni.testimonial) {
      uniTestimonialQuote.textContent = `"${uni.testimonial.quote}"`;
      uniTestimonialAuthor.textContent = `- ${uni.testimonial.author}`;
    } else {
      uniTestimonialQuote.textContent = `"Choosing this university was the best decision of my study life!"`;
      uniTestimonialAuthor.textContent = "- Sarah (Exchange Student)";
    }
    
    // Course Overview list
    uniCourseList.innerHTML = "";
    const courses = uni.courses || ["UX Design Foundation", "Visual Branding", "Motion Graphics", "Human-Computer Interaction", "Interactive Prototyping"];
    courses.forEach(course => {
      const li = document.createElement("li");
      li.textContent = course;
      uniCourseList.appendChild(li);
    });
    
    // Semester Dates list
    uniDatesList.innerHTML = "";
    const dates = uni.dates || { deadline: "May 15", start: "October 1", orientation: "September 25" };
    
    const deadlineEl = document.createElement("div");
    deadlineEl.className = "uni-date-item";
    deadlineEl.innerHTML = `
      <span class="uni-date-label">Application Deadline</span>
      <span class="uni-date-val">${dates.deadline}</span>
    `;
    
    const startEl = document.createElement("div");
    startEl.className = "uni-date-item";
    startEl.innerHTML = `
      <span class="uni-date-label">Semester Start</span>
      <span class="uni-date-val">${dates.start}</span>
    `;
    
    const orientEl = document.createElement("div");
    orientEl.className = "uni-date-item";
    orientEl.innerHTML = `
      <span class="uni-date-label">Orientation Week</span>
      <span class="uni-date-val">${dates.orientation}</span>
    `;
    
    uniDatesList.appendChild(deadlineEl);
    uniDatesList.appendChild(startEl);
    uniDatesList.appendChild(orientEl);
  }

  // Shift testimonial portrait photo carousel
  function shiftTestimonialCarousel(isNext) {
    if (!state.activeUniversity || !state.activeUniversity.testimonialPhotos) return;
    const photos = state.activeUniversity.testimonialPhotos;
    if (photos.length === 0) return;
    
    let idx = state.testimonialCarouselIndex;
    if (isNext) {
      idx = (idx + 1) % photos.length;
    } else {
      idx = (idx - 1 + photos.length) % photos.length;
    }
    
    state.testimonialCarouselIndex = idx;
    uniTestimonialImg.src = photos[idx];
  }

  // Event Listeners setup
  
  // Continent Navigation Tabs
  tabPills.forEach(pill => {
    pill.addEventListener("click", () => {
      if (tabsContainer && tabsContainer.classList.contains("prevent-click")) {
        return; // Skip click if we were dragging
      }
      const continent = pill.dataset.continent;
      if (continent && continent !== state.activeContinent) {
        if (continent === "australia") {
          // Special case: Direct jump to Australia details page
          state.previousContinent = state.activeContinent !== "australia" ? state.activeContinent : (state.previousContinent || "africa");
          state.activeContinent = "australia";
          
          const australiaCountry = countryData["australia"][0];
          state.activeCountry = australiaCountry;
          
          // Update active tab UI styling
          tabPills.forEach(p => {
            p.classList.toggle("active", p.dataset.continent === "australia");
          });
          
          // Go directly to detail screen
          navigateToView("detail");
        } else {
          state.previousContinent = continent;
          loadContinentBubbles(continent);
        }
      }
    });
  });

  // Drag-to-swipe mouse gestures for the continent tabs container (desktop companion testing)
  if (tabsContainer) {
    let isDown = false;
    let startX;
    let scrollLeft;
    let hasMoved = false;

    tabsContainer.addEventListener("mousedown", (e) => {
      isDown = true;
      hasMoved = false;
      tabsContainer.classList.add("dragging");
      startX = e.pageX - tabsContainer.offsetLeft;
      scrollLeft = tabsContainer.scrollLeft;
      tabsContainer.style.scrollBehavior = "auto";
    });

    tabsContainer.addEventListener("mouseleave", () => {
      isDown = false;
      tabsContainer.classList.remove("dragging");
      tabsContainer.style.scrollBehavior = "smooth";
    });

    tabsContainer.addEventListener("mouseup", () => {
      isDown = false;
      tabsContainer.classList.remove("dragging");
      tabsContainer.style.scrollBehavior = "smooth";
      if (hasMoved) {
        tabsContainer.classList.add("prevent-click");
        setTimeout(() => {
          tabsContainer.classList.remove("prevent-click");
        }, 50);
      }
    });

    tabsContainer.addEventListener("mousemove", (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - tabsContainer.offsetLeft;
      const walk = (x - startX) * 1.5;
      if (Math.abs(x - startX) > 5) {
        hasMoved = true;
      }
      tabsContainer.scrollLeft = scrollLeft - walk;
    });
  }

  // Back button on details page
  backBtn.addEventListener("click", () => {
    if (state.activeContinent === "australia") {
      // Go back to the previously active continent on the home view
      const targetContinent = state.previousContinent || "africa";
      state.activeContinent = targetContinent;
      // Re-apply tab button active state
      tabPills.forEach(pill => {
        pill.classList.toggle("active", pill.dataset.continent === targetContinent);
      });
    }
    navigateToView("home");
  });

  // QR Code click opens modal
  qrCodeBox.addEventListener("click", () => {
    qrModal.classList.add("active");
  });

  qrModalClose.addEventListener("click", () => {
    qrModal.classList.remove("active");
  });

  // Click outside to close QR modal
  qrModal.addEventListener("click", (e) => {
    if (e.target === qrModal) {
      qrModal.classList.remove("active");
    }
  });

  // Back button on university details screen
  uniBackBtn.addEventListener("click", () => {
    if (state.activeCountry && state.activeCountry.universities && state.activeCountry.universities.length === 1) {
      navigateToView("home");
    } else {
      navigateToView("detail");
    }
  });

  // Testimonial image carousel buttons
  btnTestimonialPrev.addEventListener("click", () => {
    shiftTestimonialCarousel(false);
  });
  btnTestimonialNext.addEventListener("click", () => {
    shiftTestimonialCarousel(true);
  });

  // Simulated Mobile Companion App logic
  btnScanQrSim.addEventListener("click", () => {
    qrModal.classList.remove("active");
    openCompanionAppSimulator();
  });

  function openCompanionAppSimulator() {
    companionSimulator.classList.add("active");
    renderCompanionList();
  }

  function closeCompanionAppSimulator() {
    companionSimulator.classList.remove("active");
  }

  companionClose.addEventListener("click", closeCompanionAppSimulator);

  function renderCompanionList() {
    // Show checklist items
    compSavedList.innerHTML = `
      <div class="comp-card">
        <h4>📲 Your Mobile Semester Planner</h4>
        <p>Synchronization successful! Follow these steps on your smartphone to organize your semester abroad:</p>
        <div style="margin-top: 15px;">
          <div class="comp-checklist-item">
            <span class="comp-check checked"></span>
            <span>Scan installation QR code</span>
          </div>
          <div class="comp-checklist-item">
            <span class="comp-check checked"></span>
            <span>Select continent: ${continentMapping[state.activeContinent] || state.activeContinent}</span>
          </div>
          <div class="comp-checklist-item">
            <span class="comp-check" id="chk-country"></span>
            <span>Check partner universities in <strong>${state.activeCountry ? state.activeCountry.name : 'South Africa'}</strong></span>
          </div>
          <div class="comp-checklist-item">
            <span class="comp-check"></span>
            <span>Enter status of English B2 certificate</span>
          </div>
          <div class="comp-checklist-item">
            <span class="comp-check"></span>
            <span>Submit Learning Agreement to the International Office</span>
          </div>
        </div>
      </div>
      <div class="comp-card">
        <h4>🏫 Bookmarked Partner Universities</h4>
        <p style="font-size:10.5px;">These universities are bookmarked on your smartphone:</p>
        <ul style="font-size: 11px; margin-top: 8px; padding-left: 15px; line-height: 1.6;">
          ${state.activeCountry ? 
            state.activeCountry.universities.map(u => `<li>${u.name} (${u.location})</li>`).join("") :
            `<li>Stellenbosch University (Stellenbosch)</li><li>Cape Peninsula University of Tech</li>`
          }
        </ul>
      </div>
    `;

    // Make checks clickable for interaction feedback
    const checks = compSavedList.querySelectorAll(".comp-check");
    checks.forEach(check => {
      check.addEventListener("click", () => {
        check.classList.toggle("checked");
      });
    });
  }



  // Standby / Ad Mode Implementation
  let inactivityTimer = null;
  const INACTIVITY_TIMEOUT_MS = 45000; // 45 seconds of inactivity
  
  function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    if (!state.inStandby) {
      inactivityTimer = setTimeout(triggerAutoStandby, INACTIVITY_TIMEOUT_MS);
    }
  }

  function triggerAutoStandby() {
    // Choose randomly between video 1 and video 2 for automatic standby
    const randomAd = Math.random() < 0.5 ? 1 : 2;
    enterStandby(randomAd);
  }

  function enterStandby(videoIndex) {
    state.inStandby = true;
    clearTimeout(inactivityTimer);
    
    // Stop physics simulation during standby loop to conserve resource usage
    if (simulation) {
      simulation.stop();
    }
    
    // Load and play selected ad video
    const videoSrc = `VID_AD_${videoIndex}.mp4`;
    standbyVideo.src = videoSrc;
    standbyVideo.load();
    
    standbyOverlay.classList.add("active");
    
    // Attempt unmuted playback first
    standbyVideo.muted = false;
    standbyVideo.play().catch(err => {
      console.warn("Autoplay with audio blocked, falling back to muted playback:", err);
      standbyVideo.muted = true;
      standbyVideo.play().catch(mutedErr => {
        console.error("Muted autoplay also failed:", mutedErr);
      });
    });
  }

  function exitStandby() {
    if (!state.inStandby) return;
    state.inStandby = false;
    
    // Pause video player and clean up sources
    standbyVideo.pause();
    standbyVideo.src = "";
    
    standbyOverlay.classList.remove("active");
    
    // Resume physics simulation loops
    if (state.currentView === "home" && simulation) {
      simulation.start();
    }
    
    // Reset inactivity countdown
    resetInactivityTimer();
  }

  // 1. Control Panel Button listeners to manually test specific videos
  if (btnPlayAd1) {
    btnPlayAd1.addEventListener("click", () => enterStandby(1));
  }
  if (btnPlayAd2) {
    btnPlayAd2.addEventListener("click", () => enterStandby(2));
  }

  // 2. Click standby overlay anywhere to wake up the kiosk screen
  standbyOverlay.addEventListener("pointerdown", (e) => {
    e.stopPropagation();
    exitStandby();
  });

  // 3. Monitor touches on screen display window to reset the idle timer
  const kioskScreen = document.querySelector(".kiosk-screen");
  kioskScreen.addEventListener("pointerdown", () => {
    resetInactivityTimer();
  }, true); // Use capturing phase to intercept before subviews block bubble events

  // Start the inactivity timer on initial load
  state.inStandby = false;
  resetInactivityTimer();

  // Start Application
  initSimulation();
  updateQRCode(); // Set initial QR Code to home URL
});
