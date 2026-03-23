import { createPromptRuleTester } from '../_test'
import rule from './deslop-false-dichotomy'

const ruleTester = createPromptRuleTester()

ruleTester.run('harlanzw/ai-deslop-false-dichotomy', rule, {
  valid: [
    'Nuxt provides server-side rendering.',
    'Make sure it\'s not null before proceeding.',
    'Check that it\'s working correctly.',
    '```\nIt\'s not a bug — it\'s a feature.\n```',
    'The value is not zero.',
    '`google.maps.Marker` is not scheduled to be discontinued yet, but will only receive bug fixes for major regressions. At least 12 months notice will be given before support is discontinued.',
  ],
  invalid: [
    {
      code: 'It\'s not a framework — it\'s a compiler.',
      errors: [{ messageId: 'falseDichotomy' }],
    },
    {
      code: 'it\'s not about speed, it\'s about correctness.',
      errors: [{ messageId: 'falseDichotomy' }],
    },
    {
      code: 'It\'s not just a library; it\'s a paradigm shift.',
      errors: [{ messageId: 'falseDichotomy' }],
    },
    {
      code: '- It\'s not complexity — it\'s power.',
      errors: [{ messageId: 'falseDichotomy' }],
    },
    {
      code: 'It\'s not just a compliance requirement; it is the primary metadata for **Visual Search**.',
      errors: [{ messageId: 'falseDichotomy' }],
    },
    {
      code: 'As of 2025, adhering to these best practices is no longer just about passing a Lightouse audit - it\'s about survival in an AI-driven search landscape.',
      errors: [{ messageId: 'falseDichotomy' }],
    },
    {
      code: 'Developers add `loading="lazy"` to all images as a "best practice." It\'s not. It\'s a targeted optimization for specific images.',
      errors: [{ messageId: 'falseDichotomy' }],
    },
    {
      code: 'They\'re not a hierarchy; they\'re independent axes combined into a single score.',
      errors: [{ messageId: 'falseDichotomy' }],
    },
    {
      code: 'This is not a limitation; this is a feature.',
      errors: [{ messageId: 'falseDichotomy' }],
    },
    // we're/we are subjects
    {
      code: 'We\'re not building a framework; we\'re building a compiler.',
      errors: [{ messageId: 'falseDichotomy' }],
    },
    {
      code: 'We are not replacing the old system, we are reimagining it.',
      errors: [{ messageId: 'falseDichotomy' }],
    },
    // you're/you are subjects
    {
      code: 'You\'re not writing CSS — you\'re writing utility classes.',
      errors: [{ messageId: 'falseDichotomy' }],
    },
    {
      code: 'You are not debugging code; you are debugging assumptions.',
      errors: [{ messageId: 'falseDichotomy' }],
    },
    // contraction_not: isn't/aren't/wasn't/weren't ... about ... it's/is about
    {
      code: 'Performance isn\'t just about speed, it\'s about perceived responsiveness.',
      errors: [{ messageId: 'falseDichotomy' }],
    },
    {
      code: 'These metrics aren\'t about vanity, it\'s about real user impact.',
      errors: [{ messageId: 'falseDichotomy' }],
    },
    {
      code: 'The migration wasn\'t about modernization; it\'s about compliance.',
      errors: [{ messageId: 'falseDichotomy' }],
    },
    {
      code: 'Accessibility isn\'t about checking boxes, is about inclusive design.',
      errors: [{ messageId: 'falseDichotomy' }],
    },
    // no longer pattern: is/it's/was no longer ... it's/is
    {
      code: 'SEO is no longer about keywords; it\'s about intent.',
      errors: [{ messageId: 'falseDichotomy' }],
    },
    {
      code: 'It\'s no longer enough to just ship fast, it\'s about shipping right.',
      errors: [{ messageId: 'falseDichotomy' }],
    },
    {
      code: 'The API was no longer stable, it\'s now deprecated.',
      errors: [{ messageId: 'falseDichotomy' }],
    },
  ],
})
