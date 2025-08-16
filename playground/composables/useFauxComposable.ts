// This will trigger vue-no-faux-composables ESLint error
export function useStaticValue(): { value: string } {
  return { value: 'static' } // not reactive
}

export function useCounter(): { count: number, increment: () => void } {
  let count = 0 // not reactive
  return {
    count,
    increment: () => count++,
  }
}

export function useTimestamp(): { timestamp: number } {
  return { timestamp: Date.now() } // static value
}

export function useConfig(): { apiUrl: string, timeout: number } {
  const config = {
    apiUrl: 'https://api.example.com',
    timeout: 5000,
  }
  return config // plain object, not reactive
}
