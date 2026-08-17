# Writing Vue AST Rules

Vue SFC support comes from `vue-eslint-parser`. These are the patterns that aren't obvious from the parser's docs.

## Parser detection and setup

```typescript
import { defineTemplateBodyVisitor, isVueParser } from '../vue-utils'

export default createEslintRule({
  create(context) {
    if (isVueParser(context as any)) {
      const scriptVisitor = {
        // script section
      }

      const templateVisitor = {
        // template section
      }

      return defineTemplateBodyVisitor(context, templateVisitor, scriptVisitor)
    }

    // .ts/.js fallback
    return {}
  }
})
```

## Parser behaviours that bite

- **Element names are lowercase.** `<RouterLink>` arrives as `routerlink`.
- **Both visitors are required.** Passing only a template visitor to `defineTemplateBodyVisitor` causes parser errors.
- **Template nodes are `VElement`, `VAttribute`, `VExpressionContainer`**, not regular JS AST nodes.
- **Null checks.** Check `node.init` before touching its properties.

## Template visitors

```typescript
const templateVisitor = {
  VElement(node: any) {
    if (node.name === 'routerlink') { // lowercase, not 'RouterLink'
      // …
    }
  },

  VAttribute(node: any) {
    // :prop, @click, …
  },

  VExpressionContainer(node: any) {
    // {{ }} and v-bind values
  }
}
```

## Dual file type support

Rules that cover both Vue SFC templates and JSX/TSX have to handle the casing difference:

<!-- eslint-skip -->
```typescript
create(context) {
  if (isVueParser(context as any)) {
    return defineTemplateBodyVisitor(context, {
      VElement(node: any) {
        if (node.name === 'routerlink') { // lowercase
          context.report(/* … */)
        }
      }
    }, {})
  }

  return {
    JSXElement(node: any) {
      if (node.openingElement?.name?.name === 'RouterLink') { // PascalCase
        context.report(/* … */)
      }
    }
  }
}
```

## Testing

Vue SFC tests need `filename: 'test.vue'`, or the parser never engages.

```typescript
import { runVue } from './_test'

runVue({
  name: 'rule-name (Vue SFC)',
  rule,
  valid: [
    {
      code: `
        <template>
          <NuxtLink to="/page">Valid</NuxtLink>
        </template>
      `,
      filename: 'test.vue',
    },
  ],
  invalid: [
    {
      code: `
        <template>
          <RouterLink to="/page">Invalid</RouterLink>
        </template>
      `,
      filename: 'test.vue',
      errors: [{ messageId: 'errorId' }],
      output: `
        <template>
          <NuxtLink to="/page">Fixed</NuxtLink>
        </template>
      `,
    },
  ],
})
```

## Reference implementation

`src/rules/nuxt-prefer-nuxt-link-over-router-link.ts` covers parser detection, lowercase element names, both visitors, SFC plus JSX, and tests for both file types.
