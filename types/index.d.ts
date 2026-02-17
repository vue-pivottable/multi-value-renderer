import type { Component, DefineComponent } from 'vue'

// ============================================================================
// Core Types
// ============================================================================

/**
 * Map of value column names to aggregator names
 * @example { sales: 'Sum', quantity: 'Average' }
 */
export type AggregatorMap = Record<string, string>

/**
 * Aggregator result interface
 */
export interface AggregatorResult {
  push(record: Record<string, any>): void
  value(): any
  format(value: any): string
  numInputs?: number
}

/**
 * Aggregator factory function
 */
export type AggregatorFactory = (
  data?: any,
  rowKey?: string[],
  colKey?: string[]
) => AggregatorResult

/**
 * Aggregator definition
 */
export type Aggregator = (attributes: string[]) => AggregatorFactory

/**
 * Collection of aggregators
 */
export type Aggregators = Record<string, Aggregator>

// ============================================================================
// Multi-Value Aggregator
// ============================================================================

/**
 * Multi-value aggregator result with per-value access
 */
export interface MultiValueAggregatorResult extends AggregatorResult {
  valueOf(valName: string): any
  formatOf(valName: string, value: any): string
  getSubAggregator(valName: string): AggregatorResult | null
}

/**
 * Creates a multi-value aggregator factory
 */
export function createMultiValueAggregator(
  aggregatorMap: AggregatorMap,
  aggregators: Aggregators,
  vals: string[]
): AggregatorFactory

/**
 * Legacy alias for createMultiValueAggregator
 */
export function createMultiAggregator(
  aggregatorMap: AggregatorMap,
  aggregators: Aggregators
): (vals: string[]) => AggregatorFactory

/**
 * Default color scale generator for heatmaps
 */
export function defaultColorScaleGenerator(
  values: number[]
): (value: number) => { backgroundColor: string }

/**
 * Validates an aggregator map configuration
 */
export function validateAggregatorMap(
  aggregatorMap: AggregatorMap,
  aggregators: Aggregators
): {
  valid: boolean
  errors: string[]
}

// ============================================================================
// Renderer Props
// ============================================================================

/**
 * Cell layout options for multi-value display
 */
export type CellLayout = 'vertical' | 'horizontal' | 'compact'

/**
 * Props for the multi-value renderer
 */
export interface MultiValueRendererProps {
  // Data props
  data: any[] | Record<string, any>[] | ((callback: (record: Record<string, any>) => void) => void)
  rows?: string[]
  cols?: string[]
  vals?: string[]

  // Multi-value specific
  aggregatorMap?: AggregatorMap
  aggregators: Aggregators

  // Filter and sort
  valueFilter?: Record<string, Record<string, boolean>>
  sorters?: Record<string, (a: any, b: any) => number> | ((attr: string) => (a: any, b: any) => number)
  derivedAttributes?: Record<string, (record: Record<string, any>) => any>
  rowOrder?: 'key_a_to_z' | 'value_a_to_z' | 'value_z_to_a'
  colOrder?: 'key_a_to_z' | 'value_a_to_z' | 'value_z_to_a'

  // Display options
  rowTotal?: boolean
  colTotal?: boolean
  tableColorScaleGenerator?: (values: number[]) => (value: number) => { backgroundColor: string }
  tableOptions?: {
    clickCallback?: (
      event: MouseEvent,
      value: any,
      filters: Record<string, any>,
      pivotData: any
    ) => void
  }
  localeStrings?: {
    totals?: string
  }
  labels?: Record<string, (value: any) => any>

  // Multi-value display options
  cellLayout?: CellLayout
  showValueLabels?: boolean
  valueLabels?: Record<string, string>
}

// ============================================================================
// Renderer Factory
// ============================================================================

/**
 * Options for creating a multi-value renderer
 */
export interface MultiValueRendererOptions {
  name?: string
}

/**
 * Creates a multi-value table renderer component
 */
export function makeMultiValueRenderer(
  opts?: MultiValueRendererOptions
): DefineComponent<MultiValueRendererProps>

// ============================================================================
// Exports
// ============================================================================

/**
 * Pre-configured multi-value renderers
 */
export const MultiValueRenderers: Record<string, Component>

export default MultiValueRenderers
