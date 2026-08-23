# OpenIdle Engine

A flexible, data-driven idle game engine built with React and TypeScript. Define your game content in simple data files and let the engine handle the rest.

## Features

- **Resources**: Basic currencies, stat bars, hidden flags, passive generation, and dynamic capacity modifiers.
- **Tasks**: Time-based activities with leveling, progress bars, loops, item drops, and yield scaling.
- **Actions**: Instant purchases, upgrades, unlocks, and crafting with configurable costs and effects.
- **Converters**: Background machines that transform resources over time.
- **Equipment**: Slot-based gear providing passive bonuses. Unlock new slots via progression.
- **Modular Content**: Organize game data into themed modules or seasonal content packs.
- **Save System**: Auto-saves to LocalStorage. Import/Export as Base64 strings for sharing.

## Quick Start

### Prerequisites

- Node.js v16+
- npm

### Installation

```bash
git clone https://github.com/simonfruehauf/OpenIdle-Engine.git
cd OpenIdle-Engine
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

### Production Build

```bash
npm run build
```

Output goes to `dist/`.

## Project Layout

```
./
├── components/       # UI components (TaskCard, ActionCard, etc.)
├── context/          # Core engine logic (reducer, game loop, save/load)
├── gameData/         # Your game content lives here
│   ├── _template.ts  # Starter template for new modules
│   ├── resources.ts
│   ├── tasks.ts
│   ├── actions.ts
│   ├── equipment.ts
│   ├── converters.ts
│   ├── categories.ts
│   └── index.ts      # Module registry
├── docs/             # Engine API, validation checklist, roadmap
├── types.ts          # TypeScript interfaces
├── App.tsx           # Main layout
└── index.tsx         # Entry point
```

## Documentation

| Doc | For |
|-----|-----|
| `GAMEDATA_GUIDE.md` | Tutorial: how to define resources/tasks/actions/items/converters |
| `gameData/_template.ts` | Copy-paste starter for a new content pack |
| `ARCHITECTURE.md` | How the reducer, tick loop, and yield pipeline fit together |
| `AGENTS.md` | AI-agent working guide: conventions, sharp edges, done checklist |
| `CONTRIBUTING.md` | Setup, style, verification, PR process |
| `docs/ENGINE_API.md` | Field-by-field API reference + validation checklist |
| `docs/ROADMAP.md` | Prioritized TODOs / known gaps — good first contributions |

## Making Your Own Game

The engine is entirely data-driven. You never *need* to touch the core logic (but you can).

1. Create a new `.ts` file in `gameData/` (e.g., `pirates.ts`).
2. Export typed arrays: `RESOURCES`, `TASKS`, `ACTIONS`, `CATEGORIES`, etc.
3. Register your module in `gameData/index.ts`:

```typescript
import * as PiratesModule from './pirates';

const modules = [
    // existing modules...
    PiratesModule
];
```

See `GAMEDATA_GUIDE.md` for the full reference on data structures and mechanics. For API details and validation, see `docs/ENGINE_API.md` and `docs/ROADMAP.md`.

## Technologies

- React 19
- TypeScript
- Vite
- Tailwind CSS

## License

MIT
