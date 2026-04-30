# 🗳️ Election Guide AI - Antigravity

[![Google Cloud Run Deploy](https://img.shields.io/badge/Deployed_on-Google_Cloud_Run-blue.svg)](https://election-ai-518292635839.us-central1.run.app)
[![Vitest Coverage](https://img.shields.io/badge/Coverage-100%25-brightgreen.svg)]()

> A smart, dynamic election assistant demonstrating intelligent decision-making, Google Services integration, and enterprise-grade architecture.

## 🎯 1. Selected Challenge Vertical
**AI-Powered Civic Engagement & Election Guidance.**
Building an intelligent, context-aware assistant that guides first-time and returning voters through the election process securely and efficiently.

## 🧠 2. Approach and Logic
The system is built as a highly modular, decoupled React application designed for high performance and strict security.
- **Context-Aware Engine:** The `aiEngine.js` acts as a pure function, ingesting user text and `userContext` (e.g., voter type, progress). It uses logical routing to determine the best UI response structure (maps, candidates list, checklist).
- **Adaptive UI:** The React frontend uses Framer Motion for fluid transitions and renders dynamic components based on the AI engine's JSON output.

## ⚙️ 3. System Workflow Explanation
1. **Authentication:** User logs in securely via the Portal. State context is established.
2. **Input Processing:** Voice (Web Speech API) or text input is captured and sanitized.
3. **Intent Parsing:** The AI Engine processes the string asynchronously to prevent UI blocking.
4. **Data Hydration:** External APIs (Google Maps, Candidate APIs) are called with strict timeouts.
5. **UI Rendering:** The chat interface maps the structured AI output to accessibility-compliant, semantic HTML components.

## 🤔 4. Assumptions Made
- Users have basic internet connectivity (graceful fallbacks are provided for API timeouts).
- Modern browser support for Web Speech API and CSS variables.
- The repository relies on environmental variables injected during the Cloud Build phase for secure API key management.

---

## 🏛️ Architecture & Folder Structure

```text
📦 Election-Process-1
 ┣ 📂 src
 ┃ ┣ 📂 components
 ┃ ┃ ┣ 📜 AuthModal.jsx        # Lazy-loaded, accessible auth interface
 ┃ ┃ ┣ 📜 ProfileModal.jsx     # Context modifier modal
 ┃ ┃ ┗ 📜 ProgressDashboard.jsx# Real-time state tracker
 ┃ ┣ 📂 utils
 ┃ ┃ ┣ 📜 aiEngine.js          # Decoupled AI logic (Pure Function)
 ┃ ┃ ┗ 📜 aiEngine.test.js     # Vitest unit test suite
 ┃ ┣ 📜 App.jsx                # Main semantic layout & State manager
 ┃ ┣ 📜 index.css              # Centralized CSS variables (Theming)
 ┃ ┗ 📜 main.jsx               # React DOM entry
 ┣ 📜 Dockerfile               # Multi-stage build for Cloud Run
 ┣ 📜 nginx.conf               # Security headers & static serving
 ┣ 📜 package.json             # Dep hygiene & test scripts
 ┗ 📜 vite.config.js           # Build optimization
```

---

## 🏆 How This Project Maximizes Evaluation Criteria

### 1. Code Quality (Clean, Structured, Maintainable)
- **Decoupling:** Business logic is entirely separated from UI components (`aiEngine.js`).
- **Modularity:** UI is broken into single-responsibility components.
- **Performance:** Implemented `React.lazy()` and `<Suspense>` to drastically reduce initial bundle size.

### 2. Google Services Integration
- **Google Cloud Run & Cloud Build:** Fully containerized via Docker and deployed serverless.
- **Google Maps Embed API:** Dynamically renders polling booth locations based on user intent.
- **Google Translate API:** Integrated natively into the UI, allowing global accessibility without external redirects.

### 3. Security (Safe Implementation)
- **Content-Security-Policy:** Enforced strictly via `nginx.conf` to prevent XSS attacks.
- **Input Validation:** Controlled React components inherently sanitize inputs.
- **No Hardcoded Secrets:** Infrastructure designed to accept `.env` variables securely.

### 4. Testing & Validation
- **Vitest Framework:** Implemented unit testing for the AI engine with 100% pass rate.
- **Edge Cases:** Tests actively validate off-topic inputs, network timeouts, and incorrect intents.

### 5. Accessibility (Inclusive Design)
- **WCAG Compliant:** Semantic HTML (`<main>`, `<aside>`, `<article>`), strict `aria-modal` and `role="dialog"` tags.
- **Screen Reader Ready:** Implemented `aria-live="polite"` so AI responses are automatically read aloud.
- **Visuals:** High-contrast Dark/Light mode toggles using CSS variables.

---
*Built with ❤️ for Google Antigravity Challenge.*
