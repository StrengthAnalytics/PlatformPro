# Platform Coach & Platform Lifter - Complete User Guide

**Version:** 1.0
**Last Updated:** November 2025

---

## Table of Contents

1. [Introduction & Getting Started](#introduction--getting-started)
2. [Feature 1 - Competition Planner](#feature-1---competition-planner)
   - [Pro Mode](#pro-mode)
   - [Lite Mode](#lite-mode)
3. [Feature 2 - Workout Timer](#feature-2---workout-timer)
4. [Feature 3 - 1RM & Training Load Calculator](#feature-3---1rm--training-load-calculator)
5. [Feature 4 - Warm-up Generator](#feature-4---warm-up-generator)
6. [Feature 5 - Velocity Profile Tools](#feature-5---velocity-profile-tools)
7. [Feature 6 - Technique Score Calculator](#feature-6---technique-score-calculator)
8. [Feature 7 - Game Day Mode](#feature-7---game-day-mode)
9. [Extra Features](#extra-features)
10. [Tips & Best Practices](#tips--best-practices)
11. [Support & Feedback](#support--feedback)

---

## Introduction & Getting Started

### What is Platform Coach/Lifter?

This application is a comprehensive powerlifting toolkit designed to help athletes and coaches plan competitions, track training, and optimise performance. It comes in two versions:

**Platform Coach (Paid Version)**
- Full-featured professional toolkit
- Cloud sync and authentication
- All advanced features unlocked
- URL: platformcoach.app

**Platform Lifter (Free Version)**
- Essential powerlifting tools
- No sign-up required
- Limited features (upgrade prompts for premium tools)
- URL: platformlifter.app

### Progressive Web App (PWA)

Both versions work offline, making them reliable on competition day, where internet connectivity may be unstable. You can install the app on your phone or computer for easy access:

**On Mobile (iOS/Android):**
1. Open the app in your browser
2. Tap the "Share" or menu button
3. Select "Add to Home Screen"

**On Desktop:**
1. Click the install icon in your browser's address bar
2. Or check your browser's menu for the "Install app" option

### The Homescreen

When you first open the app, you'll see a grid of tool cards:
- **Competition Planner** - Plan your meet attempts and warm-ups
- **Workout Timer** - Rest timers for training sessions
- **1RM & Training Load** - Calculate max strength and prescribe training weights
- **Warm-up Generator** - Create custom warm-up progressions
- **Velocity Profile** - VBT testing and profile generation
- **Technique Score** - Assess technical consistency

Simply tap any card to access that tool.

---

## Feature 1 - Competition Planner

### Pro Mode

**Availability:** Platform Coach only (full version) | Platform Lifter (upgrade required)

Pro Mode is the flagship feature - a comprehensive tool for creating detailed, strategic powerlifting meet plans.

#### Choose Your Mode

At the top of the Competition Planner screen, you'll see a mode toggle:
- **Pro Mode** - Full-featured planner with save/load and advanced options
- **Lite Mode** - Quick plan generator (see Lite Mode section)

Select **Pro Mode** to access all features.

#### Enter Competition Details

Click the **"Competition Details"** section to expand it.

**Required Information:**
- **Lifter Name** - The athlete's name (appears on all exports)
- **Event Name** - Name of the powerlifting meet
- **Weight Class** - Your registered weight class (e.g., 83kg, 93kg)
- **Competition Date** - Date of the meet
- **Weigh-in Time** - Scheduled weigh-in time

**For Score Calculation (Optional):**
- **Body Weight** - Current body weight in kg
- **Gender** - Required for calculating powerlifting scores

**Why This Matters:**
These details appear on all exported PDFs and help organise your plans. Body weight and gender enable automatic score calculation (DOTS, Wilks, IPF Points, etc.).

#### Equipment Settings

Click the **"Equipment Settings"** section.

Record your personal equipment preferences:
- **Squat Rack Height** - Your preferred squat rack setting
- **Squat Stands** - How do you like them set up?
- **Bench Rack Height** - Your bench press rack height
- **Hand Out** - Do you want to unrack the Bench Press on your own or with the help of a spotter?

These settings appear on your PDF export for quick reference during warm-ups and on the platform.

#### Select Attempt Strategy

Before planning your attempts, choose your **Attempt Selection Strategy**:

**Aggressive (Default)**
- Opens heavier with smaller jumps to the third attempt
- Popular for bench press
- Best when confident in your opener

**Stepped**
- Equal jumps between all three attempts
- Very predictable progression
- Good for consistent lifters

**Conservative**
- Opens lighter with larger jumps to the third
- Good for beginners or securing opening lifts
- Best when you want to guarantee success

#### Plan Your Squat Attempts

Expand the **"Squat"** section.

**Three Ways to Plan:**

**Option A: Enter Your Opener**
1. Type your planned first attempt in the **"1st Attempt"** field
2. Leave the 3rd attempt blank
3. Click **"Calculate"**
4. The app fills in your 2nd and 3rd attempts based on your strategy

**Option B: Set Your Goal Third**
1. Leave the 1st attempt blank
2. Type your goal weight in the **"3rd Attempt"** field
3. Click **"Calculate"**
4. The app works backwards to suggest your opener and second

**Option C: Manual Selection**
- You can use either of the above options and then adjust each attempt manually
- Or, just put in all attempts manually if you prefer

#### Configure Squat Warm-ups

Below the attempts, you'll see the **"Warm-up Strategy"** section.

**Default Strategy (Recommended)**
- Uses battle-tested warm-up tables
- Based on years of coaching experience
- Automatically adjusts based on your opener
- Best for most lifters

**How it works:**
1. Auto-generate is ON by default
2. When you enter/calculate your opener, warm-ups appear automatically
3. Review the generated sets - they're editable
4. Each set shows weight and reps

**Dynamic Strategy (Advanced)**
- Full control over warm-up progression
- Good for experienced lifters with specific preferences

**Configure:**
1. Switch to "Dynamic" mode
2. Set **"# of Sets"** - Total warm-up sets (typically 4-6)
3. Set **"Start Weight"** - Usually the empty bar (20kg)
4. Set **"Final WU % of Opener"** - Your heaviest warm-up (typically 90-95%)
5. Click **"Generate"**

**Manual Editing:**
- Click any warm-up weight or rep count to edit
- Helpful in fine-tuning the progression
- Changes are saved with your plan

#### Repeat for Bench Press and Deadlift

Use the same process for **Bench Press** and **Deadlift**:
1. Expand the lift section
2. Enter opener OR goal third
3. Click Calculate
4. Configure warm-ups (or let auto-generate handle it)
5. Add technical cues if desired

#### Review Records Comparison (Optional)

Expand the **"Records Comparison"** section to see how your attempts stack up against official powerlifting records.

**(Currently only available to lifters in British Powerlifting, more countries coming soon)**

**How to Use:**
1. **Select Region** - British, England, Wales, Scotland, or regional
2. **Weight Class** - Auto-populated from your competition details
3. **Age Category** - Open, Junior, Sub-Junior, or Masters
4. **Equipment** - Equipped or Unequipped

**The records display shows:**
- Current records for squat, bench, deadlift, and total
- Record holder names (when available)

**Note:** Records data is from British Powerlifting (IPF) federations and is updated periodically.

#### Record Your Personal Bests (Optional)

Click the **"Personal Bests"** section to expand it.

**Purpose:**
Track your current personal records and display them on your exported PDF for reference and comparison.

**What to Enter:**

For each lift (Squat, Bench Press, Deadlift):
- **PB Weight** - Your current personal best
- **Date Achieved** - When you set this record

**Why This Matters:**
- See how your competition attempts compare to your PBs
- Motivational reference on meet day
- Appears on all PDF exports

#### Save, Load & Share Your Plan

Once your plan is complete, you can save it, manage multiple plans, and share with coaches or athletes.

**Save Changes Button:**
- Only active when editing an existing plan
- Updates the currently loaded plan
- Overwrites the previous version
- The button is disabled if no changes are made

**When to Use:**
- You loaded an existing plan
- Made modifications to attempts or settings
- Want to update the saved version
- Asterisk (*) shows unsaved changes

**Save As... Button:**
- Always available
- Creates a new plan with a custom name
- Opens a box asking for a plan name
- Original plan remains unchanged (if you loaded one)

**When to Use:**
- Saving a brand new plan
- Creating a variation of an existing plan
- Making athlete-specific versions
- Backing up before major changes

**Organising Plans:**
- All plans are stored in the browser's local storage
- Plans persist offline
- Unlimited saved plans (Platform Coach)
- Each plan name must be unique

#### Loading Existing Plans

**How to Load:**
1. Open the **"Save & Load Plans"** section
2. Click the **"Load Saved Plan"** dropdown
3. Select a plan name from the list
4. Plan loads immediately into the editor

**Important:**
- Unsaved changes are lost when loading a different plan
- The app warns you before discarding changes
- Save the current work before loading another plan

#### Deleting Plans

**To remove a plan:**
1. Load the plan you want to remove (use the dropdown)
2. Click **"Delete Current Plan"** button
3. Confirm the deletion when prompted

**Important:**
- This action cannot be undone
- The plan is permanently removed from browser storage
- Export as `.plp` backup before deleting if needed
- The button is disabled when no plan is loaded

#### Import/Export Plans (.plp Files)

Share complete plans between devices, athletes, and coaches.

**What is a .plp File?**

Powerlifting Plan format (JSON file) that contains ALL plan data:
- Competition details and personal bests
- Equipment settings
- All three lifts with attempts
- Complete warm-up progressions
- Branding settings
- Records comparison settings

**Export a Plan:**
1. Create or load the plan you want to share
2. Click **"Export Plan"** button (bottom of Save & Load section)
3. File downloads as `PlanName.plp`
4. Share via email, cloud storage, messaging, etc.

**Import a Plan:**
1. Click **"Import Plan..."** button
2. Select a `.plp` file from your device
3. Plan loads immediately into the editor
4. Review the imported data
5. Click **"Save As..."** to save under a new name

**Use Cases:**

**Coach → Athlete:**
- Coach creates a strategic plan
- Exports as `.plp` file
- Sends to the athlete via email or WhatsApp
- Athlete imports and can edit warm-ups or attempts
- The athlete exports the updated version back to the coach

**Backup Plans:**
- Export necessary plans before clearing browser data
- Store `.plp` files in cloud (Google Drive, Dropbox)
- Re-import after switching devices
- Maintain historical competition plans

**Share with Training Partners:**
- Export proven competition strategies
- Share successful meet plans
- Adapt plans for similar lifters
- Learn from experienced lifters' approaches

**Work Across Devices:**
- Create a plan on a desktop computer
- Export to `.plp` file
- Email to yourself
- Import on phone for meet day

**Important Notes:**
- Imported plans don't overwrite existing saved plans automatically
- Always use "Save As..." after importing to avoid confusion
- Plan names in the file can be changed after importing
- Compatible with both Platform Coach and Platform Lifter (feature availability may differ)

---

### Lite Mode

**Availability:** Both Platform Coach and Platform Lifter

Lite Mode generates a complete competition plan in seconds. Perfect for quick planning or when you just need the basics.

#### How Lite Mode Works

**1. Access Lite Mode:**
- Open Competition Planner
- Toggle to **"Lite Mode"** at the top

**2. Enter Your Information:**
- **Lifter Name** - Your name or the athlete's name
- **Goal Squat 3rd** - Your target squat weight
- **Goal Bench 3rd** - Your target bench press weight
- **Goal Deadlift 3rd** - Your target deadlift weight

**3. Build the Plan:**
- Click **"Build My Plan"**
- The app instantly calculates:
  - Openers (1st attempts)
  - Second attempts
  - Full warm-up progressions for all three lifts
- Uses the "Aggressive" strategy by default

**4. Review and Edit:**
- Your plan appears below
- All attempts are editable
- All warm-ups can be adjusted
- Changes are saved as you type

**5. Export to PDF:**
- Click **"Export to PDF"**
- Get a clean, unbranded PDF for game day
- (Platform Coach users get additional export options)

**6. Launch Game Day Mode:**
- Click **"Launch Game Day Mode"**
- Get a simplified, full-screen interface for meet day
- (Available to both free and paid users when using Lite Mode)

#### When to Use Lite Mode

**Good for:**
- Quick planning sessions
- Beginner lifters who just need basics
- Backup plans at meets
- Sharing simple plans with training partners

**Use Pro Mode When:**
- You need to save multiple plans
- You want detailed equipment settings
- You need custom warm-up strategies
- You're planning for important competitions

---

## Feature 2 - Workout Timer

**Availability:** Basic (both versions) | Advanced features (Platform Coach only)

A versatile rest timer for various training scenarios.

### Accessing the Timer

From the homescreen, tap **"Workout Timer"**.

### Timer Modes

#### Rolling Rest Mode

Automatically runs countdown timers for a specified number of sets.

**How to Use:**
1. Select **"Rolling Rest"** mode
2. Set **"Number of Sets"** (e.g., 5 sets)
3. Set **"Rest Duration"** (e.g., 3:00 minutes)
4. Optional: Set **"Lead-in Time"** (countdown before first set)
5. Click **"Start Timer"**

**What Happens:**
- Countdown begins immediately (or after lead-in)
- Audio beeps play at configurable intervals (10s, 3s, 2s, 1s)
- The timer automatically restarts for the next set
- Shows "Set X of Y" progress
- Stops automatically after all sets complete

**Best For:**
- Squat and deadlift sessions with consistent rest
- Conditioning work
- Timed training blocks

#### Manual Rest Mode

A simple timer you start manually after completing each set.

**How to Use:**
1. Select **"Manual Rest"** mode
2. Set **"Rest Duration"** (e.g., 5:00 minutes)
3. Perform your set
4. Click **"Start Timer"** when ready to rest
5. Repeat for each set

**What Happens:**
- Timer counts down from your set time
- Beeps at configured intervals
- Stops when it reaches zero
- Ready for you to start again after your next set

### Timer Settings

**Audio Alerts (Both Versions):**
- Choose between Voice and Beep alerts
- If Voice is selected, you can choose between Male and Female
- Configure which countdown points trigger beeps
- Default: 10 seconds, 3, 2, 1
- Toggle checkboxes to customise

### Saving Timer Presets (Platform Coach Only)

Create and save named timer configurations for quick access.

**To Save a Preset:**
1. Configure your timer (mode, duration, sets, etc.)
2. Click **"Save Preset"**
3. Enter a name (e.g., "Squat Day - Heavy")
4. Click **"Save"**

**To Load a Preset:**
1. Click the preset dropdown
2. Select your saved preset
3. Settings load automatically

**To Export/Import Presets:**
- **Export:** Save presets as `.sctt` files for backup
- **Import:** Load `.sctt` files from other devices or training partners
- Useful for coaches sharing programs with athletes

---

## Feature 3 - 1RM & Training Load Calculator

**Availability:** Platform Coach only

### 1RM Calculator

Estimate your one-rep max from submaximal lifts.

**How to Use:**
1. From homescreen, select **"1RM & Training Load"**
2. Enter **"Weight Lifted"** (e.g., 100kg)
3. Enter **"Reps Completed"** (e.g., 5 reps)
4. Click **"Calculate 1RM"**

**Results:**
- **Estimated 1RM** - Your predicted max using the Strength Analytics Formula
- **Training Zone Table** - Shows corresponding weights for reps 1-15
- More accurate than single-formula calculators

**The Strength Analytics Formula:**
- Proprietary blend of multiple academic formulas
- Combines Epley, Brzycki, and other respected models
- Optimised for accuracy across different rep ranges
- Particularly strong for 3-8 rep ranges

**Use Cases:**
- Estimate max without testing
- Set training percentages
- Track strength progression
- Plan competition attempts

### Training Load Calculator

Calculate recommended training weights based on your 1RM, training volume, and desired intensity.

**How to Use:**
1. After calculating 1RM, scroll to **"Training Load Calculator"**
2. Enter your training parameters:
   - **Sets** - Number of working sets (e.g., 3)
   - **Reps** - Reps per set (e.g., 5)
   - **Intensity** - Choose RIR or RPE scale

3. Select your target intensity:
   - **RIR (Reps in Reserve)** - How many reps are left in the tank
     - RIR 0 = Failure
     - RIR 1-2 = Very hard
     - RIR 3-4 = Moderate effort
   - **RPE (Rate of Perceived Exertion)** - Subjective difficulty
     - RPE 10 = Maximum effort
     - RPE 8-9 = Very hard
     - RPE 6-7 = Moderate

4. Click **"Calculate Training Weight"**

**Results:**
- Recommended training weight for your parameters
- Accounts for fatigue across multiple sets
- Scientifically-backed recommendations

### Exporting Results (Platform Coach Only)

**PDF Export:**
- Click **"Export to PDF"**
- Includes your 1RM estimate
- Shows the full training zone table
- Branded with your logo (if configured)

**CSV Export:**
- Click **"Export to CSV"**
- Useful for tracking in spreadsheets
- Includes all calculated values

---

## Feature 4 - Warm-up Generator

**Availability:** Both Platform Coach and Platform Lifter

A standalone tool for generating warm-up progressions for any exercise.

### How to Use

1. Enter working weight
2. Click **"Generate"**
3. Review the warm-up sets
4. Share the plan if needed

### Use Cases

- Plan warm-ups for training sessions
- Create warm-ups for non-competition lifts
- Teach athletes proper warm-up progressions

---

## Feature 5 - Velocity Profile Tools

**Availability:** Complete Test (both versions) | Generate Profile (Platform Coach only)

Velocity-Based Training (VBT) tools for assessing bar speed and creating velocity profiles.

### Complete VBT Test (Available in Both Versions)

A guided test for athletes to gather VBT data.

**What You Need:**
- Velocity tracking device (e.g., GymAware, Vitruve, Repone)
- Heavy day (testing 1RM and submaximal work)
- 45-60 minutes

**Test Process:**

**1. Setup:**
- Tap **"Velocity Profile"** from the homescreen
- Select **"Complete a Test"**
- Enter your information:
  - Lifter name
  - Exercise (e.g., "Comp Squat")
  - Estimated 1RM for today

**2. Warm-up:**
- The app generates a warm-up plan based on your estimated 1RM
- Follow the progression

**3. Heavy Single:**
- Work up to a heavy single
- Maximum effort with perfect technique
- Record:
  - Actual weight lifted
  - Bar velocity

**4. Back-off Sets:**
- The app calculates four back-off percentages
- For each weight:
  - Perform AMRAP (as many reps as possible)
  - Stop at technical failure
  - Record the velocity of EVERY rep

**5. Export Results:**
- Click **"Export Test Data"**
- Saves as `.vbt` file
- Send to your coach for analysis

**Free Version (Platform Lifter) Note:**
You can complete the test and export the results but they can only be used to generate a velocity profile on Platform Coach.

### Generate Velocity Profile (Platform Coach Only)

For coaches to create athlete profiles from test data.

**How to Use:**

**1. Athlete Information:**
- Tap **"Velocity Profile"** from homescreen
- Select **"Generate a Profile"**
- Enter:
  - Lifter name
  - Exercise
  - Tested 1RM weight
  - 1RM velocity

**2. Import or Input Data:**

**Option A: Import .vbt File**
- If the athlete completed the test using this app
- Click **"Import .vbt File"**
- Select the file
- Data populates automatically

**Option B: Manual Input**
- Click **"Enter Data Manually"**
- For each percentage, enter velocities
- The app averages multiple reps per weight

**3. Generate Profile:**
- Click **"Generate Profile"**
- The app creates an RIR-based velocity chart
- Shows velocity ranges for RIR 0-4

**4. Export:**
- Click **"Export to PDF"**
- Branded profile with velocity targets
- Share with the athlete

**Use Cases:**
- Autoregulate training loads
- Objectively measure fatigue
- Individualise percentage-based programs
- Track velocity across training blocks

---

## Feature 6 - Technique Score Calculator

**Availability:** Platform Coach only

Assess technical consistency under heavy loads using velocity data.

### What is Technique Score?

The Technique Score calculates the **Coefficient of Variation (CV%)** from velocities of multiple heavy singles. Lower CV% = more consistent technique = better technique score.

**Score Categories:**
- **Excellent (CV < 5%)** - World-class consistency
- **Good (CV 5-10%)** - Solid technique under load
- **Needs Improvement (CV > 10%)** - Inconsistent execution

### How to Use

**1. Access the Tool:**
- Tap **"Technique Score"** from the homescreen

**2. Perform Heavy Singles:**
- Select an exercise (squat, bench, deadlift)
- Load 85-95% of 1RM
- Perform 3-5 single reps with maximum effort
- Record bar velocity for each rep using a VBT device

**3. Enter Data:**
- Input velocity for each single
- Minimum 3 reps
- Maximum 5 reps
- Recommendation: Use 5 singles for the most accurate score

**4. Calculate:**
- Click **"Calculate Technique Score"**
- Results display:
  - CV% score
  - Qualitative category
  - Mean velocity
  - Standard deviation

**5. Interpret Results:**

**Excellent (CV < 3%):**
- Highly consistent technique
- Minimal variation between reps
- Indicates a strong motor pattern
- Ready for competition/testing

**Good (CV 3-5%):**
- Generally consistent technique
- Slight variation rep-to-rep
- Continue refining movement
- Suitable for most training

**Needs Improvement (CV > 5%):**
- Inconsistent execution
- Significant rep-to-rep variation
- Focus on technical work
- Not ready for max testing

### Training Implications

The tool provides specific training recommendations based on your score:

**For High CV% (Poor Consistency):**
- Increase technical practice at moderate loads
- Use tempo work to reinforce positions
- Film sets to identify inconsistencies
- Consider deload to refine the technique

**For Low CV% (Good Consistency):**
- Technique is reliable under load
- Safe to pursue PBs
- Continue current technical approach
- Monitor CV% across training blocks

### Export Results (Platform Coach)

- Click **"Export to PDF"**
- Creates a branded report with:
  - Your CV% score and category
  - Individual rep velocities
  - Training recommendations
  - Timestamp for tracking

**Use Cases:**
- Pre-competition technical assessment
- Monitoring technique fatigue
- Evaluating technical changes
- Athlete progress reports

---

## Feature 7 - Game Day Mode

**Availability:** Platform Coach (all planners) | Platform Lifter (Lite planner only)

A simplified, high-contrast interface designed for use during competitions.

### Accessing Game Day Mode

**From Pro Mode Planner:**
1. Create/load your competition plan
2. Scroll to the bottom
3. Click **"Launch Game Day Mode"**

**From Lite Mode:**
1. Build your quick plan
2. Click the **"Launch Game Day Mode"** button
3. Or after generating a plan, see the "Ready for Platform?" section

### Game Day Interface

**Designed for Competition Day:**
- High-contrast display
- Large, tap-friendly buttons
- Minimal distractions
- Works offline

### Using Game Day Mode

**During Warm-ups:**

**View Warm-up Sets:**
- Each lift shows its warm-up progression
- Weights clearly displayed
- Checkboxes next to each set

**Check Off Completed Sets:**
- Tap the checkbox after completing a warm-up
- Visual confirmation keeps you organised
- Scroll between squat/bench/deadlift tabs

**Last-Minute Changes:**
- Tap any warm-up weight to edit
- Useful if you need to adjust on the fly

**During Competition Rounds:**

**View Attempts:**
- Your three attempts displayed clearly
- Current opener, second, and third visible
- Easy to reference between rounds

**Mark Attempt Results:**
- **White Light (Success):** Tap the green checkmark
- **Red Light (Missed):** Tap the red X
- **Pending:** Leave unmarked until completed

**Edit Attempts On-the-Fly:**
- Tap any attempt weight
- Enter new weight if needed
- Useful if things go differently than planned

**Real-time Total:**
- Your current total updates automatically
- Shows only successful lifts
- Visible at the bottom of the screen

### Records Display (Optional)

If you configured records comparison in your plan:
- Records appear at the bottom of Game Day Mode
- Shows relevant records for your weight class
- Compare your attempts to official records
- Updates based on your configured filters

### Exiting Game Day Mode

- Tap **"Exit Game Day Mode"** button
- Returns to your planner
- All edits made during Game Day are saved
- Attempt results remain marked

### Tips for Game Day

**Before Competition:**
- Test Game Day Mode at home
- Ensure offline mode works (airplane mode test)
- Set the screen to not auto-lock
- Charge the device fully

**At the Meet:**
- Keep phone/tablet accessible but secure
- Consider a phone holder or armband
- Have a backup printed PDF (export before meet)
- Bring a portable charger just in case

---

## Extra Features

### PDF Exports

**Desktop PDF:**
- Full-page layout optimised for printing
- Includes all plan details:
  - Lifter info and competition details
  - Equipment settings
  - All three lifts with attempts
  - Complete warm-up progressions
  - Technical cues
  - Records comparison (if configured)
- Checkboxes for marking completed sets/attempts
- Professional branding (custom logos/colours if configured)

**Mobile PDF:**
- Phone-screen optimised layout
- Larger fonts for readability
- Simplified layout
- Same information as the desktop version
- Perfect for viewing on your phone at meets

**How to Export PDF:**
1. Complete your plan in Pro Mode
2. Click **"Export"** section at bottom
3. Choose **"PDF (Desktop)"** or **"PDF (Mobile)"**
4. PDF downloads to your device
5. Print or save for competition day

### CSV Exports

Export your plan data as a spreadsheet.

**What's Included:**
- Lift attempts (1st, 2nd, 3rd)
- Warm-up progressions
- Equipment settings
- Competition details
- Calculated scores

**How to Export CSV:**
1. From Pro Mode planner
2. Click **"Export"** section
3. Choose **"Export to CSV"**
4. Opens in Excel, Google Sheets, or Numbers

**Use Cases:**
- Import into personal tracking spreadsheets
- Share with the coach for feedback
- Maintain historical competition records
- Perform custom analysis

### Branding Customisation (Platform Coach)

Personalise exported PDFs with your own branding.

**Access Branding Settings:**
1. Open Pro Mode planner
2. Click **"Branding & Theming"** section
3. Configure your preferences

**Logo Upload:**
- Click **"Upload Logo"**
- Select image file (PNG, JPG, SVG)
- Logo appears in header of PDF exports
- Good for gyms, coaches, or personal brand

**Color Customization:**
- **Primary Color** - Main header color
- **Secondary Color** - Accent elements
- Use color picker or enter hex codes
- Preview shows how colors will appear

**Saving Branding:**
- Settings saved to browser
- Persist across sessions
- Apply to all future PDF exports
- Each device has independent branding settings

---

## Tips & Best Practices

### Data Management

**Browser Storage:**
- Plans save to the browser's local storage
- Clearing browser data deletes plans
- Each browser/device stores independently
- Not synced across devices automatically

**Backup Strategy:**
- Export important plans as `.plp` files
- Store in cloud (Google Drive, Dropbox)
- Keep PDF copies of active plans
- Regular exports before browser maintenance

**Organisation Tips:**
- Use clear plan names (e.g., "Nationals 2025 - Final")
- Date your plans for easy sorting
- Delete old/test plans regularly
- One plan per competition

### Offline Usage

**Ensuring Offline Functionality:**
- Load the app while online first
- Install as PWA for the best offline experience
- Test offline mode before important events
- All data stored locally works offline

**What Works Offline:**
- All calculation tools
- Saved competition plans
- Game Day Mode
- PDF/CSV exports
- Timer functions

**What Requires Internet:**
- Initial app load (first time)
- Authentication (Platform Coach)
- Records database updates

### Troubleshooting Common Issues

**"Cannot find saved plan":**
- Check if browser data was cleared
- Verify you're using the same browser/device
- Import from `.plp` backup if available

**"Warm-ups not generating":**
- Ensure the opener is entered
- Check if auto-generate is enabled
- Try manual 'generate' button
- Switch warm-up strategy and regenerate

**"PDF export not working":**
- Ensure you're using Platform Coach
- Check browser pop-up settings
- Try a different browser
- Export CSV as an alternative

**"App not working offline":**
- Visit the app online once first
- Install as PWA
- Clear cache and revisit online

**"Game Day Mode button missing":**
- Verify that the plan has attempts entered
- Scroll to the bottom of the planner
- Reload the app if needed

---

## Support & Feedback

### Need Help?
- Review this guide for detailed instructions
- Check the in-app help icons (ⓘ) for context-specific tips

### Found a Bug or Issue?

There are two easy ways to report bugs:

**1. Settings Menu (⚙️)**
- Click the settings gear icon in the top navigation
- Select **"🐛 Report a Bug"**
- Opens GitHub issue form in new tab

**2. Homescreen Footer**
- Look for "Found a bug or have a suggestion? Report it here" link
- Located at the bottom of the homescreen
- Opens GitHub issue form in new tab

**What to Include in Bug Reports:**
- Which app version (Platform Coach or Platform Lifter)
- Which tool/feature you were using
- What you expected to happen vs. what actually happened
- Steps to reproduce the issue
- Browser and device type
- Screenshots if applicable
- Any error messages from browser console (F12)

### Feature Requests & Suggestions
- Use the same bug report links to submit feature requests
- Select "Feature Request" template when prompted
- Describe the problem you're trying to solve
- Explain your proposed solution
- Include use cases and expected benefits

### Why GitHub?
- Track status of your report
- See if others have similar issues
- Get notified when issues are resolved
- No account required to submit (but helpful for follow-up)

---

**Document Version:** 1.0
**Last Updated:** November 2025
**App Version:** 1.0.0

This guide covers all features available as of the latest release. Features and functionality may be added in future updates.

---

*Good luck on the platform!*
