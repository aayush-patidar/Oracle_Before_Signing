# OBS RESPONSIVE TEST CHECKLIST

## Testing Date: 2026-01-27
## Tester: _____________

---

## TEST DEVICES & RESOLUTIONS

### Mobile Devices
- [ ] **iPhone SE** (375x667) - Smallest modern iPhone
- [ ] **iPhone 14/15** (390x844) - Standard iPhone with notch
- [ ] **Pixel 5/6** (412x915) - Standard Android
- [ ] **Samsung Galaxy S21** (360x800) - Compact Android

### Tablets
- [ ] **iPad** (768x1024) - Portrait
- [ ] **iPad** (1024x768) - Landscape
- [ ] **iPad Pro 11"** (834x1194) - Portrait
- [ ] **Android Tablet** (800x1280) - Standard tablet

### Laptops
- [ ] **1366x768** - Common laptop resolution
- [ ] **1440x900** - MacBook Air
- [ ] **1920x1080** - Standard HD laptop

### Desktops
- [ ] **1920x1080** - Full HD
- [ ] **2560x1440** - 2K
- [ ] **3840x2160** - 4K

---

## CORE LAYOUT TESTS

### Sidebar Navigation
**Desktop (≥1024px):**
- [ ] Sidebar visible by default
- [ ] Collapse/expand button works
- [ ] Navigation items clickable
- [ ] Role selector visible and functional
- [ ] OBS logo displays correctly

**Mobile (<1024px):**
- [ ] Sidebar hidden by default
- [ ] Hamburger menu button visible in top bar
- [ ] Clicking hamburger opens drawer overlay
- [ ] Backdrop overlay appears
- [ ] Clicking backdrop closes drawer
- [ ] Drawer slides in/out smoothly
- [ ] Navigation items clickable in drawer
- [ ] Clicking nav item closes drawer automatically

### Top Bar
**Desktop:**
- [ ] All elements visible (title, badge, network, RPC, wallet, export, logout)
- [ ] Network dropdown functional
- [ ] Wallet connect button works
- [ ] Export button visible and functional

**Tablet:**
- [ ] Network selector visible
- [ ] RPC status visible
- [ ] Export button visible
- [ ] Logout button visible

**Mobile:**
- [ ] Hamburger menu visible
- [ ] Title truncates properly (no overflow)
- [ ] Policy mode badge hidden
- [ ] Network selector hidden
- [ ] RPC text hidden (dot visible)
- [ ] Export button hidden
- [ ] Logout button hidden
- [ ] Wallet button visible and functional

---

## PAGE-SPECIFIC TESTS

### Overview/Dashboard Page (`/enterprise`)

**Mobile (375px):**
- [ ] Header text readable
- [ ] Metric cards stack vertically (1 column)
- [ ] All 4 metric cards visible
- [ ] Quick action buttons stack vertically
- [ ] Wallet actions card displays correctly
- [ ] Recent alerts list readable
- [ ] System status card displays correctly
- [ ] No horizontal scrolling
- [ ] All text readable (not cut off)

**Tablet (768px):**
- [ ] Metric cards in 2 columns
- [ ] Quick actions in 2 columns
- [ ] Proper spacing between cards
- [ ] Alert cards display well

**Desktop (1920px):**
- [ ] Metric cards in 4 columns
- [ ] Quick actions in 4 columns
- [ ] Layout matches original design
- [ ] No excessive stretching
- [ ] Content centered with max-width

---

### Chat/Oracle Page (`/enterprise/chat`)

**Mobile (375px):**
- [ ] Header displays correctly
- [ ] Status badges wrap if needed
- [ ] Chat window and analysis panels stack vertically
- [ ] Chat window has minimum usable height (400px+)
- [ ] Messages display correctly
- [ ] User messages align right
- [ ] AI messages align left
- [ ] Message bubbles don't overflow
- [ ] Input field visible
- [ ] Input field stays visible when keyboard opens
- [ ] Send button accessible
- [ ] Payment authorization card displays correctly
- [ ] Timeline cards stack vertically
- [ ] Reality Delta card displays correctly
- [ ] No horizontal scrolling

**Tablet (768px):**
- [ ] Header displays correctly
- [ ] Chat and analysis panels stack vertically
- [ ] Both panels have adequate height
- [ ] Messages readable
- [ ] Input accessible

**Desktop (1920px):**
- [ ] Chat window in left column (4/12)
- [ ] Analysis panels in right column (8/12)
- [ ] Timeline and Delta side-by-side (xl breakpoint)
- [ ] Original layout preserved
- [ ] Hover effects work
- [ ] Animations smooth

**Keyboard Behavior (Mobile):**
- [ ] Focusing input brings up keyboard
- [ ] Input field remains visible above keyboard
- [ ] Can scroll messages while keyboard open
- [ ] Submit button accessible with keyboard open

---

### Approvals Page (`/enterprise/approvals`)

**Mobile (375px):**
- [ ] Header displays correctly
- [ ] Risk summary cards stack vertically (1 column)
- [ ] All 4 summary cards visible
- [ ] Bulk action bar displays correctly
- [ ] Table scrolls horizontally
- [ ] Table columns readable when scrolling
- [ ] Checkbox column accessible
- [ ] Action buttons accessible
- [ ] Risk assessment cards stack vertically
- [ ] No content cut off

**Tablet (768px):**
- [ ] Risk summary in 2 columns
- [ ] Table displays well
- [ ] Risk assessment in 2 columns

**Desktop (1920px):**
- [ ] Risk summary in 4 columns
- [ ] Table displays without horizontal scroll
- [ ] All columns visible
- [ ] Original layout preserved

---

## MOBILE-SPECIFIC TESTS

### iPhone Notch/Dynamic Island
- [ ] Content not obscured by notch (iPhone 14/15)
- [ ] Safe area padding applied
- [ ] Top bar clears notch area
- [ ] Bottom navigation clears home indicator

### Android Navigation
- [ ] Content not obscured by system buttons
- [ ] Bottom padding adequate
- [ ] Gesture navigation works

### Touch Targets
- [ ] All buttons minimum 44x44px
- [ ] Easy to tap without zooming
- [ ] No accidental taps on adjacent buttons
- [ ] Hamburger menu easy to tap
- [ ] Navigation items easy to tap

### Orientation Changes
**Portrait → Landscape:**
- [ ] Layout adapts smoothly
- [ ] No content cut off
- [ ] Sidebar behavior correct
- [ ] Chat input remains accessible

**Landscape → Portrait:**
- [ ] Layout adapts smoothly
- [ ] All content visible
- [ ] Scrolling works correctly

---

## INTERACTION TESTS

### Navigation
- [ ] All sidebar links work on mobile
- [ ] Drawer closes after navigation
- [ ] Back button works correctly
- [ ] Deep links work on mobile

### Forms & Inputs
- [ ] Chat input works on mobile
- [ ] Can type in input field
- [ ] Autocomplete doesn't break layout
- [ ] Form validation displays correctly
- [ ] Error messages readable

### Modals & Overlays
- [ ] Modals centered on mobile
- [ ] Modals don't overflow screen
- [ ] Can close modals on mobile
- [ ] Backdrop prevents interaction

### Tables
- [ ] Horizontal scroll works smoothly
- [ ] Scroll indicators visible
- [ ] Can select rows on mobile
- [ ] Action buttons accessible

---

## PERFORMANCE TESTS

### Load Time
- [ ] Initial load < 3s on 3G
- [ ] Page transitions smooth
- [ ] No layout shift on load

### Animations
- [ ] Drawer slide animation smooth (60fps)
- [ ] Hover effects work on desktop
- [ ] No janky animations on mobile
- [ ] Loading states display correctly

### Scrolling
- [ ] Smooth scrolling on all devices
- [ ] No scroll lag
- [ ] Momentum scrolling works (iOS)
- [ ] Overscroll behavior correct

---

## BROWSER COMPATIBILITY

### Chrome Mobile
- [ ] Layout correct
- [ ] All features work
- [ ] No console errors

### Safari iOS
- [ ] Layout correct
- [ ] Safe area respected
- [ ] Keyboard behavior correct
- [ ] No console errors

### Firefox Mobile
- [ ] Layout correct
- [ ] All features work
- [ ] No console errors

### Samsung Internet
- [ ] Layout correct
- [ ] All features work
- [ ] No console errors

---

## VISUAL REGRESSION TESTS

### Design Consistency
- [ ] Colors match original design
- [ ] Typography hierarchy preserved
- [ ] Spacing rhythm consistent
- [ ] Border radius consistent
- [ ] Shadows and effects intact

### Component Integrity
- [ ] Cards look identical to desktop
- [ ] Buttons maintain style
- [ ] Badges display correctly
- [ ] Icons properly sized
- [ ] Gradients render correctly

### Dark Mode
- [ ] Dark theme consistent across breakpoints
- [ ] Contrast ratios maintained
- [ ] No light mode leaks

---

## ACCESSIBILITY TESTS

### Screen Readers
- [ ] VoiceOver works on iOS
- [ ] TalkBack works on Android
- [ ] Semantic HTML preserved
- [ ] ARIA labels correct

### Keyboard Navigation
- [ ] Can tab through all interactive elements
- [ ] Focus indicators visible
- [ ] No keyboard traps
- [ ] Logical tab order

### Color Contrast
- [ ] Text readable on all backgrounds
- [ ] Meets WCAG AA standards
- [ ] Status colors distinguishable

---

## EDGE CASES

### Very Small Screens (320px)
- [ ] Layout doesn't break
- [ ] Content accessible
- [ ] Horizontal scroll minimal

### Very Large Screens (4K)
- [ ] Content doesn't stretch excessively
- [ ] Max-width constraints work
- [ ] Layout remains centered

### Long Content
- [ ] Long transaction hashes wrap/truncate
- [ ] Long addresses display correctly
- [ ] Long messages in chat wrap properly

### Empty States
- [ ] Empty state messages display correctly
- [ ] Icons properly sized
- [ ] Call-to-action buttons accessible

---

## FINAL CHECKS

### No Regressions
- [ ] Desktop experience unchanged
- [ ] All features still work
- [ ] No new bugs introduced
- [ ] Performance not degraded

### Production Ready
- [ ] No console errors
- [ ] No console warnings
- [ ] Build completes successfully
- [ ] No TypeScript errors
- [ ] No ESLint errors

---

## TEST RESULTS SUMMARY

**Total Tests:** _____ / _____
**Passed:** _____
**Failed:** _____
**Blocked:** _____

### Critical Issues Found:
1. ________________________________
2. ________________________________
3. ________________________________

### Minor Issues Found:
1. ________________________________
2. ________________________________
3. ________________________________

### Notes:
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

---

## SIGN-OFF

**Tested By:** _____________________
**Date:** _____________________
**Status:** [ ] APPROVED [ ] NEEDS WORK
**Next Steps:** _____________________

---

## TESTING TIPS

### Using Chrome DevTools
1. Open DevTools (F12)
2. Click device toolbar icon (Ctrl+Shift+M)
3. Select device from dropdown
4. Test at various zoom levels (50%, 75%, 100%, 125%)

### Using Responsive Design Mode (Firefox)
1. Open DevTools (F12)
2. Click responsive design mode (Ctrl+Shift+M)
3. Enter custom dimensions
4. Test orientation changes

### Real Device Testing
- Use BrowserStack or similar for real device testing
- Test on actual phones/tablets when possible
- Check on both iOS and Android

### Network Throttling
- Test on 3G/4G speeds
- Check load times
- Verify images load correctly
