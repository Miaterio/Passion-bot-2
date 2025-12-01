/**
 * Centralized Layout Logging Utility
 * 
 * Provides standardized logging for layout measurements and diagnostics.
 * Features:
 * - Prefix tags for filtering
 * - Visual indicators (✓/✗/⚠)
 * - Comparison helpers
 * - Conditional logging (dev only)
 */

type LogLevel = 'info' | 'warn' | 'error';
type LogTag = 'PAGE' | 'CHAT' | 'HEADER' | 'INPUT' | 'MESSAGES' | 'BOUNCE' | 'SAFE-AREA' | 'KEYBOARD' | 'LAYOUT-SHIFT' | 'SUMMARY';

interface LogOptions {
  expected?: number;
  actual?: number;
  match?: boolean;
  unit?: string;
}

const isDev = process.env.NODE_ENV === 'development';

/**
 * Color codes for console output
 */
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

/**
 * Get color for log tag
 */
function getTagColor(tag: LogTag): string {
  const colorMap: Record<LogTag, string> = {
    PAGE: colors.blue,
    CHAT: colors.cyan,
    HEADER: colors.magenta,
    INPUT: colors.magenta,
    MESSAGES: colors.green,
    BOUNCE: colors.yellow,
    'SAFE-AREA': colors.cyan,
    KEYBOARD: colors.yellow,
    'LAYOUT-SHIFT': colors.red,
    SUMMARY: colors.green,
  };
  return colorMap[tag] || colors.reset;
}

/**
 * Format a value with optional comparison
 */
function formatValue(value: number | string, options?: LogOptions): string {
  const { expected, unit = 'px', match } = options || {};
  const valueStr = typeof value === 'number' ? `${value}${unit}` : value;
  
  if (expected !== undefined) {
    const matchStr = match !== undefined 
      ? (match ? ' ✓' : ' ✗')
      : (value === expected ? ' ✓' : ' ✗');
    return `${valueStr} (expected: ${expected}${unit})${matchStr}`;
  }
  
  return valueStr;
}

/**
 * Main logging function
 */
export function logLayout(
  tag: LogTag,
  data: Record<string, any>,
  level: LogLevel = 'info'
): void {
  if (!isDev) return;
  
  const tagColor = getTagColor(tag);
  const prefix = `${tagColor}[${tag}]${colors.reset}`;
  
  console.group(prefix);
  
  Object.entries(data).forEach(([key, value]) => {
    if (typeof value === 'object' && value !== null && 'value' in value) {
      // Handle structured data with options
      const formatted = formatValue(value.value, value as LogOptions);
      console.log(`  ${key}: ${formatted}`);
    } else {
      console.log(`  ${key}: ${value}`);
    }
  });
  
  console.groupEnd();
}

/**
 * Log a comparison between expected and actual values
 */
export function logComparison(
  tag: LogTag,
  label: string,
  expected: number,
  actual: number,
  unit: string = 'px'
): void {
  if (!isDev) return;
  
  const match = Math.abs(expected - actual) < 1; // Allow 1px tolerance
  const indicator = match ? '✓' : '✗';
  const color = match ? colors.green : colors.red;
  const delta = actual - expected;
  const deltaStr = delta !== 0 ? ` (Δ ${delta > 0 ? '+' : ''}${delta}${unit})` : '';
  
  const tagColor = getTagColor(tag);
  console.log(
    `${tagColor}[${tag}]${colors.reset} ${label}: ${color}${actual}${unit}${colors.reset} vs ${expected}${unit} ${indicator}${deltaStr}`
  );
}

/**
 * Log measurement summary with pass/fail indicators
 */
export function logSummary(issues: { label: string; passed: boolean; details?: string }[]): void {
  if (!isDev) return;
  
  const allPassed = issues.every(i => i.passed);
  const summaryColor = allPassed ? colors.green : colors.red;
  
  console.group(`${summaryColor}[SUMMARY] Layout Validation${colors.reset}`);
  
  issues.forEach(({ label, passed, details }) => {
    const indicator = passed ? '✓' : '✗';
    const color = passed ? colors.green : colors.red;
    const detailsStr = details ? ` - ${details}` : '';
    console.log(`  ${color}${indicator}${colors.reset} ${label}${detailsStr}`);
  });
  
  console.groupEnd();
}

/**
 * Log element measurements
 */
export function logElementMeasurements(
  tag: LogTag,
  element: HTMLElement | null,
  label: string
): void {
  if (!isDev || !element) return;
  
  const measurements = {
    offsetHeight: element.offsetHeight,
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
    offsetWidth: element.offsetWidth,
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  };
  
  logLayout(tag, {
    [label]: 'Measurements',
    ...measurements,
  });
}

/**
 * Log computed styles for an element
 */
export function logComputedStyles(
  tag: LogTag,
  element: HTMLElement | null,
  properties: string[]
): void {
  if (!isDev || !element) return;
  
  const computed = window.getComputedStyle(element);
  const styles: Record<string, string> = {};
  
  properties.forEach(prop => {
    styles[prop] = computed.getPropertyValue(prop);
  });
  
  logLayout(tag, styles);
}

/**
 * Log CSS variable values
 */
export function logCSSVariables(variables: string[]): void {
  if (!isDev) return;
  
  const computed = window.getComputedStyle(document.documentElement);
  const values: Record<string, string> = {};
  
  variables.forEach(varName => {
    values[varName] = computed.getPropertyValue(varName).trim();
  });
  
  logLayout('SAFE-AREA', values);
}

/**
 * Track and log layout shifts
 */
export class LayoutShiftTracker {
  private shifts: { element: string; from: number; to: number; timestamp: number }[] = [];
  private cumulativeShift: number = 0;
  
  recordShift(element: string, from: number, to: number): void {
    if (!isDev) return;
    
    const delta = Math.abs(to - from);
    this.cumulativeShift += delta;
    
    this.shifts.push({
      element,
      from,
      to,
      timestamp: Date.now(),
    });
    
    logLayout('LAYOUT-SHIFT', {
      Element: element,
      Previous: `${from}px`,
      New: `${to}px`,
      Delta: `${to > from ? '+' : ''}${to - from}px`,
      Cumulative: `${this.cumulativeShift}px`,
    });
    
    if (this.cumulativeShift > 5) {
      console.warn(`⚠ WARNING: Cumulative layout shift ${this.cumulativeShift}px may cause visual jank`);
    }
  }
  
  getSummary(): { shifts: number; cumulative: number } {
    return {
      shifts: this.shifts.length,
      cumulative: this.cumulativeShift,
    };
  }
  
  reset(): void {
    this.shifts = [];
    this.cumulativeShift = 0;
  }
}

export const layoutShiftTracker = new LayoutShiftTracker();
