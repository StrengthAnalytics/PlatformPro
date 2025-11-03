# Platform Pro

This document provides a comprehensive overview of the Platform Pro application, detailing its features, technical architecture, and core logic. It is intended to be a living document, updated with each functional change to the application.

## 1. Project Overview

Platform Pro is a suite of powerful, client-side tools designed for powerlifters, strength athletes, and their coaches. The primary goal is to streamline the planning, execution, and analysis of training and competition. The application is a Progressive Web App (PWA) built to work offline, ensuring reliability on competition day where internet connectivity may be unstable.

---

## 2. Core Features & Functionality

The application is organized into several distinct tools, accessible from a central homescreen.

### 2.1. Competition Planner

The flagship tool for creating detailed, strategic powerlifting meet plans. It operates in two modes: **Pro** and **Lite**.

#### Pro Mode (Full-Featured)

-   **Plan Management**:
    -   **Save/Load**: Plans are saved to the browser's `localStorage`, allowing users to create and manage multiple plans.
    -   **Import/Export (.plp)**: Users can export the complete plan data as a `.plp` (Powerlifting Plan) JSON file. This allows for easy sharing between an athlete and coach, or for backing up plans.
-   **Data Input**:
    -   **Lifter & Competition Details**: Core information for the plan, including name, event, date, weight class, and body weight. Gender and body weight are used for score calculation.
    -   **Equipment Settings**: A section to note down specific rack heights and settings for each lift, which is included in the PDF export for quick reference.
-   **Attempt Strategy & Calculation**:
    -   **Logic**: The core of the attempt planner requires the user to input either their **Opener (1st attempt)** or their goal **3rd Attempt**. The `calculateAttempts` utility then populates the other two attempts.
    -   **Strategies**:
        -   `Aggressive`: Maximizes jumps to aim for the highest possible 3rd attempt.
        -   `Stepped`: Uses equal, predictable jumps between all three attempts.
        -   `Conservative`: Uses smaller, safer jumps to prioritize securing a total.
    -   **Units**: A global setting allows users to *plan* their attempts in LBS. The values are converted to KG in the background, as KG is the standard for competition.
-   **Warm-up Generation**:
    -   **Logic**: Triggered automatically when an opener is entered or calculated (if "Auto-Generate" is enabled), or manually via a button. The `generateWarmups` utility is used.
    -   **Strategies**:
        -   `Default (Recommended)`: Uses a comprehensive set of pre-defined, battle-tested warm-up tables (`SQUAT_WARMUPS`, etc.) based on the opener.
        -   `Dynamic`: Allows for a custom warm-up progression based on the number of sets, a starting weight, and the percentage of the opener for the final warm-up.
    -   **Units**: A global setting allows warm-up weights to be displayed in either KG or LBS.
-   **Game Day Mode**:
    -   A simplified, high-contrast, full-screen UI designed for use during a competition.
    -   Allows users to check off completed warm-ups.
    -   Allows users to mark each of the three competition attempts as "completed", "missed", or "pending".
    -   Features an "on-the-fly" attempt editor and calculates the current total in real-time.
-   **Exporting**:
    -   **PDF (Desktop/Mobile)**: Generates a printable, interactive PDF with checkboxes using `jsPDF` and `jspdf-autotable`. The mobile version features larger fonts and a layout optimized for phone screens.
    -   **CSV**: Exports all plan data into a CSV file for analysis in spreadsheet software.

#### Lite Mode (Quick Plan)

-   **Purpose**: To generate a complete, strategic competition plan in seconds.
-   **Logic**: The user inputs their name and goal 3rd attempts for all three lifts. The app uses the `aggressive` attempt strategy to calculate openers and second attempts, then automatically generates a full `default` warm-up plan for each lift.
-   **Output**: The generated plan is displayed and can be edited. It can then be exported to a simplified, unbranded PDF.

### 2.2. Workout Timer

A versatile timer for various training scenarios.

-   **Modes**:
    -   `Rolling Rest`: Automatically runs a countdown for rest periods between a specified number of sets. Includes an optional "lead-in" time before the first set.
    -   `Manual Rest`: A simple timer that is manually started by the user after completing a set.
-   **UI**: On desktop, uses standard number inputs. On mobile, it features a custom, touch-friendly "tumbler" picker component for a more intuitive UX.
-   **Alerts**: Plays audio beeps at user-configurable countdown intervals (e.g., 10s, 3s, 2s, 1s).
-   **Persistence**: Users can save their timer configurations as named presets to `localStorage`. These can be exported/imported as `.sctt` files.

### 2.3. 1RM & Training Load Calculator

A dual-function tool for estimating strength and prescribing training weights.

-   **1RM Calculator**:
    -   **Logic**: Uses a proprietary blended model ("Strength Analytics Formula") that combines the strengths of multiple academic formulas (Epley, Brzycki, etc.) across different rep ranges for a more accurate prediction than any single formula.
    -   **Output**: Provides the 1RM estimate and a full "Training Zone" table showing the corresponding weight for reps 1 through 15.
-   **Training Load Calculator**:
    -   **Logic**: Calculates a recommended training weight based on the user's estimated 1RM, the number of sets and reps, and the desired intensity (measured in RIR or RPE).
-   **Exporting**: The 1RM results can be exported as a branded PDF or a CSV file.

### 2.4. Other Tools

-   **Warm-up Generator**: A standalone version of the planner's warm-up logic.
-   **Velocity Profile Generator**: A tool for coaches and athletes using Velocity-Based Training (VBT).
    -   *Generate Profile* (Coach): A coach can input an athlete's test data (or import a `.vbt` file) to create a full RIR-based velocity profile.
    -   *Complete Test* (Athlete): A guided walkthrough for an athlete to perform a VBT test and export the results as a `.vbt` file for their coach.
-   **Technique Score Calculator**:
    -   **Logic**: Calculates the Coefficient of Variation (CV%) from the velocities of 3-5 heavy singles. This score quantifies technical consistency under load.
    -   **Output**: Provides the CV%, a qualitative category ("Excellent", "Good", "Needs Improvement"), and the associated training implications. Results can be exported to PDF.

---

## 3. Technical Architecture & Design

### 3.1. Frontend Stack

-   **Framework**: React 18 with TypeScript.
-   **Styling**: Tailwind CSS (via CDN) for utility-first styling. The configuration is defined in a `<script>` tag in `index.html`.
-   **Dependencies**: Key libraries like `react`, `react-dom`, and `jspdf` are loaded via an `importmap` from a CDN, simplifying the build process.

### 3.2. State Management

-   The application uses a centralized state model managed within the main `App.tsx` component.
-   The entire application state is held in a single `appState` object using the `useState` hook.
-   State updates are handled by passing callback functions down to child components, ensuring a unidirectional data flow.

### 3.3. Data Persistence

-   **Local Storage**: The primary mechanism for data persistence.
    -   `plp_allPlans`: Stores an object containing all saved competition plans.
    -   `plp_details`, `plp_equipment`, `plp_branding`: Caches the last-used settings for these sections.
    -   `workout_timers`: Stores saved timer presets.
    -   Other keys are used for user preferences like theme, units, etc.
-   **File-based**: Users can export plans (`.plp`), timer presets (`.sctt`), and VBT test data (`.vbt`) as JSON files for backup and sharing.

### 3.4. Offline Capability (PWA)

-   A **Service Worker** (`service-worker.ts`) is registered to cache core application assets.
-   This allows the app to load and function reliably without an internet connection, which is critical for use in gyms or at competitions.

### 3.5. Code Structure

-   `/components`: Contains all reusable React components.
-   `/utils`: Contains core business logic, calculations, and utility functions.
    -   `calculator.ts`: The brain of the application. Contains all mathematical logic for attempt calculation, warm-up generation, scoring, and plate breakdowns.
    -   `exportHandler.ts`: Manages the creation of all downloadable files (PDF, CSV, `.plp`).
    -   `migration.ts`: Handles state versioning, ensuring that data stored in `localStorage` from older versions of the app can be safely upgraded to the latest structure.
-   `App.tsx`: The root component that manages state and orchestrates the entire application.
-   `state.ts`: Defines the initial shape and default values for the application state.

---
*This README is automatically updated with significant changes to the application's functionality or architecture.*