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

// NOTE: For renderers, import directly from /vue2 or /vue3 subpath
// This avoids bundler issues with shared chunks
