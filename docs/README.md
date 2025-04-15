# Atom Documentation

This directory contains documentation about the atom structure and data flow in the project.

## Overview

The project uses [Jotai](https://jotai.org/) for state management. Jotai is a primitive and flexible state management library for React that uses the concept of atoms. Atoms are the smallest units of state that can be shared between components.

## Documentation Files

- [Atom Connections](atom-connections.md): A diagram showing how atoms are connected in the project.
- [Atom Data Flow](atom-data-flow.md): A diagram showing how data flows between atoms in the project.

## Atom Types Used in the Project

The project uses several types of atoms:

- **Basic atoms**: Created with `atom()`
- **Storage atoms**: Created with `atomWithStorage()`
- **Immer atoms**: Created with `atomWithImmer()`
- **Query atoms**: Created with `atomWithQuery()`
- **Mutation atoms**: Created with `atomWithMutation()`
- **Observable atoms**: Created with `atomWithObservable()`
- **Derived atoms**: Created by deriving from other atoms

## Atom Modules

The project organizes atoms into several modules:

- **Core Store**: The main Jotai store instance
- **Plans Module**: Atoms related to character plans
- **Dictionaries Module**: Atoms related to game data (characters, weapons, etc.)
- **Theme Module**: Atoms related to theme preferences
- **Filters Module**: Atoms related to filtering plans
- **Pending Plans Module**: Atoms related to pending plan changes

## How to Use These Diagrams

These diagrams are useful for:

1. **Understanding the codebase**: New developers can use these diagrams to understand how state is managed in the project.
2. **Debugging**: When debugging state issues, these diagrams can help identify where the problem might be.
3. **Refactoring**: When refactoring the codebase, these diagrams can help ensure that atom dependencies are maintained.
4. **Adding new features**: When adding new features, these diagrams can help identify where new atoms should be added and how they should be connected.

## How to Update These Diagrams

When making changes to the atom structure, please update these diagrams to reflect the changes. The diagrams are created using [Mermaid](https://mermaid.js.org/), which is supported by many Markdown viewers, including GitHub.

## Atom Best Practices

When working with atoms in this project, follow these best practices:

1. **Keep atoms small and focused**: Each atom should represent a single piece of state.
2. **Use derived atoms for computed values**: Instead of computing values in components, use derived atoms.
3. **Use map atoms for efficient lookups**: When you need to look up items by ID, use map atoms.
4. **Use hooks to access atoms**: Always use hooks to access atoms in components, never access atoms directly.
5. **Keep atom dependencies clear**: Make sure atom dependencies are clear and documented.
