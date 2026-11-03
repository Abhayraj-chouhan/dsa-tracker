# DSA Tracker 🧠

A beautiful React app to track your **250 DSA problem** journey — all topics, all links, progress saved locally.

## Features

- ✅ **250 curated problems** across 17 topics
- 🔗 **Direct links** to LeetCode or GeeksForGeeks
- 💾 **Progress saved** in localStorage (persists across browser sessions)
- 🔍 **Filter** by topic, difficulty (Easy/Medium/Hard), and status (solved/unsolved)
- 🔎 **Search** problems by name
- 📊 **Stats bar** — overall progress + per-difficulty breakdown
- 🌙 **Dark theme** — easy on the eyes for long coding sessions

## Topics Covered

| Topic | Questions |
|---|---|
| Arrays | 25 |
| Strings | 20 |
| Linked List | 15 |
| Stack & Queue | 12 |
| Binary Search | 12 |
| Sorting | 8 |
| Recursion & Backtracking | 15 |
| Trees | 20 |
| Binary Search Tree | 10 |
| Heaps | 8 |
| Hashing | 8 |
| Graphs | 20 |
| Dynamic Programming | 35 |
| Greedy | 12 |
| Tries | 5 |
| Bit Manipulation | 10 |
| Math & Number Theory | 15 |

## Getting Started

```bash
# Install dependencies
npm install

# Start the dev server
npm start
```

Then open [http://localhost:3000](http://localhost:3000)

## Build for Production

```bash
npm run build
```

## Project Structure

```
src/
├── data/
│   └── questions.js        # All 250 questions with links
├── hooks/
│   └── useProgress.js      # localStorage progress hook
├── components/
│   ├── StatsBar.jsx        # Stats + progress bars
│   ├── Filters.jsx         # Search + filter controls
│   └── TopicSection.jsx    # Collapsible topic groups
├── App.jsx                 # Root component
├── App.css                 # All styles
└── index.js                # Entry point
```

## Extending

To add more questions, edit `src/data/questions.js` and add objects with:
```js
{ id, topic, title, difficulty, link, platform }
// platform: "LC" | "GFG"
// difficulty: "Easy" | "Medium" | "Hard"
```
