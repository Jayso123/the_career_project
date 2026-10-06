# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

## Database

Run `supabase/migrations/0001_init.sql` in the Supabase SQL editor. Admins cannot change roles via the API; promote one with `update public.profiles set role='admin' where id='<uid>'` in the SQL editor. Insert leads without `.select()` (anon cannot read them back).

## EmailJS setup

To enable owner notification emails:

1. Create an [EmailJS](https://www.emailjs.com) service
2. Create a template with template fields `{{to_email}}`, `{{reply_to}}`, `{{subject}}`, and `{{message}}`
   - The template's "To email" field must be set to `{{to_email}}`
3. Fill the following environment variables in `.env`:
   - `VITE_EMAILJS_SERVICE_ID` – your EmailJS service ID
   - `VITE_EMAILJS_TEMPLATE_ID` – your EmailJS template ID
   - `VITE_EMAILJS_PUBLIC_KEY` – your EmailJS public key
   - `VITE_OWNER_EMAIL` – the owner's email address (recipient of notifications)
4. Restart the dev server after editing `.env`
