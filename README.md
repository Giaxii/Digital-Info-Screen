# THI GoGlobal - Digital Info Screen Mockups

This repository contains two interactive frontend design variants for the **Digital Info Screen** at **Technische Hochschule Ingolstadt (THI)**. The interface is designed to help students plan their semester abroad by exploring partner universities, checking deadlines, course overviews, and student testimonials.

---

## 🚀 How to Enable GitHub Pages & View the Live Site

To share this project so that anyone can view and interact with the screens directly in their web browser, you can host it for free using **GitHub Pages**. 

Follow these simple steps:

1. **Go to Settings**:
   * Open this repository on GitHub: [https://github.com/Giaxii/Digital-Info-Screen](https://github.com/Giaxii/Digital-Info-Screen)
   * Click on the **Settings** (gear icon) tab at the top right of the repository menu.

2. **Navigate to Pages**:
   * On the left sidebar menu, look under the **Code and automation** section and click on **Pages**.

3. **Configure Build and Deployment**:
   * Under **Build and deployment** -> **Source**, make sure **Deploy from a branch** is selected.
   * Under **Branch**, click the dropdown menu (currently showing *None*) and select **`main`**.
   * Leave the directory folder as **`/(root)`**.
   * Click the **Save** button.

4. **Access the Live URL**:
   * Wait about **1 minute** for GitHub to compile and publish the site.
   * Refresh the Pages settings tab, and you will see your live URL at the top:
     👉 **`https://giaxii.github.io/Digital-Info-Screen/`**
   * Share this link with classmates, professors, or anyone who wants to view the demo!

---

## 🎨 Available Design Variants

When visiting the live link, you will see a landing page that lets you choose between two design styles:

### 1. Version 1: Cyan Glow (Original Design)
* **Location**: `/kiosk-infotafel/index.html`
* **Theme**: Glassmorphism with deep dark gradients and glowing cyan highlights.
* **Layout**: Clean card overlays with soft drop-shadows and fluid animations.

### 2. Version 2: Swiss Minimalist (Modern High-Contrast)
* **Location**: `/kiosk-infotafel-v2/index.html`
* **Theme**: Flat design with bold solid black borders, pure white background cards, and royal digital blue highlights.
* **Layout**: High-readability Swiss typography layouts optimized for public info-panels.

---

## 💻 How to Run Locally

If you want to run the project on your local machine:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Giaxii/Digital-Info-Screen.git
   cd Digital-Info-Screen
   ```

2. **Start a local web server** (e.g., using Python):
   ```bash
   # Run from the root directory to access both versions
   python3 -m http.server 8000
   ```

3. **Open in browser**:
   * Visit `http://localhost:8000/` to see the landing page and navigate between both versions.
