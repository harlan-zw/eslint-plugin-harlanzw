import type { TSESTree } from '@typescript-eslint/utils'
import type { RuleFixer } from '@typescript-eslint/utils/ts-eslint'
import { createEslintRule } from '../utils'
import { defineTemplateBodyVisitor, isVueParser } from '../vue-utils'

export const RULE_NAME = 'nuxt-no-redundant-component-imports'
export type MessageIds = 'redundantComponentImports'
export type Options = []

interface ComponentImport {
  declaration: TSESTree.ImportDeclaration
  importedName: string
  localName: string
  specifier: TSESTree.ImportSpecifier
}

function removeImport(
  fixer: RuleFixer,
  sourceCode: Readonly<{ text: string }>,
  declaration: TSESTree.ImportDeclaration,
) {
  let end = declaration.range[1]
  while (sourceCode.text[end] === ' ' || sourceCode.text[end] === '\t')
    end++

  if (sourceCode.text[end] === '\r' && sourceCode.text[end + 1] === '\n')
    end += 2
  else if (sourceCode.text[end] === '\n')
    end++

  return fixer.removeRange([declaration.range[0], end])
}

export default createEslintRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'disallow #components imports that Nuxt already auto-imports in Vue templates',
    },
    fixable: 'code',
    schema: [],
    messages: {
      redundantComponentImports: 'Remove {{components}} from #components; Nuxt auto-imports components used only in the template.',
    },
  },
  defaultOptions: [],
  create: (context) => {
    if (!context.filename.endsWith('.vue') || !isVueParser(context))
      return {}

    const sourceCode = context.sourceCode
    const importsByDeclaration = new Map<TSESTree.ImportDeclaration, ComponentImport[]>()
    const templateExpressionReferences = new Set<string>()

    const reportRedundantImports = () => {
      for (const [declaration, componentImports] of importsByDeclaration) {
        const redundant = componentImports.filter((componentImport) => {
          if (componentImport.importedName !== componentImport.localName)
            return false
          if (templateExpressionReferences.has(componentImport.localName))
            return false

          const [variable] = sourceCode.getDeclaredVariables(componentImport.specifier as any)
          const references = variable?.references ?? []
          const hasTemplateTagReference = references.some(reference => reference.identifier.parent === componentImport.specifier)
          const hasOtherReference = references.some(reference => reference.identifier.parent !== componentImport.specifier)
          return hasTemplateTagReference && !hasOtherReference
        })

        if (redundant.length === 0)
          continue

        const redundantSpecifiers = new Set(redundant.map(componentImport => componentImport.specifier))
        const components = redundant.map(componentImport => componentImport.localName).join(', ')

        context.report({
          node: declaration,
          messageId: 'redundantComponentImports',
          data: { components },
          fix(fixer) {
            const retained = declaration.specifiers.filter(specifier => !redundantSpecifiers.has(specifier as TSESTree.ImportSpecifier))
            if (retained.length === 0)
              return removeImport(fixer, sourceCode, declaration)

            // Removing one specifier out of several would re-attach any comment
            // between them to the wrong import. Report without fixing instead.
            if (sourceCode.getCommentsInside(declaration).length > 0)
              return null

            const fixes = []
            let groupStart = -1

            for (let index = 0; index <= declaration.specifiers.length; index++) {
              const specifier = declaration.specifiers[index]
              const isRedundant = specifier && redundantSpecifiers.has(specifier as TSESTree.ImportSpecifier)

              if (isRedundant && groupStart === -1) {
                groupStart = index
                continue
              }
              if (isRedundant || groupStart === -1)
                continue

              const first = declaration.specifiers[groupStart]!
              const last = declaration.specifiers[index - 1]!
              const next = declaration.specifiers[index]

              if (next) {
                fixes.push(fixer.removeRange([first.range[0], next.range[0]]))
              }
              else {
                const comma = sourceCode.getTokenBefore(first as any)
                if (!comma || comma.value !== ',')
                  return null
                fixes.push(fixer.removeRange([comma.range[0], last.range[1]]))
              }

              groupStart = -1
            }

            return fixes
          },
        })
      }
    }

    return defineTemplateBodyVisitor(context, {
      Identifier(node) {
        templateExpressionReferences.add(node.name)
      },
      'VElement:exit': function (node) {
        if (node.parent.type === 'VDocumentFragment')
          reportRedundantImports()
      },
    }, {
      ImportDeclaration(node) {
        if (node.source.value !== '#components' || node.importKind === 'type')
          return

        const componentImports = node.specifiers.flatMap((specifier): ComponentImport[] => {
          if (
            specifier.type !== 'ImportSpecifier'
            || specifier.importKind === 'type'
            || specifier.imported.type !== 'Identifier'
          ) {
            return []
          }

          return [{
            declaration: node,
            importedName: specifier.imported.name,
            localName: specifier.local.name,
            specifier,
          }]
        })

        if (componentImports.length > 0)
          importsByDeclaration.set(node, componentImports)
      },
    })
  },
})
