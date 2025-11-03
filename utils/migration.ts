import type { AppState, LiftsState } from '../types';
import { initialAppState } from '../state';
import { deriveGameDayStateFromLifts } from '../state';

const migrateToV1 = (data: any): AppState => {
    // This is the first version, so we're migrating from an un-versioned state.
    // The main goal is to ensure all fields from the current AppState exist,
    // merging old data on top of a complete default structure.
    const migrated: AppState = {
        ...initialAppState,
        ...data,
        details: { ...initialAppState.details, ...(data.details || {}) },
        equipment: { ...initialAppState.equipment, ...(data.equipment || {}) },
        branding: { ...initialAppState.branding, ...(data.branding || {}) },
        lifts: { ...initialAppState.lifts, ...(data.lifts || {}) },
        version: 1,
    };

    // Ensure nested lift structure is correct and complete
    (Object.keys(initialAppState.lifts) as (keyof LiftsState)[]).forEach(lift => {
        migrated.lifts[lift] = {
            ...initialAppState.lifts[lift],
            ...(data.lifts?.[lift] || {}),
        };
    });

    // Crucially, re-derive gameDayState from the (potentially old) lifts data
    // to ensure its structure is also up-to-date.
    migrated.gameDayState = deriveGameDayStateFromLifts(migrated.lifts);
    
    return migrated;
};

export const migrateState = (data: any): AppState => {
    // A plan with no version is considered version 0.
    const version = data?.version || 0;

    if (version < 1) {
        data = migrateToV1(data);
    }

    // Future migrations would be chained here, ensuring a user
    // can upgrade from any old version to the latest.
    // if (version < 2) {
    //     data = migrateToV2(data);
    // }

    return data;
};
