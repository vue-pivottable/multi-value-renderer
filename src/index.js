/**
 * @vue-pivottable/multi-value-renderer
 *
 * Multi-value aggregator renderer for vue-pivottable.
 * Supports both Vue 2 and Vue 3.
 *
 * @example Vue 2
 * import { MultiValueRenderers } from '@vue-pivottable/multi-value-renderer/vue2'
 *
 * @example Vue 3
 * import { MultiValueRenderers } from '@vue-pivottable/multi-value-renderer/vue3'
 */

// Core utilities (Vue-agnostic)
export * from './core'

// Default export uses Vue 3
// For Vue 2, import from '@vue-pivottable/multi-value-renderer/vue2'
export { MultiValueRenderers, makeMultiValueRenderer } from './vue3'
