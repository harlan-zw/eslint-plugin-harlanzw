# ESLint Plugin Harlanzw - Playground

This is a StackBlitz playground showcasing the ESLint rules from `eslint-plugin-harlanzw`.

## Features

This playground demonstrates 5 Vue-specific ESLint rules:

1. **vue-no-faux-composables** - Functions starting with "use" should actually be composables
2. **vue-no-nested-reactivity** - Avoid nested reactive objects that can cause performance issues
3. **vue-no-passing-refs-as-props** - Don't pass refs directly as props to components
4. **vue-no-ref-access-in-templates** - Access ref values correctly in templates
5. **vue-no-torefs-on-props** - Avoid using toRefs on the entire props object

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## StackBlitz

Open this playground in StackBlitz to see the ESLint rules in action and experiment with the code examples.

Each page shows:
- ❌ Wrong examples that trigger ESLint errors
- ✅ Correct examples following best practices
- 💡 Live interactive demonstrations

## ESLint Configuration

The playground is configured with ESLint rules enabled to show errors for incorrect patterns. Check `eslint.config.js` to see the configuration.
