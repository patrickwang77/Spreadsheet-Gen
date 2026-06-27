/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ColumnInfo, ColumnType, RowData, OperationType } from './types';

/**
 * Detect column metadata and types from rows
 */
export function analyzeColumns(rows: RowData[]): ColumnInfo[] {
  if (rows.length === 0) return [];
  const colNames = Object.keys(rows[0]);
  const sampleSize = Math.min(rows.length, 100);

  return colNames.map(name => {
    let numericCount = 0;
    let booleanCount = 0;
    let dateCount = 0;
    let nonNullCount = 0;
    const uniqueValsSet = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const val = rows[i][name];
      if (val !== undefined && val !== null && val !== '') {
        nonNullCount++;
        const strVal = String(val).trim();
        uniqueValsSet.add(strVal);

        // Check number
        if (!isNaN(Number(strVal))) {
          numericCount++;
        }
        // Check boolean
        if (strVal.toLowerCase() === 'true' || strVal.toLowerCase() === 'false' || val === true || val === false) {
          booleanCount++;
        }
        // Check date
        if (isNaN(Number(strVal)) && !isNaN(Date.parse(strVal))) {
          dateCount++;
        }
      }
    }

    let type: ColumnType = 'string';
    if (nonNullCount > 0) {
      if (numericCount / nonNullCount > 0.8) {
        type = 'number';
      } else if (booleanCount / nonNullCount > 0.8) {
        type = 'boolean';
      } else if (dateCount / nonNullCount > 0.8) {
        type = 'date';
      }
    }

    return {
      name,
      type,
      uniqueValues: Array.from(uniqueValsSet).sort(),
      isNumeric: type === 'number',
    };
  });
}

/**
 * Perform numeric calculation on a column
 */
export function calculateMetric(rows: RowData[], columnName: string, op: OperationType): number {
  const values = rows
    .map(r => Number(r[columnName]))
    .filter(val => !isNaN(val));

  if (values.length === 0) return 0;

  switch (op) {
    case 'SUM':
      return values.reduce((sum, val) => sum + val, 0);
    case 'AVG':
      return values.reduce((sum, val) => sum + val, 0) / values.length;
    case 'COUNT':
      return rows.length;
    case 'MIN':
      return Math.min(...values);
    case 'MAX':
      return Math.max(...values);
    case 'MEDIAN': {
      const sorted = [...values].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }
    default:
      return 0;
  }
}

/**
 * Helper to aggregate data for charting
 */
export interface AggregatedPoint {
  name: string;
  value: number;
}

export function aggregateChartData(
  rows: RowData[],
  xAxisCol: string,
  yAxisCol: string,
  method: 'SUM' | 'AVG' | 'RAW'
): AggregatedPoint[] {
  if (method === 'RAW') {
    return rows.map((r, idx) => ({
      name: String(r[xAxisCol] || `Row ${idx + 1}`),
      value: isNaN(Number(r[yAxisCol])) ? 0 : Number(r[yAxisCol]),
    })).slice(0, 100); // Limit to first 100 items for layout safety
  }

  const grouping: { [key: string]: number[] } = {};
  for (const row of rows) {
    const key = String(row[xAxisCol] ?? 'Blank');
    const val = isNaN(Number(row[yAxisCol])) ? 0 : Number(row[yAxisCol]);
    if (!grouping[key]) {
      grouping[key] = [];
    }
    grouping[key].push(val);
  }

  return Object.keys(grouping).map(key => {
    const list = grouping[key];
    let finalVal = 0;
    if (method === 'SUM') {
      finalVal = list.reduce((a, b) => a + b, 0);
    } else if (method === 'AVG') {
      finalVal = list.reduce((a, b) => a + b, 0) / list.length;
    }
    return {
      name: key,
      value: finalVal,
    };
  });
}
