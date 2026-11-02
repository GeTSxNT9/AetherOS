# AetherOS

**AetherOS** (Sessio Log) is a Progressive Web Application (PWA) to follow a Monday-to-Friday training routine, record the weight, repetitions, and RIR of each exercise, apply a double-progression criterion, and review the session history and progress statistics.

The application is implemented in vanilla HTML, CSS, and JavaScript, with no framework or server-side component. Working data is stored locally in the browser of the device; there are no accounts and no synchronization.

## Main Features

- Five-day routine of 30 exercises, each with its sets, repetition range, target RIR, execution description, technique tip, and alternatives.
- Day selector, session summary with completion percentage, and a per-exercise "done" mark that is valid only on the day it was set.
- Recording of a single weight, repetition, and RIR value per exercise; the decimal comma is accepted.
- Variant switching per exercise, with independent records for each variant.
- Double-progression suggestion when the top of the repetition range is reached with the planned RIR.
- Automatic session history, with the detail of every exercise.
- Statistics: sessions, volume, repetitions, weekly frequency, and evolution of the load per exercise.
- Rest timer, JSON backups (export and import), and data reset.
- Animation of every exercise and alternative.
- Installable PWA with a floating bottom navigation bar and offline operation.

## Current Architecture

```text
AetherOS-main/
├── index.html                  # Interface, views, and ordered module loading
├── css/
│   └── aetheros.css            # Visual design, layout, bottom dock, and responsive rules
├── js/
│   ├── routine-data.js         # Routine: days, exercises, alternatives, execution, and tips
│   ├── tracker-store.js        # localStorage access, sessions, backups, and reset
│   ├── exercise-animations.js  # Exercise-to-animation catalog and GIF display
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

- The four files in `js/` are plain scripts that share the global scope and **must be loaded in the order listed in `index.html`**: routine and storage first, then animations, and finally `app.js`, which uses the objects exposed by the previous ones.
- `routine-data.js` is the single source of the routine. The `id` of each exercise is the key under which its records are stored, so it should not be modified if the existing records are to be kept.
- `tracker-store.js` is the only module that reads and writes training data in `localStorage`; `app.js` accesses it through the `AetherStore` interface.
- `exercise-animations.js` assigns to every exercise and alternative the exact file of its animation. A new exercise added to the routine requires its corresponding line in this catalog; without it, a notice is shown instead of the animation.
- `css/aetheros.css` contains the application styles: layout, component appearance, bottom dock, and responsive behavior. It is separate from the HTML so visual changes can be maintained without editing the application logic.
- This separation is architectural, not a claim that a test suite is included in the repository.

## Data and Persistence

- `localStorage` stores, under the `aetheros_v2_` prefix, the records per exercise and variant, the "done" marks, the selected variants, and the history sessions.
- Volume is calculated as weight × repetitions × sets. Weight, repetitions, and RIR are not cleared when the day changes, so the last performance remains visible.
- Do not manually delete `aetheros_v2_*` keys if you want to keep the data.
- Exported backups are the recommended way to move or recover data. Make an export before updating the application or using the data reset option. Import validates the whole file before writing anything.
- Data does not leave the device and is not synchronized between devices.

## Exercise Animations and Attribution

Animations are loaded from the public catalog [hasaneyldrm/exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset). `exercise-animations.js` stores the exact file of the animation assigned to each exercise, so no search is performed and no animation is chosen approximately. If an exercise has no assigned file or the GIF cannot be loaded, the application shows a notice.

GIFs are credited to Gym visual (<https://gymvisual.com/>). The terms that apply to the media are described in the `LICENSE` and `NOTICE.md` files of the source repository: code and data are MIT-licensed, whereas the media have separate terms of use.

## PWA and Offline Operation

The Service Worker uses versioned caching and deletes old AetherOS caches upon activation. Application resources use cache-first; if one is missing, it is requested from the network and stored. During installation, it preloads essential resources; if an essential resource is missing, it cancels the installation instead of leaving an incomplete shell. GIFs are stored in a separate cache that is not deleted when the application is updated, and the animations of the whole routine are downloaded in the background after the first load.

**Known limit:** the GIFs are served from `raw.githubusercontent.com`. Until an animation has been downloaded once with a connection, it is not available offline.

Existing data is in `localStorage`, but the availability of the interface in an initial offline installation depends on having previously loaded the application and its essential resources successfully.

## Deployment

The application can be served as a static site with GitHub Pages. Publish the contents of this folder while keeping the file structure. It does not require a build process.

When publishing an update, `CACHE_VERSION` in `sw.js` must be increased so that installed copies download the new version.

## Design and Goal

AetherOS prioritizes clarity, large controls for one-handed use, and fast recording during training. Its goal is to make logging each exercise require the least possible effort and to show progress at a glance, without hiding the data or taking away the user's control over it.
