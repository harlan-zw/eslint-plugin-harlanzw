export const STRENGTH_PATTERNS: Record<string, readonly string[]> = {
  strong: ['never', 'must', 'always', 'under no circumstances', 'absolutely', 'required', 'mandatory', 'forbidden', 'prohibited'],
  medium: ['should', 'avoid', 'prefer', 'recommended', 'expected', 'generally', 'typically'],
  weak: ['try to', 'consider', 'when appropriate', 'if possible', 'might', 'could', 'may want to', 'optionally'],
}

export const WEAK_TO_STRONG: Record<string, string> = {
  'try to': 'Always',
  'consider': 'Must',
  'when appropriate': 'Always',
  'if possible': 'Must',
  'might': 'Will',
  'could': 'Must',
  'may want to': 'Must',
  'optionally': 'Always',
}

export const AMBIGUOUS_QUANTIFIERS: readonly string[] = [
  'a few',
  'some',
  'sometimes',
  'occasionally',
  'often',
  'many',
  'several',
  'various',
  'numerous',
]

export const QUANTIFIER_SUGGESTIONS: Record<string, string> = {
  'a few': '2-3',
  'some': 'specific',
  'sometimes': 'in specific cases',
  'occasionally': 'in ~10% of cases',
  'often': 'in most cases',
  'many': '10+',
  'several': '5-7',
  'various': 'the following specific',
  'numerous': '10+',
}

export const CHARS_PER_TOKEN = 4

export const VAGUE_TERMS: readonly string[] = [
  'appropriate',
  'professional',
  'good',
  'bad',
  'nice',
  'proper',
  'suitable',
  'reasonable',
  'adequate',
]

export const COMMON_CONTEXT_VARIABLES = new Set([
  'user_input',
  'user_name',
  'context',
  'input',
  'query',
  'message',
  'date',
  'time',
  'user',
  'file',
  'selection',
  'language',
  'workspace',
  'repo',
  'branch',
])

export const PROMPT_FILES = [
  '**/CLAUDE.md',
  '**/.claude/**/*.md',
  '**/AGENTS.md',
  '**/.github/copilot-instructions.md',
  '**/.cursorrules',
  '**/.cursor/rules/**/*.md',
  '**/.cursor/rules/**/*.mdc',
  '**/SKILL.md',
  '**/.windsurfrules',
  '**/.clinerules',
  '**/.goose/instructions.md',
  '**/.amp/RULES.md',
  '**/*.prompt',
  '**/*.prompt.md',
]

export const SKILL_ALLOWED_FIELDS = ['name', 'description', 'license', 'allowed-tools', 'metadata', 'compatibility'] as const
export const SKILL_REQUIRED_FIELDS = ['name', 'description'] as const
export const SKILL_NAME_PATTERN = /^[a-z0-9-]+$/
export const SKILL_NAME_RESERVED = ['claude', 'anthropic'] as const
export const SKILL_NAME_MAX_LENGTH = 64
export const SKILL_DESCRIPTION_MAX_LENGTH = 1024
export const SKILL_COMPATIBILITY_MAX_LENGTH = 500
export const SKILL_FILES = ['**/SKILL.md']

export const INEFFICIENT_PHRASES: Record<string, string> = {
  'in order to': 'To',
  'due to the fact that': 'Because',
  'at this point in time': 'Now',
  'in the event that': 'If',
  'for the purpose of': 'To',
  'with regard to': 'About',
  'in regard to': 'About',
  'it is important to note that': '',
  'it should be noted that': '',
  'as a matter of fact': '',
  'on the other hand': 'Alternatively',
  'in addition to': 'Besides',
  'in spite of the fact that': 'Despite',
  'at the present time': 'Now',
}
