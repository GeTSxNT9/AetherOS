# AetherOS

**AetherOS** (Sessio Log) is a personal Progressive Web Application (PWA) to follow a Monday-to-Friday training routine, log weights, repetitions, and RIR, and review progress. It is designed for use on a phone and works with the data stored on the device itself.

It is built with HTML, CSS, and JavaScript without an application framework or its own backend. There are no accounts and no synchronization: records live in the browser and can be moved with exported backups.

## Main Features

- Five-day routine (30 exercises) with 65 alternatives, plus an execution description and a technique tip for every exercise.
- Day selector, session summary with completion percentage, and a "done" mark per exercise that resets every day.
- Weight, repetitions, and RIR logging: accepts one common value for all sets or one value per set separated by semicolons (for example, `40;40;37,5`).
- Per-exercise variant switching; each variant keeps its own records.
- Orientative double-progression suggestion when the top of the repetition range is reached with the planned RIR.
- Session history with the detail of every exercise.
- Statistics: sessions, total and weekly volume, repetitions, weekly frequency, and evolution of the maximum load per exercise.
- Rest timer (2 minutes) with vibration alert.
- Animation for every exercise and alternative, loaded from a public exercise catalog.
- JSON backups: export and import.
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
│   ├── exercise-animations.js  # Exercise → animation catalog, GIF download and cache
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
- `routine-data.js` is the single source of the routine. To change exercises, sets, or texts, edit it. The `id` of each exercise is the key under which its records are saved: **do not change it** if you want to keep previous weights.
- `tracker-store.js` is the only module that reads and writes `localStorage` for training data; `app.js` only uses its interface (`AetherStore`).
- `exercise-animations.js` holds the catalog that assigns every exercise (and every alternative) the exact name of its animation. If you add a new exercise to the routine, add its line to that catalog too; without it a notice is shown instead of the GIF.
- `css/aetheros.css` groups the styles by section (variables, header, exercise cards, history and statistics, bottom dock, and responsive adjustments). The measurements of the bottom dock (navigation bar and timer) are variables at the top of the file.
- This separation is architectural; the repository does not include an automated test suite.

## Data and Persistence

- `localStorage` stores, under the `aetheros_v2_` prefix, the records per exercise and variant, the "done" marks, the chosen variant, and the history sessions.
- The "done" mark stores the date on which it was set, so all exercises appear unmarked when the day changes. Weights, repetitions, and RIR are kept so the last performance is visible.
- Exported backups (`aetheros-backup-v2`) are the recommended way to move or recover data. Import validates the whole file before writing anything and merges the compatible records with the existing local data. Make an export before updating the application or clearing browser data.
- Do not change the `aetheros_v2_` prefix or delete keys manually if you want to keep your records.
- Data never leaves the device and is not synchronized between devices.

## Progression

The double-progression suggestion appears when every logged set reaches the top of the repetition range and the RIR of each set is between the target and one more (for exercises marked "last set RIR 1", the last set is checked against 1). It proposes adding 1 kg for dumbbell exercises, 5 kg for lower body, and 2.5 kg for the rest. It is guidance, not a prescription.

## Exercise Animations and Attribution

Animations come from the public catalog [hasaneyldrm/exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset). Each exercise in the routine is assigned the exact name of its animation; there is no approximate search, so an animation is never picked at random. If the name is not found or there is no connection, the app shows a notice.

The application downloads the catalog file (`data/exercises.json`) once, remembers the GIF address of every exercise on the device, and from then on loads only the GIFs it needs.

GIFs and thumbnails are credited to Gym visual (<https://gymvisual.com/>). See the `LICENSE` and `NOTICE.md` files of the source repository for the terms that apply to the media: data and code are MIT-licensed, but the media have separate terms of use.

## PWA and Offline Operation

The Service Worker uses versioned caching (`aetheros-v` + `CACHE_VERSION` in `sw.js`) and deletes old caches upon activation. Application resources are served cache-first; if one is missing it is requested from the network and stored, and `index.html` is used as a fallback when offline. During installation, essential resources are preloaded with a request that bypasses the browser's own copy (`cache: 'reload'`) so outdated files are not stored; if an essential resource is missing, the installation is cancelled instead of leaving an incomplete shell.

GIFs and the exercise catalog are stored in a separate cache (`aetheros-gymvisual-v1`) that is not deleted when the application is updated. After the first load with a connection, the app downloads the animations of the whole routine in the background so they can be viewed offline.

Records are stored in `localStorage`; the availability of the interface and animations offline depends on having loaded the application with a connection beforehand.

## Deployment

The application can be served as a static site with GitHub Pages: upload the files keeping the structure and enable Pages from the branch and folder you use. It does not require a build process.

To publish an update:

1. Upload the modified files keeping their paths.
2. If you change any application file, increase `CACHE_VERSION` in `sw.js` so phones download the new version.
3. Open the application twice: the first time installs the update and the second one shows it.
4. If you change the icons, remove the installed app and add it to the home screen again.

## Design and Goal

AetherOS prioritizes clarity, large controls for one-handed use, and fast logging during training. Its goal is to make recording each set as effortless as possible and to show progress at a glance, without accounts, servers, or external dependencies, and with the data always under the user's control.
