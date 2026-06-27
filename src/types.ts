/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ColumnType = 'number' | 'string' | 'date' | 'boolean';

export interface ColumnInfo {
  name: string;
  type: ColumnType;
  uniqueValues: string[];
  isNumeric: boolean;
}

export interface RowData {
  [key: string]: any;
}

export type OperationType = 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX' | 'MEDIAN';
export type ChartType = 'bar' | 'line' | 'pie' | 'area' | 'scatter';

export interface MetricConfig {
  column: string;
  operation: OperationType;
  prefix?: string;
  suffix?: string;
}

export interface ChartConfig {
  type: ChartType;
  xAxisColumn: string;
  yAxisColumn: string;
  aggregate: 'SUM' | 'AVG' | 'RAW';
}

export interface TableConfig {
  columns: string[];
  pageSize: number;
}

export interface CardConfig {
  id: string;
  title: string;
  type: 'metric' | 'chart' | 'table';
  width: '1/3' | '1/2' | '2/3' | 'full';
  metric?: MetricConfig;
  chart?: ChartConfig;
  table?: TableConfig;
}

export type PresetTemplateId = 'preset-sales' | 'preset-ops' | 'preset-minimal' | 'preset-custom';

export interface PresetTemplate {
  id: PresetTemplateId;
  name: string;
  description: string;
  iconName: string;
  cards: CardConfig[];
}

export interface Slicer {
  columnName: string;
  selectedValues: string[]; // List of values selected (if empty, means show all)
}

export interface CalculatedColumn {
  name: string;
  colA: string;
  operator: '+' | '-' | '*' | '/';
  operandBType: 'column' | 'constant';
  colB?: string;
  constantB?: number;
}
