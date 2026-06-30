# Project Zeal

Project Zeal is a desktop productivity app built with Electron, React, TypeScript, and Vite. The current version is an early-stage prototype focused on local task management and persistence.

## Current state

The app currently provides:

- A simple desktop UI powered by Electron and React
- A basic task list experience
- A button to add sample tasks
- Local persistence using Dexie with IndexedDB
- A prepared data model for tasks and completion tracking

## Tech stack

- Electron for the desktop shell
- React + TypeScript for the UI
- Vite for fast development and bundling
- Dexie for local database storage
- ESLint for code quality checks

## Project structure

- src/App.tsx — main application UI
- src/lib/db.ts — Dexie database setup and schemas
- src/lib/id.ts — ID generation helper
- src/main.ts — Electron main process entry
- src/preload.ts — preload script
- src/renderer.tsx — React renderer entry

## Getting started

Install dependencies:

```bash
npm install
```

Run the app in development mode:

```bash
npm start
```

Run linting:

```bash
npm run lint
```

Build and package the app:

```bash
npm run package
```

## Notes

This repository is still in its early development stage. The current implementation focuses on establishing the app shell, UI structure, and local data persistence rather than full feature completion.
