# HNC Contacts Frontend

Micro-frontend for contact/participant management.

## Quick Reference

| Aspect | Value |
|--------|-------|
| **Type** | MF Remote |
| **Dev Port** | 5172 |
| **Accent Color** | Teal (#14b8a6) |
| **Backend API** | https://hncms-contacts.scarif-0.duckdns.org |
| **MF Plugin** | @module-federation/vite |

## Module Federation

### Exposed Modules

```typescript
// vite.config.ts exposes:
exposes: {
  './App': './src/App.tsx',
  './ContactsPage': './src/routes/contacts.tsx',
}
```

### CSS Injection

Uses `vite-plugin-css-injected-by-js` to bundle CSS into remoteEntry.js for MF compatibility.

## Accent Color (MF Identity)

```css
/* index.css - Teal identity */
:root {
  --mf-accent: 173 80% 40%;
  --mf-accent-foreground: 0 0% 100%;
}
.dark {
  --mf-accent: 174 62% 47%;
}
```

Use `text-mf-accent`, `bg-mf-accent/10` - NOT hardcoded Tailwind colors.

## Commands

```bash
pnpm dev          # Start dev server (port 5172)
pnpm build        # Build for production
pnpm typecheck    # TypeScript checking
pnpm test         # Playwright tests
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Contacts backend URL |

## Feature Mapping

- **Feature**: F10 (Contacts)

## Key Patterns

- **SidePanel**: Uses react-resizable-panels for detail views
- **Dropdowns**: Uses @radix-ui/react-dropdown-menu
- **Toasts**: Uses sonner for notifications

## Agents

| Agent | When to Invoke |
|-------|----------------|
| **hnc-fe** | React patterns, component questions |
| **fe-master** | Feature coordination |
| **hnc-be** | Contacts API contract |

## Notes

- Part of HNC V3 micro-frontend architecture
- Runs inside hnc-shell in production
- See `sidecars/hnc-fe/styling-guide.md` for MF CSS patterns
