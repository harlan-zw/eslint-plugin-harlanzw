import type { TSESTree } from '@typescript-eslint/utils'
import type { ClassAttribute } from '../design-classes'
import { attributeClasses, baseUtility, createClassBindings, matchesUtility } from '../design-classes'
import { createEslintRule } from '../utils'
import { defineTemplateBodyVisitor } from '../vue-utils'

export interface ComponentStyleOptions {
  /** Allowed base utilities. Replaces the default layout allowance. */
  allow?: string[]
  /** Allowed utilities for individual ui slots. Replaces the component allowance. */
  slots?: Record<string, string[]>
  sizes?: string[]
  variants?: string[]
  message?: string
}

export interface NuxtUiDesignOptions {
  /** File named in repair guidance. This file is not executed or parsed. */
  source?: string
  /** Component names match both PascalCase and kebab-case. False disables a component. */
  components?: Record<string, ComponentStyleOptions | false>
}

export const RULE_NAME = 'nuxt-ui-no-restyle'
export type Options = [NuxtUiDesignOptions?]
export type MessageIds = 'restyle'

const LAYOUT = ['m-*', 'mx-*', 'my-*', 'mt-*', 'mr-*', 'mb-*', 'ml-*', 'ms-*', 'me-*', 'w-full', 'w-auto', 'self-*', 'justify-self-*', 'order-*', 'col-*', 'row-*', 'grow', 'grow-*', 'shrink', 'shrink-*', 'basis-*']
const normalize = (name: string) => name.replace(/-/g, '').toLowerCase()
const strings = { type: 'array', items: { type: 'string' }, uniqueItems: true } as const

export default createEslintRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: { description: 'Keep Nuxt UI component appearance in props and shared component styling' },
    schema: [{
      type: 'object',
      additionalProperties: false,
      properties: {
        source: { type: 'string', minLength: 1 },
        components: {
          type: 'object',
          additionalProperties: {
            anyOf: [
              { type: 'boolean', enum: [false] },
              {
                type: 'object',
                additionalProperties: false,
                properties: {
                  allow: strings,
                  slots: { type: 'object', additionalProperties: strings },
                  sizes: strings,
                  variants: strings,
                  message: { type: 'string', minLength: 1 },
                },
              },
            ],
          },
        },
      },
    }],
    messages: { restyle: '"{{className}}" overrides {{component}} styling. {{guidance}}' },
  },
  defaultOptions: [{}],
  create(context, [options = {}]) {
    const components = new Map<string, { name: string, options: ComponentStyleOptions }>([
      ['ubutton', { name: 'UButton', options: {} }],
      ['ubadge', { name: 'UBadge', options: {} }],
    ])
    const configured = new Set(Object.keys(options.components ?? {}).map(normalize))
    for (const [name, config] of Object.entries(options.components ?? {})) {
      if (config === false)
        components.delete(normalize(name))
      else
        components.set(normalize(name), { name, options: config })
    }
    const definitions = new Map(components)
    const bindings = createClassBindings(context.sourceCode)
    return defineTemplateBodyVisitor(context, {
      VAttribute(attribute: ClassAttribute) {
        const component = components.get(normalize(attribute.parent.parent.name))
        if (!component)
          return
        for (const finding of attributeClasses(attribute, bindings.resolve(attribute))) {
          if (finding._tag !== 'Static')
            continue
          for (const className of finding.value.split(/\s+/).filter(Boolean)) {
            const utility = baseUtility(className)
            const allowed = (finding.slot && component.options.slots?.[finding.slot]) || component.options.allow || LAYOUT
            if (allowed.some(pattern => matchesUtility(utility, pattern)))
              continue
            const sizing = /^(?:p[xytrblse]?|gap(?:-[xy])?|size|[wh]|min-[wh]|max-[wh])-/.test(utility)
            const values = sizing ? component.options.sizes : component.options.variants
            const prop = sizing ? 'size' : 'color or variant'
            const guidance = component.options.message
              ?? `Use the ${prop} prop${values?.length ? `: ${values.join(', ')}` : ''}. See ${options.source ?? 'app/app.config.ts'} for shared styling.`
            context.report({ node: finding.node, messageId: 'restyle', data: { className, component: component.name, guidance } })
          }
        }
      },
    }, {
      ...bindings.visitors,
      ImportDeclaration(node: TSESTree.ImportDeclaration) {
        if (node.importKind === 'type')
          return
        const source = node.source.value
        const nuxtImport = source === '@nuxt/ui' || source.startsWith('@nuxt/ui/') || source === '#components'
        for (const specifier of node.specifiers) {
          if (specifier.type === 'ImportSpecifier' && specifier.importKind === 'type')
            continue
          const local = normalize(specifier.local.name)
          if (!nuxtImport) {
            if (!configured.has(local))
              components.delete(local)
            continue
          }
          const imported = specifier.type === 'ImportSpecifier'
            ? (specifier.imported.type === 'Identifier' ? specifier.imported.name : specifier.imported.value)
            : specifier.type === 'ImportDefaultSpecifier' ? source.split('/').pop()?.replace(/\.vue$/, '') : undefined
          if (!imported)
            continue
          const component = definitions.get(normalize(imported)) ?? (source !== '#components' ? definitions.get(normalize(`U${imported}`)) : undefined)
          if (component && !configured.has(local))
            components.set(local, component)
        }
      },
    })
  },
})
