# Platform Coach Freemium Model - Executive Summary

> **NOTE:** This is a historical planning document from the initial architecture phase. The dual deployment freemium model has been **successfully implemented**. For current documentation, see:
> - `README.md` - Complete project overview
> - `DEPLOYMENT.md` - Deployment instructions for both versions
> - `DUAL_DEPLOYMENT_GUIDE.md` - Step-by-step deployment guide

---

# ⚠️ Historical Planning Document

## The Decision You Need to Make

**Question:** Should we use one repo or two repos for the freemium model?

**Answer:** **ONE REPO - Single Codebase** (100% confidence)

### Why Single Repo Wins

```
Business Logic Layer (95% of codebase):
├─ calculator.ts (598 lines) → Doesn't care about auth ✓
├─ exportHandler.ts (904 lines) → Doesn't care about auth ✓
├─ constants.ts (1500 lines) → Doesn't care about auth ✓
└─ Result: Can't separate without massive duplication

UI/Component Layer (5% of codebase):
├─ 41 total components
├─ 36 need ZERO changes
├─ 5 need permission checks (wrap with SubscriptionGate)
└─ Result: Minimal changes, maximum code reuse

Infrastructure:
├─ Single Vercel deployment
├─ One build process
├─ One test suite
├─ No version drift risk
└─ Result: Simpler to maintain

Feature Already Exists:
├─ Competition Planner already has Lite/Pro mode
├─ SubscriptionGate component already built
├─ useSubscription hook already implemented
└─ Result: 70% of infrastructure is ready
```

---

## High-Level Architecture

### Current State (v1)
```
All signed-in users get ALL features
└─ No tier differentiation (Pro features exist but unused)
```

### Target State (v2 - Freemium)
```
Free Tier (No Auth Required)
├─ Competition Planner LITE
├─ Workout Timer (basic modes)
├─ Warm-up Generator
├─ 1RM Calculator (single formula)
└─ PWA offline capability

Free Plan (Signed In)
├─ Everything in free tier
├─ PLUS: Save up to 3 plans
├─ PLUS: 1 PDF export per session
└─ CTA: Upgrade to Pro

Pro Plan (Paid Subscription)
├─ ALL features unlock
├─ Game Day Mode
├─ VBT Tools (Velocity Profile, Technique Score)
├─ Training Load Calculator
├─ Unlimited saves & exports
└─ CSV export
```

---

## What Changes in the Codebase

### Minimal Changes (6 files touched)
1. **index.tsx** - Make Clerk optional (conditional provider)
2. **App.tsx** - Use new permission system
3. **hooks/useSubscription.ts** - Add permission flags
4. **components/SaveLoadSection.tsx** - Gate save buttons
5. **components/OneRepMaxCalculator.tsx** - Lite version for free
6. **components/WorkoutTimer.tsx** - Gate advanced modes

### Unchanged (95% of codebase)
- calculator.ts (all math functions)
- exportHandler.ts (all export logic)
- 36 other components
- Service worker (PWA)
- All business logic

### New Files (1 optional)
- `AuthContext.tsx` - Optional (makes Clerk handling cleaner)

---

## Implementation Timeline

### Recommended: 3 Developer Sprints

**Sprint 1: Foundation (1 week)**
- Make Clerk optional on app load
- Create permission system in useSubscription hook
- Test backward compatibility
- No user-facing changes yet

**Sprint 2: Feature Gating (1 week)**
- Add permission checks to 5 key components
- Implement SubscriptionGate overlays
- Create Lite versions of free-tier tools
- Test free vs. paid flows

**Sprint 3: Clerk & Deployment (1 week)**
- Create plans in Clerk Dashboard
- Add free/pro/enterprise plans
- Test signup flow
- Deploy to staging, then production

**Buffer: 1 week**
- Bug fixes
- Analytics setup
- Edge case testing

---

## Key Statistics

| Metric | Value |
|--------|-------|
| Total Lines of Code | ~3,100 |
| Business Logic (tier-agnostic) | 2,400 lines (77%) |
| UI Components | 700 lines (23%) |
| Files Needing Changes | 6 |
| New Lines of Code (estimate) | ~200 |
| Components Affected | 5 |
| Components Unchanged | 36 |
| Estimated Dev Effort | 3 sprints |
| Risk Level | LOW (existing patterns) |
| Data Loss Risk | NONE (backward compatible) |

---

## What Users Experience

### Day 1: New Unauthenticated User
```
1. Lands on app
2. No login required
3. Tries Competition Planner Lite → Works
4. Tries Workout Timer → Works
5. Tries 1RM Calculator → Works (single formula)
6. Tries to save → "Upgrade for save" CTA
7. Clicks upgrade → Sign-up modal
8. Becomes Free Plan user
```

### Day 1: Existing User (Upgrade)
```
1. Their plans still work (localStorage untouched)
2. Automatically get Pro tier access
3. All features unlock
4. No re-authentication needed
5. No data loss
```

### Day 1: Free Plan User (Signed In, Not Paying)
```
1. Can save 3 plans
2. Can export 1 PDF
3. Can access basic features
4. No Game Day Mode
5. No VBT tools
6. "Upgrade to Pro" CTAs on locked features
```

### Day 1: Pro User (Paid)
```
1. All features unlocked
2. Unlimited saves/exports
3. Game Day Mode available
4. VBT tools available
5. Training Load Calculator
6. CSV exports
7. No upgrade CTAs
```

---

## Risk Assessment

### Risks: LOW

**Potential Issue:** "Breaking existing user flow"
- **Mitigation:** All changes are additive (new permission flags)
- **Rollback:** Easy (just gate features, don't change logic)
- **Testing:** Can test both paths simultaneously

**Potential Issue:** "Users bypass gating"
- **Mitigation:** Gating is at React component level (can't bypass)
- **Verify:** Test with browser dev tools
- **Note:** Server-side validation can be added later

**Potential Issue:** "PWA offline breaks"
- **Mitigation:** Service worker unchanged, localStorage still works
- **Testing:** Existing offline tests pass
- **Benefit:** Free tier gets offline advantage

**Potential Issue:** "Clerk integration fails"
- **Mitigation:** App still works without Clerk (graceful degradation)
- **Fallback:** Can manually set publicMetadata.freeAccess for users
- **Impact:** Only affects paid features, free tier unaffected

### Mitigation Checklist
- [ ] Test in staging first
- [ ] Keep production branch stable
- [ ] Feature flags for early rollout (1% → 10% → 100%)
- [ ] Monitor Clerk quota usage
- [ ] Backup user data before deployment

---

## Financial Projections

### Revenue Model
```
Free Tier
├─ Conversion rate (target): 5-10%
├─ Revenue: $0
└─ Value: User acquisition, offline differentiation

Free Plan ($0)
├─ Lifetime value: $0
├─ Upgrade rate to Pro: 20-30%
└─ Value: User engagement, analytics

Pro Plan ($9-29/month)
├─ Target price: TBD
├─ Target monthly users: 50-100
├─ Potential MRR: $450-2,900/month
├─ Annual: $5,400-34,800
└─ Breakeven users: ~15-20/month at $9

Expected Year 1:
├─ Free users: 1,000+ (accumulative)
├─ Free plan users: 100-200
├─ Pro users: 30-50
├─ MRR: $270-1,450
└─ Annual: $3,240-17,400
```

---

## Features Breakdown by Tier

### Free Tier (Unauthenticated)
1. **Competition Planner LITE** ✓
   - Quick plan generator (name + goal 3rds)
   - No saving
   - One-time PDF export

2. **Workout Timer** ✓ (Basic)
   - Rolling Rest mode
   - Manual Rest mode
   - No custom presets

3. **Warm-up Generator** ✓ (Full)
   - Default warm-up tables
   - Dynamic warm-ups
   - Plate breakdowns
   - Educational tool (monetize via free access)

4. **1RM Calculator** ✓ (Lite)
   - Single "Strength Analytics" formula
   - Training zone table
   - No training load calculator

### Free Plan (Signed In, Free Subscription)
Everything above, PLUS:
- Save/load 3 plans
- 1 PDF export per session (then asks to upgrade)
- No Game Day Mode
- No VBT tools

### Pro Plan (Paid Subscription)
EVERYTHING:
- Competition Planner PRO + LITE
- Game Day Mode
- Unlimited plan saves
- Unlimited PDF/CSV exports
- Training Load Calculator
- 1RM (all formulas: Epley, Brzycki, Strength Analytics, Lombardi)
- Velocity Profile Generator
- Technique Score Calculator
- All timer modes
- Custom timer presets

### Enterprise Plan (Future)
- Everything in Pro
- API access (custom integrations)
- White-label option
- Multiple athlete management
- Custom support

---

## Clerk Configuration Checklist

Before launch, set up in Clerk Dashboard:

```
Step 1: Enable Billing
├─ Monetization → Billing
├─ Enable billing
└─ Connect Stripe account

Step 2: Create Plans
├─ Monetization → Plans
├─ Create "free_plan" (no cost)
├─ Create "pro_plan" ($9-29/month)
└─ Create "enterprise_plan" (custom)

Step 3: Create Features
├─ Monetization → Features
├─ Create "premium_access"
├─ Add to pro_plan ✓
├─ Add to enterprise_plan ✓
└─ Do NOT add to free_plan

Step 4: Configure URLs
├─ Settings → URLs
├─ Add Vercel production URL
├─ Add Vercel staging URL
└─ Add localhost:3000 for dev

Step 5: Test Integration
├─ Sign up for free plan
├─ Sign up for pro plan
├─ Verify has({ plan: 'pro_plan' }) works
└─ Test feature: premium_access
```

---

## Next Actions (Recommended Order)

### This Week
1. [ ] Approve single-repo architecture decision
2. [ ] Review FREEMIUM_ARCHITECTURE.md with team
3. [ ] Assign Sprint 1 development
4. [ ] Create Jira tickets for implementation

### Next Week (During Sprint 1)
1. [ ] Implement Clerk-optional loading
2. [ ] Add permission flags to useSubscription
3. [ ] Test backward compatibility
4. [ ] Merge to feature branch

### Week 3 (During Sprint 2)
1. [ ] Gate SaveLoadSection component
2. [ ] Create OneRepMaxCalculator Lite
3. [ ] Add SubscriptionGate overlays
4. [ ] User testing with free/pro flows

### Week 4 (During Sprint 3)
1. [ ] Create Clerk plans in dashboard
2. [ ] Staging deployment
3. [ ] Integration testing
4. [ ] Production deployment (or next Monday)

### Post-Launch
1. [ ] Monitor free vs. pro signup ratio
2. [ ] Track conversion to paid
3. [ ] Gather user feedback
4. [ ] Iterate on messaging/CTAs

---

## Reference Documents

Three detailed documents have been created:

1. **FREEMIUM_ARCHITECTURE.md** (14 sections, 400+ lines)
   - Current architecture analysis
   - Feature breakdown
   - Deployment configuration
   - Detailed recommendations

2. **FREEMIUM_IMPLEMENTATION_GUIDE.md** (8 phases, 300+ lines)
   - Phase-by-phase implementation
   - Code examples and patterns
   - Clerk setup guide
   - Testing checklist
   - Troubleshooting

3. **ARCHITECTURE_DIAGRAM.txt** (ASCII diagrams)
   - Current state visualization
   - Target state visualization
   - Feature matrix
   - Implementation phases

---

## Key Insight: The PWA Advantage

Platform Coach's existing PWA capability is a **major differentiator** for the free tier:

```
Free Tier (Unique Value Proposition):
├─ Works completely offline
├─ No account needed
├─ No cloud sync required
├─ Perfect for gym use (exactly when you need it!)
├─ Fast performance (cached assets)
└─ Privacy-first (all data stays local)

Marketing Angle:
"Try Platform Coach free, offline-first. 
No account, no cloud sync, no privacy concerns. 
Upgrade for save/sync."
```

This is a genuine feature advantage over competitors who require cloud infrastructure.

---

## Success Criteria

### Launch Targets
- [ ] Zero data loss (backward compatible)
- [ ] Free tier signup rate > 20%
- [ ] Free → Pro conversion > 5%
- [ ] Offline functionality intact
- [ ] All existing users retain Pro access
- [ ] Zero unplanned downtime

### 30-Day Targets
- [ ] 100+ free signups
- [ ] 5-10 pro conversions
- [ ] <1% support ticket rate
- [ ] NPS score > 7.0

### 90-Day Targets
- [ ] 500+ free signups
- [ ] 30-50 pro subscribers
- [ ] $300-500 MRR
- [ ] Feature adoption data collected

---

## Final Recommendation

**Go with Single Repo Freemium Model.**

**Rationale:**
1. 95% of code is tier-agnostic (no duplication needed)
2. Implementation is low-risk (only 5 components gated)
3. Infrastructure already 70% ready
4. PWA offline capability is unique differentiator
5. Maintenance is dramatically easier
6. Users benefit from unified codebase stability

**Timeline:** 3-4 weeks to production launch

**Effort:** 3 developer sprints + 1 QA sprint

**Expected ROI:** Break-even at 15-20 pro users/month at $9/user

---

## Questions to Discuss with Your Team

1. **Pro Tier Pricing:** $9/month, $19/month, or $99/year?
   - Recommendation: $19/month or $179/year (2-month discount)

2. **Free Plan Limits:** Keep 3 saves + 1 PDF export?
   - Recommendation: Yes (creates meaningful upgrade incentive)

3. **Trial Period:** Should free plan have time limit?
   - Recommendation: No limit (engagement-driven, not time-driven)

4. **Cloud Sync:** Include in roadmap?
   - Recommendation: Phase 6 (after freemium is stable)

5. **Analytics:** What metrics matter most?
   - Recommendation: Free signup rate, conversion rate, feature adoption

---

## You Have Everything You Need

The codebase is perfectly positioned. The architecture is clean. The decision is clear.

**Start Sprint 1 next week.**

