# 001. Fix Double Expense Submission Bug

Date: 2026-02-13 | Status: accepted

## Context

The expenses page (`/expenses`) had a critical bug where clicking the "Add expense" button created 2 expense records instead of 1. This was caused by a race condition in form submission.

The expense form used React 19's native `<form action={handleSubmit}>` pattern with Server Actions, but the submit button had no mechanism to prevent multiple submissions. When users clicked the button, the async Server Action would execute, but the button remained enabled. If clicked again (or double-clicked), it would trigger a second submission before the first completed, resulting in duplicate database records.

## Problem Details

- **Location**: `src/app/(dashboard)/expenses/expense-form.tsx`
- **Pattern**: Form used React 19's `action` prop with Server Action `createExpense`
- **Root cause**: Submit button had no `disabled` state tied to form submission pending state
- **Impact**: Duplicate expense records in database, incorrect financial tracking

Example of the vulnerable code:
```tsx
<form action={handleSubmit}>
  {/* form fields */}
  <Button type="submit">Добавить</Button>
</form>
```

## Decision

Implement React 19's `useFormStatus` hook to track form pending state and automatically disable the submit button during submission.

**Solution pattern**:
1. Create a `SubmitButton` component that uses `useFormStatus()` from `react-dom`
2. The hook provides `pending` state that is `true` while the form action is executing
3. Disable the button when `pending === true`
4. Show "Добавление..." text during submission for user feedback
5. Replace the inline submit button with the new `SubmitButton` component

**Implementation**:
```tsx
function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Добавление...' : 'Добавить'}
    </Button>
  )
}
```

## Consequences

### Positive
- Prevents duplicate expense submissions
- Provides clear visual feedback during form submission (disabled button, loading text)
- Uses React 19's built-in form state management (no external state needed)
- Simple, idiomatic pattern that aligns with Next.js 16 + React 19 best practices
- Self-documenting: `useFormStatus` clearly signals intent to handle async form state

### Negative
- Requires extracting submit button into separate component (React constraint: `useFormStatus` must be called within a component that is a child of `<form>`)
- Other forms in the codebase have the same vulnerability and need similar fixes

## Technical Notes

**Why `useFormStatus` must be in a child component**:
React 19's `useFormStatus` hook can only read the pending state of a parent `<form>`. It must be called from a component rendered inside the form tree, not from the component that renders the `<form>` itself.

**Server Action flow**:
1. User clicks submit → `pending` becomes `true`
2. Button disables, text changes to "Добавление..."
3. Server Action executes (`createExpense` in `src/lib/actions/expenses.ts`)
4. Action calls `revalidatePath('/expenses')` on success
5. Form submission completes → `pending` becomes `false`
6. Page re-renders with new expense in the table

## Follow-up Work

The following forms have the same vulnerability and should be updated with the same pattern:

- `src/app/(dashboard)/clients/client-form.tsx`
- `src/app/(dashboard)/inventory/ingredient-form.tsx`
- `src/app/(dashboard)/inventory/purchase-form.tsx`
- `src/app/(dashboard)/recipes/recipe-form.tsx`
- `src/app/(dashboard)/production/production-form.tsx`
- `src/app/(dashboard)/orders/order-form.tsx`

**Recommendation**: Create a shared `<SubmitButton>` component in `src/components/ui/submit-button.tsx` to avoid duplication across all forms.

## Files Changed

- `src/app/(dashboard)/expenses/expense-form.tsx` — added `useFormStatus` import, created `SubmitButton` component, replaced inline button

## References

- [React 19 useFormStatus documentation](https://react.dev/reference/react-dom/hooks/useFormStatus)
- [Next.js Server Actions and Mutations](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
