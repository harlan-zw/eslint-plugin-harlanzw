<template>
  <div>
    <h1>ESLint Plugin Harlanzw - Playground</h1>
    
    <h2>Link Rules</h2>
    <ul>
      <li>
        <NuxtLink to="/link-ascii-only">
          link-ascii-only
        </NuxtLink>
      </li>
      <li>
        <NuxtLink to="/link-lowercase">
          link-lowercase
        </NuxtLink>
      </li>
      <li>
        <NuxtLink to="/link-no-double-slashes">
          link-no-double-slashes
        </NuxtLink>
      </li>
      <li>
        <NuxtLink to="/link-no-whitespace">
          link-no-whitespace
        </NuxtLink>
      </li>
    </ul>

    <h2>Nuxt Rules</h2>
    <ul>
      <li>
        <NuxtLink to="/nuxt-await-navigate-to">
          nuxt-await-navigate-to
        </NuxtLink>
      </li>
      <li>
        <NuxtLink to="/redundant-import-meta-demo">
          nuxt-no-redundant-import-meta
        </NuxtLink>
      </li>
      <li>
        <NuxtLink to="/nuxt-no-side-effects-in-async-data-handler">
          nuxt-no-side-effects-in-async-data-handler
        </NuxtLink>
      </li>
      <li>
        <NuxtLink to="/nuxt-no-side-effects-in-setup">
          nuxt-no-side-effects-in-setup
        </NuxtLink>
      </li>
      <li>
        <NuxtLink to="/nuxt-prefer-navigate-to-over-router-push-replace">
          nuxt-prefer-navigate-to-over-router-push-replace
        </NuxtLink>
      </li>
      <li>
        <NuxtLink to="/nuxt-prefer-nuxt-link-over-router-link">
          nuxt-prefer-nuxt-link-over-router-link
        </NuxtLink>
      </li>
    </ul>

    <h2>Vue Rules</h2>
    <ul>
      <li>
        <NuxtLink to="/vue-no-faux-composables">
          vue-no-faux-composables
        </NuxtLink>
      </li>
      <li>
        <NuxtLink to="/vue-no-nested-reactivity">
          vue-no-nested-reactivity
        </NuxtLink>
      </li>
      <li>
        <NuxtLink to="/vue-no-passing-refs-as-props">
          vue-no-passing-refs-as-props
        </NuxtLink>
      </li>
      <li>
        <NuxtLink to="/vue-no-reactive-destructuring">
          vue-no-reactive-destructuring
        </NuxtLink>
      </li>
      <li>
        <NuxtLink to="/vue-no-ref-access-in-templates">
          vue-no-ref-access-in-templates
        </NuxtLink>
      </li>
      <li>
        <NuxtLink to="/vue-no-torefs-on-props">
          vue-no-torefs-on-props
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
