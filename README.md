# 📚 StudyVault | Academic & Olympiad Archive

Live Web Portal: **[https://niranx-music.github.io/study-material-portal/](https://niranx-music.github.io/study-material-portal/)**

An interactive, high-performance web portal indexing and cataloging **4,753 study material files (~39.7 GB)** spanning JEE Advanced, JEE Main, NEET, National & International Olympiads (IOQM, INMO, IMO, IPhO, INPhO, USAPhO, ASOE, CPhO), and classic academic literature.

---

## 🌟 Key Features

- **⚡ Instant Fuzzy Search**: Search across 4,753 study materials in milliseconds by file name, topic, coaching institute, or exam level.
- **🎯 Multi-Faceted Filtering**: Filter by Subject (Mathematics, Physics, Chemistry, Astronomy), Coaching Source (Allen, Cengage, Vedantu, PW), Exam Type, and Document Type.
- **⭐ Study Progress Tracker**: Built-in checklist to mark materials as "Completed", "In Progress", or "Starred" (persisted across sessions via browser LocalStorage).
- **📋 1-Click Local Path Copy**: Copy Windows local paths (`C:\Users\niran\Downloads\...`) or `file:///` URIs directly to the clipboard for immediate local opening.
- **☁️ Cloud Sync Integration**: Configure a cloud base URL (Google Drive, OneDrive, Mega) to enable one-click online downloads for any synced item.
- **🌓 Dark & Light Mode**: Modern UI built with Tailwind CSS, Lucide icons, and responsive layouts.

---

## 📁 Repository Contents

```
study-material-portal/
├── index.html       # Single-page application layout
├── app.js           # Client-side search, filtering, and state management
├── style.css        # Custom styles, animations, and dark/light themes
├── catalog.json     # Precomputed metadata database of 4,753 items
└── README.md        # Documentation and project overview
```

---

## 🚀 Running Locally

You can serve this portal locally with any static file server:

```powershell
# Using Python
python -m http.server 8000

# Using Node / npx
npx serve .
```

Then navigate to `http://localhost:8000` in your web browser.
