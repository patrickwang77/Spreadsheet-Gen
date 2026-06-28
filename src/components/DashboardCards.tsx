/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { CardConfig, RowData } from '../types';
import { calculateMetric, aggregateChartData } from '../utils';
import { Calculator, BarChart3, Table, ChevronLeft, ChevronRight, GripVertical, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { ThemeId, getTheme } from '../themes';

interface DashboardCardsProps {
  cards: CardConfig[];
  filteredRows: RowData[];
  onEditCard?: (card: CardConfig) => void;
  onDeleteCard?: (cardId: string) => void;
  isCustomMode: boolean;
  themeId?: ThemeId;
  customPrimaryHex?: string;
  colorMode?: 'light' | 'dark' | 'system';
  onReorderCards?: (reorderedCards: CardConfig[]) => void;
}

export default function DashboardCards({
  cards,
  filteredRows,
  onEditCard,
  onDeleteCard,
  isCustomMode,
  themeId = 'indigo',
  customPrimaryHex,
  colorMode = 'light',
  onReorderCards,
}: DashboardCardsProps) {
  // Store table pagination per card id
  const [tablePages, setTablePages] = useState<{ [cardId: string]: number }>({});

  // Store table sorting per card id
  const [tableSorts, setTableSorts] = useState<{ [cardId: string]: { column: string; direction: 'asc' | 'desc' } }>({});

  // Drag and drop states
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [dragOverCardId, setDragOverCardId] = useState<string | null>(null);

  const theme = getTheme(themeId, customPrimaryHex);
  const COLORS = theme.pieColors;

  const handleDragStart = (e: React.DragEvent, cardId: string) => {
    if (!isCustomMode) {
      e.preventDefault();
      return;
    }
    setDraggedCardId(cardId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', cardId);
  };

  const handleDragOver = (e: React.DragEvent, cardId: string) => {
    if (!isCustomMode) return;
    e.preventDefault();
    if (draggedCardId !== cardId && dragOverCardId !== cardId) {
      setDragOverCardId(cardId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (
      x < rect.left ||
      x >= rect.right ||
      y < rect.top ||
      y >= rect.bottom
    ) {
      setDragOverCardId(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetCardId: string) => {
    if (!isCustomMode) return;
    e.preventDefault();
    const sourceCardId = e.dataTransfer.getData('text/plain') || draggedCardId;
    if (sourceCardId && sourceCardId !== targetCardId) {
      const draggedIdx = cards.findIndex((c) => c.id === sourceCardId);
      const targetIdx = cards.findIndex((c) => c.id === targetCardId);
      if (draggedIdx !== -1 && targetIdx !== -1) {
        const reordered = [...cards];
        const [removed] = reordered.splice(draggedIdx, 1);
        reordered.splice(targetIdx, 0, removed);
        onReorderCards?.(reordered);
      }
    }
    setDraggedCardId(null);
    setDragOverCardId(null);
  };

  const handleDragEnd = () => {
    setDraggedCardId(null);
    setDragOverCardId(null);
  };

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400 bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
        <BarChart3 className="w-10 h-10 stroke-1 text-slate-300 mb-2" />
        <p className="text-xs font-medium">尚未新增任何卡片，請選擇範本或新增自訂卡片</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-3" id="dashboard-grid-preview">
      {cards.map((card) => {
        // Compute col-span
        let colSpanClass = 'col-span-1 md:col-span-6';
        if (card.width === '1/3') colSpanClass = 'col-span-1 md:col-span-2';
        else if (card.width === '1/2') colSpanClass = 'col-span-1 md:col-span-3';
        else if (card.width === '2/3') colSpanClass = 'col-span-1 md:col-span-4';

        const isDraggingThis = draggedCardId === card.id;
        const isDragOverThis = dragOverCardId === card.id && draggedCardId !== card.id;

        return (
          <div
            key={card.id}
            id={`preview-card-${card.id}`}
            draggable={isCustomMode}
            onDragStart={(e) => handleDragStart(e, card.id)}
            onDragOver={(e) => handleDragOver(e, card.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, card.id)}
            onDragEnd={handleDragEnd}
            className={`bg-white dark:bg-slate-900 rounded-xl border shadow-sm p-3.5 flex flex-col hover:shadow transition-all h-fit group relative overflow-hidden ${colSpanClass} ${
              isDraggingThis ? 'opacity-40 border-slate-300 dark:border-slate-700 scale-[0.98]' : ''
            } ${
              isDragOverThis ? 'border-dashed border-2 bg-slate-50/50 dark:bg-slate-900/50 scale-[1.01]' : 'border-slate-200/80 dark:border-slate-800'
            } ${
              isCustomMode ? 'cursor-grab active:cursor-grabbing' : ''
            }`}
            style={isDragOverThis ? { borderColor: theme.chartColor } : undefined}
          >
            {/* Custom Mode Actions */}
            {isCustomMode && (
              <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 z-10 bg-white/95 backdrop-blur-sm p-0.5 rounded-md border border-slate-150 shadow-sm">
                {onEditCard && (
                  <button
                    onClick={() => onEditCard(card)}
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded transition-colors ${theme.accentText} ${theme.lightBg} hover:opacity-90`}
                  >
                    編輯
                  </button>
                )}
                {onDeleteCard && (
                  <button
                    onClick={() => onDeleteCard(card.id)}
                    className="text-[10px] font-semibold px-1.5 py-0.5 text-rose-600 hover:bg-rose-50 rounded transition-colors"
                  >
                    刪除
                  </button>
                )}
              </div>
            )}

            {/* Metric Card */}
            {card.type === 'metric' && card.metric && (
              <div className="flex flex-col h-full justify-between">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1 truncate mr-12">
                    {isCustomMode && (
                      <GripVertical className="w-3.5 h-3.5 text-slate-400 shrink-0 cursor-grab active:cursor-grabbing" />
                    )}
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate" title={card.title}>
                      {card.title}
                    </span>
                  </div>
                  <div className="p-1.5 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-lg">
                    <Calculator className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="flex flex-col mt-0.5">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight font-display truncate">
                    {card.metric.prefix || ''}{' '}
                    {calculateMetric(filteredRows, card.metric.column, card.metric.operation).toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}{' '}
                    {card.metric.suffix || ''}
                  </span>
                  <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                    欄位: {card.metric.column} ({card.metric.operation})
                  </span>
                </div>
              </div>
            )}

            {/* Chart Card */}
            {card.type === 'chart' && card.chart && (() => {
              const { type: chartType, xAxisColumn, yAxisColumn, yAxisColumn2, donutRange, aggregate } = card.chart;
              
              // Resolve datasets
              const chartData1 = aggregateChartData(filteredRows, xAxisColumn, yAxisColumn, aggregate);
              
              let chartData: any[] = [];
              let isDonutProgress = false;
              let donutProgressPercent = 0;
              let actualSum = 0;
              let planSum = 0;

              if (chartType === 'donut' && yAxisColumn2) {
                isDonutProgress = true;
                const actualValues = filteredRows.map(r => Number(r[yAxisColumn])).filter(v => !isNaN(v));
                const planValues = filteredRows.map(r => Number(r[yAxisColumn2])).filter(v => !isNaN(v));
                
                if (aggregate === 'AVG') {
                  actualSum = actualValues.length > 0 ? actualValues.reduce((a, b) => a + b, 0) / actualValues.length : 0;
                  planSum = planValues.length > 0 ? planValues.reduce((a, b) => a + b, 0) / planValues.length : 0;
                } else {
                  actualSum = actualValues.reduce((a, b) => a + b, 0);
                  planSum = planValues.reduce((a, b) => a + b, 0);
                }
                
                donutProgressPercent = planSum > 0 ? Math.round((actualSum / planSum) * 100) : 0;
                
                chartData = [
                  { name: `實際值: ${yAxisColumn}`, value: actualSum },
                  { name: `剩餘目標`, value: Math.max(0, planSum - actualSum) }
                ];
              } else if (chartType === 'overlaid-bar' && yAxisColumn2) {
                const chartData2 = aggregateChartData(filteredRows, xAxisColumn, yAxisColumn2, aggregate);
                chartData = chartData1.map(p1 => {
                  const p2 = chartData2.find(p => p.name === p1.name);
                  return {
                    name: p1.name,
                    actual: p1.value,
                    plan: p2 ? p2.value : 0,
                  };
                });
              } else {
                chartData = chartData1;
              }

              const isDark = colorMode === 'dark' || (colorMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches) || document.documentElement.classList.contains('dark');
              const gridStroke = isDark ? '#334155' : '#e2e8f0';
              const axisStroke = isDark ? '#94a3b8' : '#64748b';
              const tooltipStyle = isDark 
                ? { fontSize: 10, borderRadius: 12, backgroundColor: '#1e293b', border: '1px solid #475569', padding: '6px 10px', color: '#f8fafc' }
                : { fontSize: 10, borderRadius: 12, backgroundColor: '#ffffff', border: '1px solid #e2e8f0', padding: '6px 10px', color: '#0f172a' };

              return (
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-2 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                    <div className="flex items-center gap-1 truncate mr-12">
                      {isCustomMode && (
                        <GripVertical className="w-3.5 h-3.5 text-slate-400 shrink-0 cursor-grab active:cursor-grabbing" />
                      )}
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate" title={card.title}>
                        {card.title}
                      </span>
                    </div>
                    <div className={`p-1 ${theme.lightBg} ${theme.accentText} rounded`}>
                      <BarChart3 className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  <div className="h-52 w-full flex items-center justify-center text-[11px] text-slate-500 dark:text-slate-400">
                    {chartData.length === 0 ? (
                      <span className="italic">無可用的圖表資料。</span>
                    ) : chartType === 'donut' ? (
                      <div className="relative w-full h-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={chartData}
                              cx="50%"
                              cy={donutRange === 'half' ? '80%' : '50%'}
                              startAngle={donutRange === 'half' ? 180 : 90}
                              endAngle={donutRange === 'half' ? 0 : -270}
                              innerRadius={donutRange === 'half' ? 60 : 45}
                              outerRadius={donutRange === 'half' ? 90 : 70}
                              paddingAngle={isDonutProgress ? 0 : (donutRange === 'half' ? 1 : 2)}
                              dataKey="value"
                            >
                              {chartData.map((entry, index) => {
                                let cellColor = COLORS[index % COLORS.length];
                                if (isDonutProgress) {
                                  cellColor = index === 0 ? theme.chartColor : (isDark ? '#1e293b' : '#f1f5f9');
                                }
                                return (
                                  <Cell 
                                    key={`cell-${index}`} 
                                    fill={cellColor} 
                                    stroke={isDonutProgress ? (index === 0 ? theme.chartColor : (isDark ? '#334155' : '#e2e8f0')) : undefined} 
                                    strokeWidth={isDonutProgress ? 1 : 0} 
                                  />
                                );
                              })}
                            </Pie>
                            <Tooltip contentStyle={tooltipStyle} formatter={(value) => Number(value).toLocaleString()} />
                            <Legend layout="horizontal" verticalAlign="bottom" align="center" iconSize={6} wrapperStyle={{ fontSize: 9, paddingTop: 4 }} />
                          </PieChart>
                        </ResponsiveContainer>

                        {/* Donut progress center text display */}
                        {isDonutProgress && (
                          <div className={`absolute pointer-events-none flex flex-col items-center justify-center left-1/2 -translate-x-1/2 ${
                            donutRange === 'half' ? 'bottom-8' : 'top-[42%] -translate-y-1/2'
                          }`}>
                            <span className="text-base font-extrabold text-slate-800 dark:text-slate-100 font-display">
                              {donutProgressPercent}%
                            </span>
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold tracking-wide">
                              達成率
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        {chartType === 'bar' ? (
                          <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                            <XAxis dataKey="name" stroke={axisStroke} fontSize={9} tickLine={false} />
                            <YAxis stroke={axisStroke} fontSize={9} tickLine={false} tickFormatter={(val) => Number(val).toLocaleString()} />
                            <Tooltip contentStyle={tooltipStyle} formatter={(val) => Number(val).toLocaleString()} />
                            <Bar dataKey="value" fill={theme.chartColor} radius={[3, 3, 0, 0]} name={`${yAxisColumn} (${aggregate})`} />
                          </BarChart>
                        ) : chartType === 'line' ? (
                          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                            <XAxis dataKey="name" stroke={axisStroke} fontSize={9} tickLine={false} />
                            <YAxis stroke={axisStroke} fontSize={9} tickLine={false} tickFormatter={(val) => Number(val).toLocaleString()} />
                            <Tooltip contentStyle={tooltipStyle} formatter={(val) => Number(val).toLocaleString()} />
                            <Line type="monotone" dataKey="value" stroke={theme.chartColor} strokeWidth={1.5} dot={{ r: 2 }} activeDot={{ r: 4 }} name={`${yAxisColumn} (${aggregate})`} />
                          </LineChart>
                        ) : chartType === 'area' ? (
                          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                            <XAxis dataKey="name" stroke={axisStroke} fontSize={9} tickLine={false} />
                            <YAxis stroke={axisStroke} fontSize={9} tickLine={false} tickFormatter={(val) => Number(val).toLocaleString()} />
                            <Tooltip contentStyle={tooltipStyle} formatter={(val) => Number(val).toLocaleString()} />
                            <Area type="monotone" dataKey="value" fill={theme.hex50} stroke={theme.chartColor} strokeWidth={1.5} name={`${yAxisColumn} (${aggregate})`} />
                          </AreaChart>
                        ) : chartType === 'overlaid-bar' ? (
                          <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                            <XAxis dataKey="name" stroke={axisStroke} fontSize={9} tickLine={false} />
                            <XAxis dataKey="name" xAxisId="actual-axis" stroke={axisStroke} fontSize={9} tickLine={false} hide />
                            <YAxis stroke={axisStroke} fontSize={9} tickLine={false} tickFormatter={(val) => Number(val).toLocaleString()} />
                            <Tooltip contentStyle={tooltipStyle} formatter={(val) => Number(val).toLocaleString()} />
                            <Legend verticalAlign="top" height={22} iconSize={8} wrapperStyle={{ fontSize: 9 }} />
                            <Bar dataKey="plan" fill={theme.hex100} stroke={theme.chartColor} strokeWidth={1} barSize={26} radius={[3, 3, 0, 0]} name={`計劃值: ${yAxisColumn2}`} />
                            <Bar xAxisId="actual-axis" dataKey="actual" fill={theme.chartColor} barSize={16} radius={[2, 2, 0, 0]} name={`實際值: ${yAxisColumn}`} />
                          </BarChart>
                        ) : (
                          // Pie Chart
                          <PieChart>
                            <Pie
                              data={chartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={0}
                              outerRadius={65}
                              paddingAngle={0}
                              dataKey="value"
                            >
                              {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={tooltipStyle} formatter={(val) => Number(val).toLocaleString()} />
                            <Legend layout="horizontal" verticalAlign="bottom" align="center" iconSize={6} wrapperStyle={{ fontSize: 9, paddingTop: 4 }} />
                          </PieChart>
                        )}
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Table Card */}
            {card.type === 'table' && card.table && (() => {
              const config = card.table;
              const isGrouped = !!config.groupByColumn;

              const displayColumns = isGrouped
                ? [config.groupByColumn!, ...(config.subtotalColumns && config.subtotalColumns.length > 0
                    ? config.subtotalColumns
                    : Object.keys(filteredRows[0] || {}).filter(k => k !== config.groupByColumn && !isNaN(Number(filteredRows[0]?.[k] || ''))))]
                : (config.columns.length > 0 ? config.columns : Object.keys(filteredRows[0] || {}));

              const pageSize = config.pageSize || 8;

              // Group and aggregate if groupByColumn is set
              let baseRows: any[] = [];
              if (isGrouped && config.groupByColumn) {
                const groupCol = config.groupByColumn;
                const groups: { [key: string]: any } = {};

                filteredRows.forEach(row => {
                  const keyVal = row[groupCol] !== undefined && row[groupCol] !== null ? String(row[groupCol]) : '(空白)';
                  if (!groups[keyVal]) {
                    groups[keyVal] = {
                      [groupCol]: keyVal
                    };
                    displayColumns.slice(1).forEach(col => {
                      groups[keyVal][col] = 0;
                    });
                  }

                  displayColumns.slice(1).forEach(col => {
                    const v = Number(row[col]);
                    if (!isNaN(v)) {
                      groups[keyVal][col] = (groups[keyVal][col] as number) + v;
                    }
                  });
                });

                baseRows = Object.values(groups);
              } else {
                baseRows = [...filteredRows];
              }

              // Apply sort
              let sortedRows = [...baseRows];
              const sortConfig = tableSorts[card.id];
              if (sortConfig) {
                const { column, direction } = sortConfig;
                sortedRows.sort((a, b) => {
                  const valA = a[column];
                  const valB = b[column];

                  const numA = Number(valA);
                  const numB = Number(valB);
                  const isNumA = !isNaN(numA) && valA !== null && valA !== '';
                  const isNumB = !isNaN(numB) && valB !== null && valB !== '';

                  if (isNumA && isNumB) {
                    return direction === 'asc' ? numA - numB : numB - numA;
                  }

                  const strA = valA !== undefined && valA !== null ? String(valA) : '';
                  const strB = valB !== undefined && valB !== null ? String(valB) : '';
                  return direction === 'asc'
                    ? strA.localeCompare(strB, 'zh-TW', { numeric: true })
                    : strB.localeCompare(strA, 'zh-TW', { numeric: true });
                });
              }

              const totalRows = sortedRows.length;
              const totalPages = Math.ceil(totalRows / pageSize) || 1;

              const currentPage = tablePages[card.id] || 0;
              const startIdx = currentPage * pageSize;
              const slicedRows = sortedRows.slice(startIdx, startIdx + pageSize);

              const handlePrevPage = () => {
                if (currentPage > 0) {
                  setTablePages({ ...tablePages, [card.id]: currentPage - 1 });
                }
              };

              const handleNextPage = () => {
                if (currentPage < totalPages - 1) {
                  setTablePages({ ...tablePages, [card.id]: currentPage + 1 });
                }
              };

              const handleSort = (colName: string) => {
                const currentSort = tableSorts[card.id];
                if (!currentSort || currentSort.column !== colName) {
                  setTableSorts({
                    ...tableSorts,
                    [card.id]: { column: colName, direction: 'asc' }
                  });
                } else if (currentSort.direction === 'asc') {
                  setTableSorts({
                    ...tableSorts,
                    [card.id]: { column: colName, direction: 'desc' }
                  });
                } else {
                  const updatedSorts = { ...tableSorts };
                  delete updatedSorts[card.id];
                  setTableSorts(updatedSorts);
                }
                // Reset page to 0
                setTablePages({ ...tablePages, [card.id]: 0 });
              };

              return (
                <div className="flex flex-col h-full justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                      <div className="flex items-center gap-1 truncate mr-12">
                        {isCustomMode && (
                          <GripVertical className="w-3.5 h-3.5 text-slate-400 shrink-0 cursor-grab active:cursor-grabbing" />
                        )}
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate" title={card.title}>
                          {card.title} {isGrouped && <span className="text-[10px] text-emerald-500 font-normal">(分組彙總表)</span>}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] bg-slate-100 dark:bg-slate-800 px-2 py-0.25 rounded text-slate-500 dark:text-slate-400 font-mono">
                          共 {totalRows} 筆
                        </span>
                        <div className="p-1 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded">
                          <Table className="w-3 h-3" />
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto custom-scrollbar border border-slate-100 dark:border-slate-800 rounded-lg mb-2">
                      <table className="w-full text-left border-collapse text-[11px]">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                            {displayColumns.map((col) => {
                              const isSorted = sortConfig?.column === col;
                              const isAsc = sortConfig?.direction === 'asc';
                              return (
                                <th
                                  key={col}
                                  onClick={() => handleSort(col)}
                                  className="px-2 py-1.5 text-slate-600 dark:text-slate-300 font-bold truncate max-w-[150px] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 select-none group"
                                  title={`${col} - 點擊以排序`}
                                >
                                  <div className="flex items-center gap-0.5 truncate">
                                    <span className="truncate">{col}</span>
                                    {isSorted ? (
                                      isAsc ? (
                                        <ArrowUp className="w-3 h-3 ml-0.5 text-slate-600 dark:text-slate-300 shrink-0" />
                                      ) : (
                                        <ArrowDown className="w-3 h-3 ml-0.5 text-slate-600 dark:text-slate-300 shrink-0" />
                                      )
                                    ) : (
                                      <ArrowUpDown className="w-2.5 h-2.5 ml-0.5 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" />
                                    )}
                                  </div>
                                </th>
                              );
                            })}
                          </tr>
                        </thead>
                        <tbody className="text-slate-600 dark:text-slate-300 divide-y divide-slate-100 dark:divide-slate-800">
                          {slicedRows.length === 0 ? (
                            <tr>
                              <td colSpan={displayColumns.length} className="px-2 py-4 text-center text-slate-400 dark:text-slate-500 italic">
                                沒有符合的資料。
                              </td>
                            </tr>
                          ) : (
                            slicedRows.map((row, rowIdx) => (
                              <tr key={rowIdx} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                                {displayColumns.map((col) => {
                                  const val = row[col];
                                  const strVal = val !== undefined && val !== null ? String(val) : '';
                                  const isNum = !isNaN(Number(val)) && strVal !== '';
                                  const displayVal = isNum
                                    ? Number(val).toLocaleString(undefined, { maximumFractionDigits: 2 })
                                    : strVal;
                                  return (
                                    <td
                                      key={col}
                                      className={`px-2 py-1 truncate max-w-[150px] ${isNum ? 'text-right font-mono text-[10px]' : 'text-left'}`}
                                      title={displayVal}
                                    >
                                      {displayVal}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))
                          )}
                        </tbody>
                        {((isGrouped && displayColumns.length > 1) || (!isGrouped && config.subtotalColumns && config.subtotalColumns.length > 0)) && (
                          <tfoot className="bg-slate-50 dark:bg-slate-800/80 border-t-2 border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200">
                            <tr>
                              {displayColumns.map((col, idx) => {
                                const isFirst = idx === 0;
                                const isSumCol = isGrouped ? idx > 0 : config.subtotalColumns?.includes(col);

                                if (isFirst) {
                                  return (
                                    <td key={col} className="px-2 py-1.5 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                      {isGrouped ? '總計 (Total)' : '小計 (Subtotal)'}
                                    </td>
                                  );
                                }

                                if (isSumCol) {
                                  const sumVal = filteredRows.reduce((sum, r) => {
                                    const v = Number(r[col]);
                                    return sum + (isNaN(v) ? 0 : v);
                                  }, 0);
                                  return (
                                    <td key={col} className="px-2 py-1.5 text-right font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                                      {sumVal.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                    </td>
                                  );
                                }

                                return <td key={col} className="px-2 py-1.5"></td>;
                              })}
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  </div>

                  {/* Pagination control footer */}
                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-50 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 mt-1.5">
                    <span>
                      顯示 {totalRows > 0 ? startIdx + 1 : 0} - {Math.min(startIdx + pageSize, totalRows)} 筆，頁次 {currentPage + 1} / {totalPages}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={handlePrevPage}
                        disabled={currentPage === 0}
                        className="p-0.5 px-1.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded disabled:opacity-40 transition-colors"
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </button>
                      <button
                        onClick={handleNextPage}
                        disabled={currentPage >= totalPages - 1}
                        className="p-0.5 px-1.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded disabled:opacity-40 transition-colors"
                      >
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        );
      })}
    </div>
  );
}
