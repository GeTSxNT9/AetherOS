# AetherOS

**AetherOS** (Sessio Log) is a Progressive Web Application (PWA) to follow a Monday-to-Friday training routine, record the weight, repetitions, and RIR of each exercise, and review the session history and progress statistics.

It is built with HTML, CSS, and JavaScript without an application framework or its own backend. All information is stored in the browser of the device; there are no accounts and no synchronization.

## Main Features

- Five-day routine of 30 exercises, each with its execution description, a technique tip, and a list of alternatives (65 in total).
- Day selector, session summary with completion percentage, and a per-exercise "done" mark that resets every day.
- Recording of a single weight, repetition, and RIR value per exercise; the decimal comma is accepted (for example, `62,5`).
- Variant switching per exercise, with independent records for each variant.
- Double-progression suggestion when the top of the repetition range is reached with the planned RIR.
- Session history with the detail of every exercise.
- Statistics: sessions, total and weekly volume, repetitions, weekly frequency, and evolution of the load per exercise.
- Rest timer of 2 minutes with vibration alert.
- Animation of every exercise and alternative.
- JSON backups: export and import, and a data reset option.
- Installable PWA with a floating bottom navigation bar and offline operation.

## Current Architecture

```text
AetherOS-main/
├── index.html                  # Interface, views, and ordered module loading
├── css/
│   └── aetheros.css            # Visual design, layout, bottom dock, and responsive rules
├── js/
│   ├── routine-data.js         # Routine: days, exercises, alternatives, execution, and tips
│   ├── tracker-store.js        # localStorage access, sessions, and backups
│   ├── exercise-animations.js  # Exercise-to-animation catalog, GIF display, and preloading
│   └── app.js                  # Interface, logging, progression, history, statistics, and timer
├── manifest.json               # PWA installation metadata
├── sw.js                       # Installation, update, and offline cache
├── icon-192.png
├── icon-512.png
├── apple-touch-icon.png
├── favicon-32.png
└── README.md
```

### Responsibilities and Limits

- The four files in `js/` are plain scripts that share the global scope and **must be loaded in the order listed in `index.html`**: routine and storage first, then animations, and finally `app.js`.
- `routine-data.js` is the single source of the routine. Exercises, sets, repetition ranges, and texts are changed there. The `id` of each exercise is the key under which its records are stored, so it should not be modified if the existing records are to be kept.
- `tracker-store.js` is the only module that reads and writes training data in `localStorage`; `app.js` accesses it through the `AetherStore` interface.
- `exercise-animations.js` assigns to every exercise and alternative the exact file of its animation. A new exercise added to the routine requires its corresponding line in this catalog; without it, a notice is shown instead of the animation.
- `css/aetheros.css` groups the styles by section: variables, header, exercise cards, history and statistics, bottom dock, and responsive adjustments. The measurements of the bottom dock (navigation bar and timer) are variables at the top of the file.
- This separation is architectural, not a claim that a test suite is included in the repository.

## Data and Persistence

- `localStorage` stores, under the `aetheros_v2_` prefix, the records per exercise and variant, the "done" marks, the selected variant, and the history sessions.
- The "done" mark stores the date on which it was set, so every exercise appears unmarked when the day changes. Weight, repetitions, and RIR are kept to show the last performance.
- Volume is calculated as weight × repetitions × sets, and total repetitions as repetitions × sets.
- Exported backups (`aetheros-backup-v2`) are the recommended way to move or recover data. Import validates the whole file before writing and merges the compatible records with the local data. Make an export before updating the application or clearing browser data.
- The options dialog includes a data reset button. After confirmation, it deletes every `aetheros_v2_*` key (records, marks, variants, and history); it does not affect the installed application or its cache. A backup should be exported beforehand if the data is to be recovered.
- Do not manually delete `aetheros_v2_*` keys if you want to keep the data.
- Data does not leave the device and is not synchronized between devices.

## Progression

The double-progression suggestion appears when the recorded repetitions reach the top of the exercise's repetition range and the recorded RIR is between the target and one more; for exercises whose target is "last set RIR 1", the lower bound is 1. The proposed increase is 1 kg for dumbbell exercises, 5 kg for lower-body exercises, and 2.5 kg for the rest. It is an orientation and not a prescription.

## Exercise Animations and Attribution

Animations are loaded from the public catalog [hasaneyldrm/exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset). `exercise-animations.js` stores the exact file of the animation assigned to each exercise, so no search is performed and no animation is chosen approximately. If an exercise has no assigned file or the GIF cannot be loaded, the application shows a notice.

GIFs are credited to Gym visual (<https://gymvisual.com/>). The terms that apply to the media are described in the `LICENSE` and `NOTICE.md` files of the source repository: code and data are MIT-licensed, whereas the media have separate terms of use.

## PWA and Offline Operation

The Service Worker uses versioned caching (`aetheros-v` followed by `CACHE_VERSION` in `sw.js`) and deletes old caches upon activation. Application resources use cache-first; if one is missing, it is requested from the network and stored, and `index.html` is used as a fallback when offline. During installation it preloads the essential resources with a request that bypasses the browser's own copy (`cache: 'reload'`); if an essential resource is missing, it cancels the installation instead of leaving an incomplete shell.

GIFs are stored in a separate cache (`aetheros-gymvisual-v1`) that is not deleted when the application is updated. After the first load with a connection, the application downloads the animations of the whole routine in the background.

**Known limit:** the GIFs are served from `raw.githubusercontent.com`. Until an animation has been downloaded once with a connection, it is not available offline.

Existing data is in `localStorage`, but the availability of the interface in an initial offline installation depends on having previously loaded the application and its essential resources successfully.

## Deployment

The application can be served as a static site with GitHub Pages. Publish the contents of this folder while keeping the file structure. It does not require a build process.

When publishing an update, `CACHE_VERSION` in `sw.js` must be increased whenever any application file changes, so that installed copies download the new version. If the icons change, the installed application has to be removed and added again to the home screen.

## Design and Goal

AetherOS prioritizes clarity, large controls for one-handed use, and fast recording during training. Its goal is to make logging each exercise require the least possible effort and to show progress at a glance, without accounts, servers, or external dependencies, keeping the data under the control of the user.
