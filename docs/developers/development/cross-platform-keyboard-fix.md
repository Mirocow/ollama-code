# Cross-platform Keyboard Navigation Fix

## Summary
Refactored keyboard handling to work consistently across Windows, macOS, and Linux.

## Problem
The original code had issues with:
1. **"y" key not working** - Users pressing "y" to confirm tool calls had no response
2. **Different key codes across platforms** - Windows reports `enter` while Unix reports `return`
3. **Case sensitivity** - Some terminals report uppercase letters
4. **Missing quick keys** - No way to quickly confirm/reject with single keystroke

## Solution

### 1. Added Key Normalization (`normalizeKeyName`)
- Normalizes `enter`/`return` → `return` (cross-platform)
- Normalizes `escape`/`esc` → `escape`
- Normalizes letter keys to lowercase (`Y` → `y`, `N` → `n`)

### 2. Added Quick Keys Support
New `enableQuickKeys` option in selection lists:
- `y` → Select first option (typically "Yes")
- `n` → Select last option (typically "No")
- Works on all platforms

### 3. Platform-Aware Key Detection
```typescript
// Works on all platforms
isConfirmKey(name, sequence)  // Returns true for Enter/Return, 'y', 'Y'
isRejectKey(name, sequence)  // Returns true for Escape, 'n', 'N'
isUpKey(name, sequence)      // Returns true for Arrow Up, 'k'
isDownKey(name, sequence)    // Returns true for Arrow Down, 'j'
```

## Files Changed

### Core Changes
- `packages/cli/src/ui/hooks/useSelectionList.ts` - Added cross-platform key handling
- `packages/cli/src/ui/components/shared/BaseSelectionList.tsx` - Added `enableQuickKeys` prop
- `packages/cli/src/ui/components/shared/RadioButtonSelect.tsx` - Added `enableQuickKeys` prop
- `packages/cli/src/ui/components/messages/ToolConfirmationMessage.tsx` - Enabled quick keys

### Tests Added
- `packages/cli/src/ui/hooks/__tests__/useSelectionList.test.ts` - 21 tests for cross-platform handling

## Usage

### For Confirmation Dialogs
```tsx
<RadioButtonSelect
  items={options}
  onSelect={handleSelect}
  enableQuickKeys={true}  // Enable y/n keys
/>
```

### Keyboard Shortcuts
| Key | Action | Platform |
|-----|--------|----------|
| `y` | Confirm (first option) | All |
| `n` | Reject (last option) | All |
| `Enter`/`Return` | Select current option | All |
| `Escape` | Cancel | All |
| `↑`/`k` | Navigate up | All |
| `↓`/`j` | Navigate down | All |
| `1-9` | Quick select by number | All |

## Testing

```bash
# Run tests
pnpm test packages/cli/src/ui/hooks/__tests__/useSelectionList.test.ts

# All 21 tests pass
✓ normalizeKeyName - return/enter keys across platforms
✓ normalizeKeyName - escape keys
✓ normalizeKeyName - backspace keys
✓ normalizeKeyName - letter keys to lowercase
✓ isConfirmKey - Enter/Return keys
✓ isConfirmKey - y key (both cases)
✓ isRejectKey - Escape key
✓ isRejectKey - n key (both cases)
✓ isUpKey - arrow and vim keys
✓ isDownKey - arrow and vim keys
✓ Cross-platform scenarios - Windows Enter
✓ Cross-platform scenarios - macOS/Linux Return
✓ Cross-platform scenarios - quick confirmation
✓ Cross-platform scenarios - vim navigation
```

## Platform Compatibility Matrix

| Feature | Windows | macOS | Linux |
|---------|---------|-------|-------|
| `y` key confirm | ✅ | ✅ | ✅ |
| `n` key reject | ✅ | ✅ | ✅ |
| Enter/Return | ✅ | ✅ | ✅ |
| Escape | ✅ | ✅ | ✅ |
| Arrow keys | ✅ | ✅ | ✅ |
| Vim keys (j/k) | ✅ | ✅ | ✅ |
| Numeric select | ✅ | ✅ | ✅ |
