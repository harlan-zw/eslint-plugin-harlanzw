import type { TSESTree } from '@typescript-eslint/utils'
import type { ClassAttribute } from '../design-classes'
import type { TailwindContext } from '../tailwind-context'
import { attributeClasses, baseUtility, createClassBindings, matchesUtility } from '../design-classes'
import { createEslintRule } from '../utils'
import { defineTemplateBodyVisitor } from '../vue-utils'

export interface ComponentStyleOptions {
  /** Nuxt UI primitive whose prop values this wrapper forwards. */
  extends?: string
  /** Props the wrapper intentionally removes from its public API. */
  forbiddenProps?: string[]
  /** Base utility patterns mapped to the prop that owns their style. */
  classProps?: Record<string, string>
  /** Allowed base utilities or complete classes with variants. Replaces the default layout allowance. */
  allow?: string[]
  /** Allowed utilities for individual ui slots. Replaces the component allowance. */
  slots?: Record<string, string[]>
  sizes?: string[]
  /** Appearance prop exposed by a wrapper, such as purpose. */
  appearanceProp?: string
  variants?: string[]
  colors?: string[]
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
export type MessageIds = 'restyle' | 'invalidProp' | 'forbiddenProp'

const LAYOUT = ['m-*', 'mx-*', 'my-*', 'mt-*', 'mr-*', 'mb-*', 'ml-*', 'ms-*', 'me-*', 'w-*', 'min-w-*', 'max-w-*', 'h-full', 'h-auto', 'min-h-*', 'max-h-*', 'self-*', 'justify-self-*', 'order-*', 'col-*', 'row-*', 'grow', 'grow-*', 'shrink', 'shrink-*', 'basis-*']
const SIZES = ['xs', 'sm', 'md', 'lg', 'xl']
const COLORS = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral']
const VARIANTS: Record<string, string[]> = {
  UButton: ['solid', 'outline', 'soft', 'subtle', 'ghost', 'link'],
  UBadge: ['solid', 'outline', 'soft', 'subtle'],
  UInput: ['outline', 'soft', 'subtle', 'ghost', 'none'],
  UTextarea: ['outline', 'soft', 'subtle', 'ghost', 'none'],
  USelect: ['outline', 'soft', 'subtle', 'ghost', 'none'],
  USelectMenu: ['outline', 'soft', 'subtle', 'ghost', 'none'],
  UInputMenu: ['outline', 'soft', 'subtle', 'ghost', 'none'],
  UCheckbox: ['list', 'card'],
  URadioGroup: ['list', 'card', 'table'],
}
const BUILT_INS = [...Object.keys(VARIANTS), 'USwitch', 'UAvatar']
const normalize = (name: string) => name.replace(/-/g, '').toLowerCase()
const strings = { type: 'array', items: { type: 'string' }, uniqueItems: true } as const

function propValues(node: TSESTree.Expression | null | undefined, resolve: (name: string) => TSESTree.Expression | undefined, seen = new Set<string>()): string[] {
  if (!node)
    return []
  if (node.type === 'Literal')
    return typeof node.value === 'string' ? [node.value] : []
  if (node.type === 'TSAsExpression' || node.type === 'TSSatisfiesExpression' || node.type === 'TSNonNullExpression')
    return propValues(node.expression, resolve, seen)
  if (node.type === 'ConditionalExpression')
    return [...propValues(node.consequent, resolve, seen), ...propValues(node.alternate, resolve, seen)]
  if (node.type === 'Identifier' && !seen.has(node.name))
    return propValues(resolve(node.name), resolve, new Set([...seen, node.name]))
  return []
}

interface ResolvedProp { node: TSESTree.Node, values: string[] }
interface ResolvedProps { _tag: 'Known' | 'Unknown', props: Map<string, ResolvedProp> }
type ResolveProp = (name: string) => TSESTree.Expression | undefined

function forgetValues(props: Map<string, ResolvedProp>) {
  for (const [name, prop] of props)
    props.set(name, { ...prop, values: [] })
}

/** Unknown spreads may replace values, but cannot remove an existing prop. */
function objectProps(node: TSESTree.Expression | null | undefined, resolve: ResolveProp, seen = new Set<string>()): ResolvedProps {
  if (!node)
    return { _tag: 'Unknown', props: new Map() }
  if (node.type === 'TSAsExpression' || node.type === 'TSSatisfiesExpression' || node.type === 'TSNonNullExpression')
    return objectProps(node.expression, resolve, seen)
  if (node.type === 'Identifier' && !seen.has(node.name))
    return objectProps(resolve(node.name), resolve, new Set([...seen, node.name]))
  if (node.type !== 'ObjectExpression')
    return { _tag: 'Unknown', props: new Map() }
  const props = new Map<string, ResolvedProp>()
  let tag: ResolvedProps['_tag'] = 'Known'
  for (const property of node.properties) {
    if (property.type === 'SpreadElement') {
      const spread = objectProps(property.argument, resolve, seen)
      if (spread._tag === 'Unknown') {
        forgetValues(props)
        tag = 'Unknown'
      }
      for (const [name, prop] of spread.props) props.set(name, prop)
      continue
    }
    const name = !property.computed && property.key.type === 'Identifier'
      ? property.key.name
      : property.key.type === 'Literal' ? String(property.key.value) : undefined
    if (!name) {
      tag = 'Unknown'
      forgetValues(props)
      continue
    }
    props.set(name, { node: property, values: property.kind === 'init' ? propValues(property.value as TSESTree.Expression, resolve) : [] })
  }
  return { _tag: tag, props }
}

function elementProps(attributes: ClassAttribute[], resolve: (attribute: ClassAttribute) => ResolveProp): Map<string, ResolvedProp> {
  const props = new Map<string, ResolvedProp>()
  for (const attribute of attributes) {
    if (!attribute.directive) {
      props.set(String(attribute.key.name), { node: attribute as unknown as TSESTree.Node, values: attribute.value?.value === undefined ? [] : [attribute.value.value] })
      continue
    }
    if (typeof attribute.key.name === 'string' || attribute.key.name.name !== 'bind')
      continue
    const argument = attribute.key.argument
    if (!argument) {
      const spread = objectProps(attribute.value?.expression, resolve(attribute))
      if (spread._tag === 'Unknown')
        forgetValues(props)
      for (const [name, prop] of spread.props) props.set(name, prop)
    }
    else if (argument.type === 'VIdentifier' && argument.name) {
      props.set(argument.name, { node: attribute as unknown as TSESTree.Node, values: propValues(attribute.value?.expression, resolve(attribute)) })
    }
    else {
      forgetValues(props)
    }
  }
  return props
}

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
                  extends: { type: 'string', enum: BUILT_INS },
                  forbiddenProps: strings,
                  classProps: { type: 'object', additionalProperties: { type: 'string', minLength: 1 } },
                  allow: strings,
                  slots: { type: 'object', additionalProperties: strings },
                  sizes: strings,
                  appearanceProp: { type: 'string', minLength: 1 },
                  variants: strings,
                  colors: strings,
                  message: { type: 'string', minLength: 1 },
                },
              },
            ],
          },
        },
      },
    }],
    messages: { forbiddenProp: '{{component}} does not expose {{prop}}. {{guidance}}', invalidProp: '"{{value}}" is not a supported {{component}} {{prop}}. Use: {{values}}.', restyle: '"{{className}}" overrides {{component}} styling. {{guidance}}' },
  },
  defaultOptions: [{}],
  create(context, [options = {}]) {
    const components = new Map<string, { name: string, options: ComponentStyleOptions }>(
      BUILT_INS
        .map(name => [normalize(name), { name, options: {} }]),
    )
    const theme = context.settings['harlanzw/tailwind'] as TailwindContext | undefined
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
      VElement(element: { name: string, startTag: { attributes: ClassAttribute[] } }) {
        const component = components.get(normalize(element.name))
        if (!component)
          return
        for (const [name, prop] of elementProps(element.startTag.attributes, bindings.resolve)) {
          const appearance = component.options.appearanceProp ?? 'variant'
          const builtin = component.options.extends ?? BUILT_INS.find(name => normalize(name) === normalize(component.name))
          if (typeof name === 'string' && component.options.forbiddenProps?.includes(name)) {
            const guidance = component.options.appearanceProp ? `Use the ${component.options.appearanceProp} prop.` : 'Use the shared component API.'
            context.report({ node: prop.node, messageId: 'forbiddenProp', data: { component: component.name, prop: name, guidance } })
            continue
          }
          const values = name === 'size'
            ? component.options.sizes ?? (builtin ? builtin === 'UAvatar' ? ['3xs', '2xs', ...SIZES, '2xl', '3xl'] : SIZES : undefined)
            : name === appearance
              ? component.options.variants ?? (builtin ? VARIANTS[builtin] : undefined)
              : name === 'color' ? component.options.colors ?? (builtin ? COLORS : undefined) : undefined
          for (const value of new Set(prop.values)) {
            const semanticColor = name === 'color' && builtin && !component.options.colors
              && /^[a-z][a-z0-9-]*$/.test(value) && theme?.compile(`bg-${value}`)?.includes(`var(--ui-${value})`)
            if (values?.length && !values.includes(value) && !semanticColor)
              context.report({ node: prop.node, messageId: 'invalidProp', data: { component: component.name, prop: String(name), value, values: values.join(', ') } })
          }
        }
      },
      VAttribute(attribute: ClassAttribute) {
        const component = components.get(normalize(attribute.parent.parent.name))
        if (!component)
          return
        const builtin = component.options.extends ?? BUILT_INS.find(name => normalize(name) === normalize(component.name))
        for (const finding of attributeClasses(attribute, bindings.resolve(attribute))) {
          if (finding._tag !== 'Static')
            continue
          for (const className of finding.value.split(/\s+/).filter(Boolean)) {
            const utility = baseUtility(className)
            const allowed = (finding.slot && component.options.slots?.[finding.slot]) || component.options.allow || LAYOUT
            if (allowed.some(pattern => matchesUtility(utility, pattern) || matchesUtility(className, pattern)))
              continue
            const sizing = /^(?:p[xytrblse]?|gap(?:-[xy])?|size|[wh]|min-[wh]|max-[wh])-/.test(utility)
              || /^text-(?:xs|sm|base|lg|xl|[2-9]xl)(?:\/.*)?$/.test(utility)
              || /^text-\[(?:length:|[\d.]+(?:px|r?em|vw|vh|%))/.test(utility)
            if (/^text-(?:left|center|right|justify|start|end|wrap|nowrap|balance|pretty|ellipsis|clip)$/.test(utility))
              continue
            const appearanceOverride = /^(?:bg|text|border|ring|outline|shadow|rounded|font|tracking|leading)(?:-|$)/.test(utility)
            const mappedProp = Object.entries(component.options.classProps ?? {}).find(([pattern]) => matchesUtility(utility, pattern))?.[1]
            if (!sizing && !appearanceOverride && !mappedProp)
              continue
            const values = sizing ? component.options.sizes : component.options.variants
            const prop = mappedProp ?? (sizing
              ? builtin || component.options.sizes ? 'size' : undefined
              : /^(?:bg|text)-(?!\[?(?:length|inherit))/.test(utility) ? component.options.appearanceProp ?? (builtin ? VARIANTS[builtin] ? 'color or variant' : 'color' : undefined) : undefined)
            const guidance = component.options.message
              ?? `${prop ? `Use the ${prop} prop${!mappedProp && values?.length ? `: ${values.join(', ')}` : ''}. ` : ''}See ${options.source ?? 'app/app.config.ts'} for shared styling.`
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
          const imported = specifier.type === 'ImportSpecifier'
            ? (specifier.imported.type === 'Identifier' ? specifier.imported.name : specifier.imported.value)
            : specifier.type === 'ImportDefaultSpecifier' ? source.split('/').pop()?.replace(/\.vue$/, '') : undefined
          if (!imported) {
            if (!nuxtImport && !configured.has(local))
              components.delete(local)
            continue
          }
          const importedName = normalize(imported)
          const component = nuxtImport || configured.has(importedName)
            ? definitions.get(importedName) ?? (source !== '#components' && nuxtImport ? definitions.get(normalize(`U${imported}`)) : undefined)
            : undefined
          if (!nuxtImport && !component && !configured.has(local))
            components.delete(local)
          if (component && !configured.has(local))
            components.set(local, component)
        }
      },
    })
  },
})
