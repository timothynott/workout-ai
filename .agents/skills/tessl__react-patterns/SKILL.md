---
name: react-patterns
description: >-
  React patterns to ALWAYS apply in every React component — error boundaries,
  loading/error/empty states, accessible markup, proper hooks, controlled forms,
  stable keys, and correct memoization. Apply these proactively without being
  asked.
keywords: react, react hooks, react component, usestate, useeffect, react
  context, react forms, react error boundary, react performance, react memo,
  react typescript, react patterns, controlled component, accessibility, aria,
  useCallback, useMemo, stale closure
license: MIT
---

# React Patterns — Always Apply

These patterns must be applied **proactively in every React component you write**, even when the user does not ask for them. They are not optional extras — they are the baseline for production-quality React code.

---

## 1. Error Boundaries — Always Wrap Route-Level Components

Every page or route-level component MUST be wrapped in an error boundary. Do not wait to be asked. If a component renders data, it needs an error boundary above it.

Error boundaries must be class components:

```typescript
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) { return { error }; }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Component error:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return this.props.fallback || (
        <div role="alert">
          <h2>Something went wrong</h2>
          <button onClick={() => this.setState({ error: null })}>Try again</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Always wrap at route/page level
<ErrorBoundary fallback={<p>Dashboard unavailable</p>}>
  <Dashboard />
</ErrorBoundary>
```

The fallback UI MUST use `role="alert"` so screen readers announce the error.

---

## 2. Loading, Error, and Empty States — Always Handle All Three

Never render only the happy path. Every component that fetches data MUST handle:
- **Loading state**: Show a loading indicator while data is being fetched
- **Error state**: Show an error message with a retry action
- **Empty state**: Show a meaningful message when data is empty
- **Success state**: Render the data

```typescript
function MenuPage() {
  const { menu, loading, error } = useMenu();

  if (loading) return <p>Loading menu...</p>;
  if (error) return <div role="alert"><p>{error}</p><button onClick={retry}>Retry</button></div>;
  if (menu.length === 0) return <p>No menu items available.</p>;

  return <MenuList items={menu} />;
}
```

Always clear error state on successful fetch (`setError(null)`).

---

## 3. Accessible Markup — Always Include

These are mandatory on every component, not just when accessibility is mentioned.

### Error announcements

Use `role="alert"` on ANY element whose content appears dynamically to communicate an error or warning:

```typescript
// ALWAYS do this
{error && (
  <div role="alert">
    <p>{error}</p>
    <button onClick={onRetry}>Retry</button>
  </div>
)}
```

### Form inputs — full accessibility attributes

Every required form input MUST have all three attributes:

```typescript
<label htmlFor="email">Email</label>
<input
  id="email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  aria-required="true"
  aria-invalid={!!errors.email}
  aria-describedby={errors.email ? 'email-error' : undefined}
/>
{errors.email && <span id="email-error" role="alert">{errors.email}</span>}
```

### Dynamic content

Use `aria-live="polite"` on containers whose content updates without a page navigation:

```typescript
<div aria-live="polite">
  {loading ? <p>Loading...</p> : <p>{results.length} results found</p>}
</div>
```

---

## 4. Controlled Forms with Validation

Every form MUST use:
- Controlled inputs (`value` + `onChange`)
- `e.preventDefault()` on submit
- `noValidate` on the `<form>` element
- Client-side validation with inline error messages
- All accessibility attributes from section 3

```typescript
function OrderForm({ onSubmit }: OrderFormProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    setError('');
    onSubmit({ customerName: name.trim() });
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <label htmlFor="customer-name">Your name</label>
      <input
        id="customer-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        aria-required="true"
        aria-invalid={!!error}
        aria-describedby={error ? 'name-error' : undefined}
      />
      {error && <span id="name-error" role="alert">{error}</span>}
      <button type="submit">Place Order</button>
    </form>
  );
}
```

---

## 5. Key Props in Lists — Never Use Index

Always use a stable unique identifier from the data as the `key` prop. Never use the array index:

```typescript
// WRONG — index as key breaks when items reorder, insert, or delete
{items.map((item, index) => (
  <ItemCard key={index} item={item} />
))}

// ALWAYS do this — stable unique identifier from the data
{items.map(item => (
  <ItemCard key={item.id} item={item} />
))}
```

---

## 6. Memoization — Only When Needed, But Complete

`React.memo`, `useCallback`, and `useMemo` only work when used together. Apply the full pattern when a parent re-renders frequently and passes props to child components:

```typescript
// Parent component
function Dashboard({ widgets }: { widgets: Widget[] }) {
  const sortedWidgets = useMemo(
    () => [...widgets].sort((a, b) => a.priority - b.priority),
    [widgets]
  );

  const handleRefresh = useCallback((id: string) => {
    setRefreshing(prev => new Set(prev).add(id));
  }, []);

  return sortedWidgets.map(w => (
    <MemoizedWidget key={w.id} widget={w} onRefresh={handleRefresh} />
  ));
}

// Child MUST be wrapped in React.memo for useCallback to matter
const MemoizedWidget = React.memo(function Widget({ widget, onRefresh }: WidgetProps) {
  return (
    <div>
      <h3>{widget.title}</h3>
      <button onClick={() => onRefresh(widget.id)}>Refresh</button>
    </div>
  );
});
```

### When NOT to memoize
- Component re-renders infrequently
- Computation is trivial
- Callback is only passed to native DOM elements (not React.memo children)

### Common mistakes
```typescript
// WRONG — useCallback with no memoized child
const handleClick = useCallback(() => { doSomething(); }, []);
return <button onClick={handleClick}>Click</button>;

// WRONG — React.memo defeated by inline object prop
<MemoizedWidget config={{ theme: 'dark' }} />

// RIGHT — stabilize object props with useMemo
const config = useMemo(() => ({ theme: 'dark' }), []);
<MemoizedWidget config={config} />
```

---

## 7. useEffect — Avoid Pitfalls

### No objects or functions in dependency arrays

```typescript
// WRONG — new object every render causes infinite loop
const options = { serverUrl: 'https://localhost:1234', roomId };
useEffect(() => { ... }, [options]);

// RIGHT — move object creation inside the effect, depend on primitives
useEffect(() => {
  const options = { serverUrl: 'https://localhost:1234', roomId };
  const connection = createConnection(options);
  connection.connect();
  return () => connection.disconnect();
}, [roomId]);
```

### Never use useEffect for derived state

```typescript
// WRONG — extra render cycle
const [total, setTotal] = useState(0);
useEffect(() => {
  setTotal(items.reduce((sum, i) => sum + i.price, 0));
}, [items]);

// RIGHT — compute during render
const total = useMemo(
  () => items.reduce((sum, i) => sum + i.price, 0),
  [items]
);
```

### Use functional updater in intervals and async callbacks

```typescript
// WRONG — stale closure
setCount(count + 1);

// RIGHT
setCount(c => c + 1);
```

### Always return cleanup from effects with subscriptions

```typescript
useEffect(() => {
  let cancelled = false;
  async function load() {
    const res = await fetch('/api/data');
    const data = await res.json();
    if (!cancelled) setData(data);
  }
  load();
  return () => { cancelled = true; };
}, []);
```

---

## 8. Component Structure

Always apply:
- Props typed with TypeScript interfaces (not `any`)
- Function components (classes only for error boundaries)
- One component per file for non-trivial components
- Destructure props in the function signature

---

## Checklist — Apply to Every React Component

- [ ] Error boundary wrapping route-level / page-level components
- [ ] `role="alert"` on all dynamically-appearing error messages
- [ ] Loading, error, empty, and success states for data-fetching components
- [ ] `aria-required="true"` on all required form inputs
- [ ] `aria-invalid` bound to error state on form inputs
- [ ] `aria-describedby` linking inputs to their error message elements
- [ ] `aria-live="polite"` on dynamically updating content regions
- [ ] Stable unique keys on list items (not array index)
- [ ] Controlled form inputs with `noValidate` and `e.preventDefault()`
- [ ] `useCallback` only for functions passed to `React.memo` children
- [ ] `React.memo` children don't receive inline objects/arrays/functions
- [ ] `useMemo` for derived data passed to memoized children
- [ ] No objects or functions in useEffect dependency arrays
- [ ] No useEffect to compute derived state
- [ ] Functional updater form in intervals and async callbacks
- [ ] useEffect cleanup function prevents state updates after unmount
- [ ] Props typed with TypeScript interfaces, no `any`

## References

- [useEffect — Removing unnecessary object dependencies](https://react.dev/reference/react/useEffect#removing-unnecessary-object-dependencies)
- [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)
- [useCallback — Usage](https://react.dev/reference/react/useCallback#usage)
- [React.memo — Minimizing props changes](https://react.dev/reference/react/memo#minimizing-props-changes)
- [Rendering Lists — Why React needs keys](https://react.dev/learn/rendering-lists#why-does-react-need-keys)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)

## Verifiers

- [react-dashboard](../../verifiers/react-dashboard.json) — Dashboard page with data fetching
- [react-todo-list](../../verifiers/react-todo-list.json) — Todo list with add, toggle, delete
- [react-profile-form](../../verifiers/react-profile-form.json) — User profile edit form
- [react-inventory-table](../../verifiers/react-inventory-table.json) — Inventory table with sorting and filtering
- [react-notification-feed](../../verifiers/react-notification-feed.json) — Notification feed with polling
