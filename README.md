# OpenIdle Engine

A data-driven, text-based incremental game engine built with React, TypeScript, and Vite. Designed for flexibility, it allows developers to create complex idle games using simple data structures.

## Features

- **Resource Management**: Support for complex resource chains, including basic resources, stats (Health/Sanity), hidden resources, passive generation, and soft/hard caps.
- **Task System**: Time-based activities (loops) that consume and produce resources. Supports prerequisites, auto-restart, and leveling mechanics.
- **Action System**: Instant interactions (One-time or repeatable) for crafting, unlocking features, or story progression.
- **Equipment & Inventory**: Slot-based equipment system. Items can modify global stats, resource caps, or task yields.
- **Modular Content**: Game data is separated from logic. Features like the "Yuletide" event are implemented as standalone modules.
- **Save System**: robust save management with auto-saving to LocalStorage, plus Base64 string Import/Export for sharing saves.
- **Responsive UI**: Built with Tailwind CSS, featuring a clean, utilitarian interface suitable for text-heavy games.

## Getting Started

For getting started with content creation, see `GAMEDATA_GUIDE.md`.

### Prerequisites

- Node.js (v16+)
- npm

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/simonfruehauf/openidle.git
   cd openidle
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open your browser at `http://localhost:3000` (or the port shown in the terminal).

### Building for Production

To create an optimized build for deployment:

```bash
npm run build
```

The output will be in the `dist/` folder.

## Project Structure

The project follows a clear separation between engine logic and game content:

```table
./
├── components/       # React UI Components (TaskCard, ResourceRow, etc.)
├── context/          # Core Engine Logic (Game Loop, Reducer, Save/Load)
├── gameData/         # GAME CONTENT DEFINITIONS
│   ├── actions.ts    # Instant actions
│   ├── tasks.ts      # Time-based tasks
│   ├── resources.ts  # Resource definitions
│   ├── equipment.ts  # Item and Equipment definitions
│   ├── categories.ts # Category definitions
│   ├── christmas.ts  # Example of a content module
│   └── index.ts      # Central registry for loading content
├── types.ts          # TypeScript interfaces for the data models
├── App.tsx           # Main Layout
└── index.tsx         # Entry point
```

## How to Mod / Add Content

OpenIdle is data-driven. You don't need to touch the engine code to make a new game. For specifics, look at `GAMEDATA_GUIDE.md`.

1. **Define Content**: Create a new `.ts` file in `gameData/` (e.g., `necromancy.ts`).
2. **Export Arrays**: Export arrays for `TASKS`, `RESOURCES`, `ACTIONS`, etc., strictly typed against the interfaces in `types.ts`.

   ```typescript
   import { TaskConfig } from "../types";
   
   export const TASKS: TaskConfig[] = [{
       id: "raise_dead",
       name: "Raise Dead",
       category: "necromancy",
       progressRequired: 5, // seconds
       costPerSecond: [{ resourceId: "mana", amount: 2 }],
       effectsPerSecond: [{ type: "add_resource", resourceId: "zombies", amount: 1 }],
       // ...
   }];
   ```

3. **Register**: Import your file in `gameData/index.ts` and add it to the `modules` array.

   ```typescript
   import * as NecromancyModule from './necromancy';
   
   const modules = [
       // ...
       NecromancyModule
   ];
   ```

## Technologies

- **React 19**: UI Library
- **TypeScript**: Type safety
- **Vite**: Build tool
- **Tailwind CSS**: Styling

## License

MIT
