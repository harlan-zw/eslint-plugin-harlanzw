import { unindent as $ } from 'eslint-vitest-rule-tester'
import { run } from './_test'
import rule, { RULE_NAME } from './nuxt-no-side-effects-in-setup'

run({
  name: RULE_NAME,
  rule,
  valid: [
    // setTimeout inside onMounted is fine
    $`
      onMounted(() => {
        const timer = setTimeout(() => {
          console.log('tick')
        }, 1000)
        
        onUnmounted(() => {
          clearTimeout(timer)
        })
      })
    `,
    // setInterval inside onMounted is fine
    $`
      onMounted(() => {
        const timer = setInterval(() => {
          console.log('interval tick')
        }, 1000)
        
        onUnmounted(() => {
          clearInterval(timer)
        })
      })
    `,
    // setTimeout inside other functions is fine
    $`
      function handleClick() {
        setTimeout(() => {
          console.log('delayed action')
        }, 500)
      }
    `,
    // setInterval inside other functions is fine
    $`
      function handleClick() {
        setInterval(() => {
          console.log('interval action')
        }, 500)
      }
    `,
    // setTimeout inside arrow functions is fine
    $`
      const delay = () => {
        setTimeout(() => {
          console.log('arrow delay')
        }, 1000)
      }
    `,
    // setTimeout inside async functions is fine
    $`
      async function asyncDelay() {
        setTimeout(() => {
          console.log('async delay')
        }, 1000)
      }
    `,
    // setTimeout inside nested functions is fine
    $`
      function outerFunction() {
        return function innerFunction() {
          setTimeout(() => {
            console.log('nested delay')
          }, 1000)
        }
      }
    `,
    // setTimeout inside composable function is fine
    $`
      function useTimer() {
        function startTimer() {
          setTimeout(() => {
            console.log('composable timer')
          }, 1000)
        }
        return { startTimer }
      }
    `,
    // Other function calls in setup (non-side effects)
    $`
      const router = useRouter()
      const route = useRoute()
      const count = ref(0)
      console.log('setup code')
    `,
    // setTimeout with immediate function call (IIFE) - still inside a function
    $`
      (function() {
        setTimeout(() => {
          console.log('IIFE timer')
        }, 1000)
      })()
    `,
    // requestAnimationFrame inside functions is fine
    $`
      function animate() {
        requestAnimationFrame(() => {
          console.log('animation frame')
        })
      }
    `,
    // Observer inside onMounted is fine
    $`
      onMounted(() => {
        const observer = new IntersectionObserver((entries) => {
          console.log(entries)
        })
        
        onUnmounted(() => {
          observer.disconnect()
        })
      })
    `,
    // WebSocket inside functions is fine
    $`
      function connectWebSocket() {
        const ws = new WebSocket('ws://localhost:8080')
        return ws
      }
    `,
    // Multiple observers inside functions are fine
    $`
      function setupObservers() {
        const resizeObserver = new ResizeObserver(() => {})
        const mutationObserver = new MutationObserver(() => {})
        return { resizeObserver, mutationObserver }
      }
    `,
  ],
  invalid: [
    // setTimeout at top level in Vue script setup
    {
      code: $`
        const timer = setTimeout(() => {
          console.log('tick')
        }, 1000)
      `,
      output: $`
        onMounted(() => {
          const timer = setTimeout(() => {
          console.log('tick')
        }, 1000)

          onUnmounted(() => {
            clearTimeout(timer)
          })
        })
      `,
      errors: [{
        messageId: 'noSideEffectsInSetup',
        data: { functionName: 'setTimeout' },
      }],
    },
    // setInterval at top level in Vue script setup
    {
      code: $`
        const timer = setInterval(() => {
          console.log('interval tick')
        }, 1000)
      `,
      output: $`
        onMounted(() => {
          const timer = setInterval(() => {
          console.log('interval tick')
        }, 1000)

          onUnmounted(() => {
            clearInterval(timer)
          })
        })
      `,
      errors: [{
        messageId: 'noSideEffectsInSetup',
        data: { functionName: 'setInterval' },
      }],
    },
    // setTimeout without variable assignment
    {
      code: $`
        setTimeout(() => {
          console.log('side effect')
        }, 1000)
      `,
      output: $`
        onMounted(() => {
          const timer = setTimeout(() => {
          console.log('side effect')
        }, 1000)

          onUnmounted(() => {
            clearTimeout(timer)
          })
        })
      `,
      errors: [{
        messageId: 'noSideEffectsInSetup',
        data: { functionName: 'setTimeout' },
      }],
    },
    // setInterval without variable assignment
    {
      code: $`
        setInterval(() => {
          console.log('interval side effect')
        }, 1000)
      `,
      output: $`
        onMounted(() => {
          const timer = setInterval(() => {
          console.log('interval side effect')
        }, 1000)

          onUnmounted(() => {
            clearInterval(timer)
          })
        })
      `,
      errors: [{
        messageId: 'noSideEffectsInSetup',
        data: { functionName: 'setInterval' },
      }],
    },
    // Multiple setTimeout calls at top level
    {
      code: $`
        const timer1 = setTimeout(() => {
          console.log('timer1')
        }, 1000)
        
        const timer2 = setInterval(() => {
          console.log('timer2')
        }, 2000)
      `,
      errors: [
        {
          messageId: 'noSideEffectsInSetup',
          data: { functionName: 'setTimeout' },
        },
        {
          messageId: 'noSideEffectsInSetup',
          data: { functionName: 'setInterval' },
        },
      ],
    },
    // setTimeout in top-level conditional
    {
      code: $`
        if (someCondition) {
          setTimeout(() => {
            console.log('conditional timer')
          }, 1000)
        }
      `,
      errors: [{
        messageId: 'noSideEffectsInSetup',
        data: { functionName: 'setTimeout' },
      }],
    },
    // setTimeout in top-level try-catch
    {
      code: $`
        try {
          setTimeout(() => {
            console.log('try timer')
          }, 1000)
        } catch (error) {
          console.error(error)
        }
      `,
      errors: [{
        messageId: 'noSideEffectsInSetup',
        data: { functionName: 'setTimeout' },
      }],
    },
    // setTimeout in top-level block
    {
      code: $`
        {
          const timer = setTimeout(() => {
            console.log('block timer')
          }, 1000)
        }
      `,
      errors: [{
        messageId: 'noSideEffectsInSetup',
        data: { functionName: 'setTimeout' },
      }],
    },
    // setTimeout mixed with other setup code
    {
      code: $`
        const router = useRouter()
        const count = ref(0)
        
        setTimeout(() => {
          count.value++
        }, 1000)
        
        watch(count, (newVal) => {
          console.log('Count changed:', newVal)
        })
      `,
      errors: [{
        messageId: 'noSideEffectsInSetup',
        data: { functionName: 'setTimeout' },
      }],
    },
    // setTimeout with complex callback
    {
      code: $`
        setTimeout(async () => {
          const data = await fetch('/api/data')
          const result = await data.json()
          console.log(result)
        }, 2000)
      `,
      errors: [{
        messageId: 'noSideEffectsInSetup',
        data: { functionName: 'setTimeout' },
      }],
    },
    // setTimeout in a Vue SFC script setup context
    {
      code: $`
        const isLoading = ref(true)
        const data = ref(null)
        
        // This timer should be in onMounted
        setTimeout(() => {
          isLoading.value = false
          data.value = 'loaded'
        }, 3000)
        
        const compute = computed(() => {
          return data.value?.toUpperCase()
        })
      `,
      errors: [{
        messageId: 'noSideEffectsInSetup',
        data: { functionName: 'setTimeout' },
      }],
    },
    // requestAnimationFrame at top level
    {
      code: $`
        const animationId = requestAnimationFrame(() => {
          console.log('animate')
        })
      `,
      output: $`
        onMounted(() => {
          const timer = requestAnimationFrame(() => {
          console.log('animate')
        })

          onUnmounted(() => {
            cancelAnimationFrame(timer)
          })
        })
      `,
      errors: [{
        messageId: 'noSideEffectsInSetup',
        data: { functionName: 'requestAnimationFrame' },
      }],
    },
    // IntersectionObserver at top level
    {
      code: $`
        const observer = new IntersectionObserver((entries) => {
          console.log('intersection', entries)
        })
      `,
      output: $`
        onMounted(() => {
          const observer = new IntersectionObserver((entries) => {
          console.log('intersection', entries)
        })

          onUnmounted(() => {
            observer.disconnect()
          })
        })
      `,
      errors: [{
        messageId: 'noSideEffectsInSetup',
        data: { functionName: 'IntersectionObserver' },
      }],
    },
    // WebSocket at top level
    {
      code: $`
        const ws = new WebSocket('ws://localhost:8080')
      `,
      output: $`
        onMounted(() => {
          const connection = new WebSocket('ws://localhost:8080')

          onUnmounted(() => {
            connection.close()
          })
        })
      `,
      errors: [{
        messageId: 'noSideEffectsInSetup',
        data: { functionName: 'WebSocket' },
      }],
    },
    // Multiple different side effects
    {
      code: $`
        const timer = setTimeout(() => console.log('timer'), 1000)
        const observer = new ResizeObserver(() => console.log('resize'))
        const frame = requestAnimationFrame(() => console.log('frame'))
      `,
      errors: [
        {
          messageId: 'noSideEffectsInSetup',
          data: { functionName: 'setTimeout' },
        },
        {
          messageId: 'noSideEffectsInSetup',
          data: { functionName: 'ResizeObserver' },
        },
        {
          messageId: 'noSideEffectsInSetup',
          data: { functionName: 'requestAnimationFrame' },
        },
      ],
    },
  ],
})
