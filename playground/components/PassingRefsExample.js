import { ref } from 'vue'

// This will trigger vue-no-passing-refs-as-props error
const data = {
  count: ref(0),
  message: ref('Hello'),
}

const template = html`<ChildComponent :count="${data.count}" :message="${data.message}" />`
