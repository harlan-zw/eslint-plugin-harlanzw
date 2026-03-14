import { run, runVue } from './_test'
import rule, { RULE_NAME } from './nuxt-ui-prefer-shorthand-css'

// JSX tests
run({
  name: RULE_NAME,
  rule,
  valid: [
    // Shorthand forms — no errors
    { code: `const cls = 'text-default'` },
    { code: `const cls = 'bg-elevated'` },
    { code: `const cls = 'border-default'` },
    { code: `const cls = 'text-muted bg-muted'` },
    // Opacity modifier — must keep var() form
    { code: `const cls = 'bg-[var(--ui-bg-elevated)]/5'` },
    { code: `const cls = 'bg-[var(--ui-bg-muted)]/50'` },
    { code: `const cls = 'bg-[var(--ui-bg-accented)]/50'` },
    // Cross-token usage (bg using border var) — not in our replacement map
    { code: `const cls = 'bg-[var(--ui-border)]'` },
    // Non-string code
    { code: `const x = 42` },
  ],
  invalid: [
    // text
    {
      code: `const cls = 'text-[var(--ui-text)]'`,
      output: `const cls = 'text-default'`,
      errors: [{ messageId: 'preferShorthand' }],
    },
    {
      code: `const cls = 'text-[var(--ui-text-highlighted)]'`,
      output: `const cls = 'text-highlighted'`,
      errors: [{ messageId: 'preferShorthand' }],
    },
    {
      code: `const cls = 'text-[var(--ui-text-toned)]'`,
      output: `const cls = 'text-toned'`,
      errors: [{ messageId: 'preferShorthand' }],
    },
    // bg
    {
      code: `const cls = 'bg-[var(--ui-bg)]'`,
      output: `const cls = 'bg-default'`,
      errors: [{ messageId: 'preferShorthand' }],
    },
    {
      code: `const cls = 'bg-[var(--ui-bg-elevated)]'`,
      output: `const cls = 'bg-elevated'`,
      errors: [{ messageId: 'preferShorthand' }],
    },
    {
      code: `const cls = 'bg-[var(--ui-bg-muted)]'`,
      output: `const cls = 'bg-muted'`,
      errors: [{ messageId: 'preferShorthand' }],
    },
    // border
    {
      code: `const cls = 'border-[var(--ui-border)]'`,
      output: `const cls = 'border-default'`,
      errors: [{ messageId: 'preferShorthand' }],
    },
    {
      code: `const cls = 'border-[var(--ui-border-accented)]'`,
      output: `const cls = 'border-accented'`,
      errors: [{ messageId: 'preferShorthand' }],
    },
    // Multiple in one string — both fixed in single pass
    {
      code: `const cls = 'text-[var(--ui-text)] bg-[var(--ui-bg)]'`,
      output: `const cls = 'text-default bg-default'`,
      errors: [
        { messageId: 'preferShorthand' },
        { messageId: 'preferShorthand' },
      ],
    },
    // Mixed with opacity — only non-opacity flagged
    {
      code: `const cls = 'bg-[var(--ui-bg-elevated)] hover:bg-[var(--ui-bg-elevated)]/50'`,
      output: `const cls = 'bg-elevated hover:bg-[var(--ui-bg-elevated)]/50'`,
      errors: [{ messageId: 'preferShorthand' }],
    },
    // Template literal
    {
      code: 'const cls = `text-[var(--ui-text)]`',
      output: 'const cls = `text-default`',
      errors: [{ messageId: 'preferShorthand' }],
    },
  ],
})

// Vue SFC tests
runVue({
  name: `${RULE_NAME} (vue)`,
  rule,
  valid: [
    // Shorthand in template
    { code: `<template><div class="text-default bg-elevated border-default" /></template>` },
    // Opacity modifier preserved
    { code: `<template><div class="bg-[var(--ui-bg-elevated)]/5" /></template>` },
    // Dynamic class with opacity
    { code: `<template><div :class="'bg-[var(--ui-bg-accented)]/50'" /></template>` },
  ],
  invalid: [
    // Static class attribute
    {
      code: `<template><div class="text-[var(--ui-text)] p-4" /></template>`,
      output: `<template><div class="text-default p-4" /></template>`,
      errors: [{ messageId: 'preferShorthand' }],
    },
    // Dynamic :class with string literal
    {
      code: `<template><div :class="'border-[var(--ui-border)]'" /></template>`,
      output: `<template><div :class="'border-default'" /></template>`,
      errors: [{ messageId: 'preferShorthand' }],
    },
    // Ternary in :class
    {
      code: `<template><div :class="active ? 'bg-[var(--ui-bg-elevated)]' : 'text-dimmed'" /></template>`,
      output: `<template><div :class="active ? 'bg-elevated' : 'text-dimmed'" /></template>`,
      errors: [{ messageId: 'preferShorthand' }],
    },
    // Script string literal
    {
      code: `<script setup>const cls = 'bg-[var(--ui-bg)]'</script><template><div /></template>`,
      output: `<script setup>const cls = 'bg-default'</script><template><div /></template>`,
      errors: [{ messageId: 'preferShorthand' }],
    },
  ],
})
