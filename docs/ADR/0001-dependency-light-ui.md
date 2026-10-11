# ADR 0001: Vanilla ES Modules instead of React/Vite for P0/P1

**Status**: Accepted, 2026-10-11

## Context

The specification recommended React + TypeScript + Vite as one approach. This environment has no reliable npm registry access for fetching dependencies. The project is for one person and the UI is intentionally bounded (one storyboard, drawers, project list, logic view).

## Decision

Use browser-standard HTML/CSS/ES modules and a small Cloudflare Worker. Only the browser PPTX export depends on a vendored, license-compliant PptxGenJS distribution. Cloudflare uses Wrangler in CI, installed in the GitHub environment.

## Consequences

- Browser app is directly runnable from the local Node dev server and editable in GitHub without a build step.
- D1 APIs, JWT verification and core document model are independent from the UI.
- React, TypeScript and drag-and-drop libraries are not included. Migrating to React is possible if interaction complexity expands but is not required for the present goals.
- Static JavaScript lacks compile-time type checking, compensated for in P0 by runtime validation, tests, and explicit file responsibilities.
- Node/PPTX/Cloudflare compatibility requires browser and deployment verification after update.
