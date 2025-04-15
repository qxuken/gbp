# Atom Data Flow in the Project

This document visualizes the data flow between atoms in the project using a Mermaid diagram.

## Data Flow Diagram

```mermaid
flowchart TD
    %% External Data Sources
    API[API/PocketBase] --> plansQueryAtom
    DB[(IndexedDB)] --> elementsAtom
    DB --> specialsAtom
    DB --> characterRolesAtom
    DB --> weaponTypesAtom
    DB --> weaponsAtom
    DB --> charactersAtom
    DB --> artifactSetsAtom
    DB --> artifactTypesAtom
    DB --> domainsOfBlessingAtom

    %% Core Data Flow
    plansQueryAtom[plansQueryAtom] -->|Query Result| plansAtom
    plansAtom[plansAtom] -->|Map Values| plansArrayAtom
    plansArrayAtom -->|Filter| weaponPlansAtom
    plansArrayAtom -->|Filter| artifactTypePlansAtom
    plansArrayAtom -->|Filter| artifactSetsPlansAtom

    %% Dictionary Data Flow
    elementsAtom -->|Array| elementsMapAtom
    specialsAtom -->|Array| specialsMapAtom
    characterRolesAtom -->|Array| characterRolesMapAtom
    weaponTypesAtom -->|Array| weaponTypesMapAtom
    weaponsAtom -->|Array| weaponsMapAtom
    charactersAtom -->|Array| charactersMapAtom
    artifactSetsAtom -->|Array| artifactSetsMapAtom
    artifactTypesAtom -->|Array| artifactTypesMapAtom
    domainsOfBlessingAtom -->|Array| domainsOfBlessingMapAtom

    %% Theme Data Flow
    themeAtom -->|User Preference| actualThemeAtom
    actualThemeAtom -->|Computed| displayThemeAtom
    displayThemeAtom -->|Applied| DOM[DOM Classes]

    %% Filter Data Flow
    plansArrayAtom -->|Available Items| availableFiltersAtom
    charactersMapAtom -->|Character Data| availableFiltersAtom
    availableFiltersAtom -->|Filter Options| filtersAtom
    filtersAtom -->|Enabled Filters| filtersEnabledAtom
    filtersEnabledAtom -->|Filtered Data| UI[UI Components]

    %% Pending Plans Data Flow
    plansAtom -->|Existing Plans| pendingCharacterPlansMapAtom
    pendingCharacterPlansMapAtom -->|Pending Changes| UI

    %% Cross-module Data Flow
    charactersMapAtom -->|Character Data| filtersAtom
    domainsBySetAtom -->|Domain Data| domainsByArtifactSetsAtom
    artifactSetsPlansAtom -->|Artifact Set Plans| domainsByArtifactSetsAtom

    %% User Interactions
    UI -->|Reorder| reorderMutationAtom
    reorderMutationAtom -->|Update| plansAtom

    %% Styling
    classDef external fill:#f96,stroke:#333,stroke-width:2px;
    classDef atom fill:#9cf,stroke:#333,stroke-width:2px;
    classDef derived fill:#9f9,stroke:#333,stroke-width:2px;
    classDef ui fill:#f9f,stroke:#333,stroke-width:2px;

    class API,DB external;
    class plansQueryAtom,plansAtom,plansArrayAtom,reorderMutationAtom,themeAtom,actualThemeAtom,displayThemeAtom,filtersAtom atom;
    class weaponPlansAtom,artifactTypePlansAtom,artifactSetsPlansAtom,domainsByArtifactSetsAtom,availableFiltersAtom,filtersEnabledAtom,pendingCharacterPlansMapAtom derived;
    class UI,DOM ui;
```

## Data Flow Explanation

### External Data Sources
- **API/PocketBase**: Provides plans data through queries
- **IndexedDB**: Local database that provides dictionary data (elements, characters, etc.)

### Core Data Flow
1. **plansQueryAtom** fetches data from the API
2. **plansAtom** stores the raw data as a map
3. **plansArrayAtom** transforms the map into a sorted array
4. Specialized atoms (**weaponPlansAtom**, **artifactTypePlansAtom**, etc.) filter the array for specific data

### Dictionary Data Flow
1. Base atoms (**elementsAtom**, **charactersAtom**, etc.) fetch data from IndexedDB
2. Map atoms provide efficient lookups by ID
3. These maps are used throughout the application for data references

### Theme Data Flow
1. **themeAtom** stores the user's theme preference
2. **actualThemeAtom** computes the actual theme based on system preferences
3. **displayThemeAtom** provides the final theme value
4. The theme is applied to the DOM through class names

### Filter Data Flow
1. **availableFiltersAtom** computes available filter options from plans and characters
2. **filtersAtom** stores the user's filter selections
3. **filtersEnabledAtom** computes which filters are active
4. Filtered data is passed to UI components

### Pending Plans Data Flow
1. **pendingCharacterPlansMapAtom** tracks changes to plans before they're saved
2. These pending changes are reflected in the UI
3. When changes are confirmed, they're saved to the backend

### User Interactions
1. User interactions in the UI trigger mutations (e.g., **reorderMutationAtom**)
2. Mutations update the base atoms
3. Changes propagate through derived atoms to the UI

## Atom Dependencies

The diagram shows how atoms depend on each other and how data flows through the application. Understanding these dependencies is crucial for:

1. Debugging state issues
2. Optimizing performance
3. Adding new features
4. Refactoring the codebase
