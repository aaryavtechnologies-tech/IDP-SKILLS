# IDP — Video-First Modern Landing Page

A high-converting, mobile-first, video-based website designed for **IDP (I Digital Preneur Pvt Ltd)** and certified mentor **Gulshad Ahmad**.

Built with semantic HTML5, modern CSS3, and vanilla JavaScript (zero heavy framework bloat) with deep black & vibrant orange branding, intelligent YouTube autoplay, and seamless WhatsApp consultation booking.

---

## 🌟 Key Features

- **Brand Design System:** Deep Black (`#080808`), Dark Charcoal (`#151515`), and Vibrant Orange (`#FF632E` / `#FF8A45`) accents with ambient glows and glassmorphism.
- **Hero Presentation:** Glowing headline, animated *"Watch My Story"* badge, value proposition, and dual CTA buttons.
- **Featured 16:9 Video:** Embedded YouTube story player with ambient orange glow bezel, accessible sound toggle, and responsive aspect ratio.
- **"Real People. Real Results." Shorts Carousel:** Responsive 9:16 vertical video cards (3 on desktop, 2 on tablet, 1 + peek on mobile) with intelligent single-video autoplay, touch swipe snapping, and dot navigation.
- **Verified Business Impact Strip:** Real metrics with smooth count-up animations (*₹100Cr+*, *1,000+*, *₹6L+*, *4.9★*).
- **The 3-Step IDP Blueprint:** Clear 3-module curriculum breakdown explaining the verified affiliate system.
- **Mentor Spotlight:** Official profile card for Gulshad Ahmad with verified credentials, social follower counts, and direct contact options.
- **Interactive FAQ Accordion:** Clean animated accordion addressing common beginner questions.
- **Native Consultation Dialog (`<dialog>`):** Compliant with modern web standards, featuring light dismiss, Escape key dismiss, and pre-formatted WhatsApp consultation dispatch to `+919005747128`.
- **Floating WhatsApp Button & Sticky Mobile CTA:** Mobile-safe bottom-right WhatsApp button and safe-area aware sticky consultation pill.

---

## 📁 Repository Structure

```
├── index.html                 # Main landing page markup & SEO metadata
├── css/
│   └── style.css              # Custom responsive stylesheet & animations
├── js/
│   ├── main.js                # Header scroll, count-ups, FAQ accordion, modal dialog
│   └── video-players.js       # YouTube IFrame API controller & visibility autoplay
├── assets/
│   └── gulshad-profile.png    # Official mentor portrait
├── server.js                  # Lightweight zero-dependency local preview server
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start (Local Development)

### Option 1: Open Directly
Double-click `index.html` to open it in any modern web browser.

### Option 2: Run with Node.js
```bash
node server.js
```
Then visit [http://localhost:3000/](http://localhost:3000/) in your browser.

---

## 🛠️ Configuration & Customization

- **Change WhatsApp Number or Pre-filled Message:**  
  Update `mentorPhone` and `textMessage` in [`js/main.js`](js/main.js) and the `href` in [`index.html`](index.html).
- **Update YouTube Videos:**  
  Change `MAIN_VIDEO_ID` and `SHORTS_CONFIG` in [`js/video-players.js`](js/video-players.js).
- **Customize Brand Colors:**  
  Adjust the CSS variables in the `:root` block of [`css/style.css`](css/style.css).

---

## 📄 License & Attribution

Designed and developed for **IDP (I Digital Preneur Pvt Ltd)**. All rights reserved.
