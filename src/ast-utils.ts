import type { TSESTree } from '@typescript-eslint/utils'

export function isAwaited(node: TSESTree.CallExpression): boolean {
  return node.parent?.type === 'AwaitExpression'
}

export function isReturned(node: TSESTree.CallExpression): boolean {
  let parent: TSESTree.Node | undefined = node.parent
  while (parent) {
    if (parent.type === 'ReturnStatement') {
      return true
    }
    // Stop searching if we hit a function boundary
    if (parent.type === 'FunctionDeclaration'
      || parent.type === 'FunctionExpression'
      || parent.type === 'ArrowFunctionExpression') {
      break
    }
    parent = parent.parent
  }
  return false
}

export function isInFunction(node: TSESTree.Node): boolean {
  let parent: TSESTree.Node | undefined = node.parent
  while (parent) {
    if (parent.type === 'FunctionDeclaration'
      || parent.type === 'FunctionExpression'
      || parent.type === 'ArrowFunctionExpression') {
      return true
    }
    parent = parent.parent
  }
  return false
}

export function isInAsyncFunction(node: TSESTree.Node): boolean {
  let parent: TSESTree.Node | undefined = node.parent
  while (parent) {
    if (parent.type === 'FunctionDeclaration'
      || parent.type === 'FunctionExpression'
      || parent.type === 'ArrowFunctionExpression') {
      return parent.async === true
    }
    parent = parent.parent
  }
  return false
}

export function isFunctionCall(node: TSESTree.CallExpression, functionName: string): boolean {
  return node.callee.type === 'Identifier' && node.callee.name === functionName
}

export function isAtTopLevel(node: TSESTree.Node): boolean {
  let parent: TSESTree.Node | undefined = node.parent
  while (parent) {
    // Check if we're at the top level of a program (not inside a function)
    if (parent.type === 'Program') {
      return true
    }
    // If we encounter a function, we're not at top level
    if (parent.type === 'FunctionDeclaration'
      || parent.type === 'FunctionExpression'
      || parent.type === 'ArrowFunctionExpression') {
      return false
    }
    parent = parent.parent
  }
  return false
}

export function isCallExpression(node: TSESTree.Node): node is TSESTree.CallExpression {
  return node.type === 'CallExpression'
}

export function isIdentifier(node: TSESTree.Node): node is TSESTree.Identifier {
  return node.type === 'Identifier'
}

export function isMemberExpression(node: TSESTree.Node): node is TSESTree.MemberExpression {
  return node.type === 'MemberExpression'
}

export function isObjectExpression(node: TSESTree.Node): node is TSESTree.ObjectExpression {
  return node.type === 'ObjectExpression'
}

export function isProperty(node: TSESTree.Node): node is TSESTree.Property {
  return node.type === 'Property'
}
