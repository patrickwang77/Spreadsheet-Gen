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
import { Calculator, BarChart3, Table, ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';
import { ThemeId, getTheme } from '../themes';

interface DashboardCardsProps {
  cards: CardConfig[];
  filteredRows: RowData[];
  onEditCard?: (card: CardConfig) => void;
  onDeleteCard?: (cardId: string) => void;
  isCustomMode: boolean;
  themeId?: ThemeId;
  onReorderCards?: (reorderedCards: CardConfig[]) => void;
}

export default function DashboardCards({
  cards,
  filteredRows,
  onEditCard,
  onDeleteCard,
  isCustomMode,
  themeId = 'indigo',
  onReorderCards,
}: DashboardCardsProps) {
  // Store table pagination per card id
  const [tablePages, setTablePages] = useState<{ [cardId: string]: number }>({});

  // Drag and drop states
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [dragOverCardId, setDragOverCardId] = useState<string | null>(null);

  const theme = getTheme(themeId);
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
              const { type: chartType, xAxisColumn, yAxisColumn, aggregate } = card.chart;
              const chartData = aggregateChartData(filteredRows, xAxisColumn, yAxisColumn, aggregate);
              const isDark = document.documentElement.classList.contains('dark');
              const gridStroke = isDark ? '#1e293b' : '#f1f5f9';
              const axisStroke = isDark ? '#475569' : '#94a3b8';
              const tooltipStyle = isDark 
                ? { fontSize: 10, borderRadius: 6, backgroundColor: '#0f172a', border: '1px solid #334155', padding: '4px 8px', color: '#f1f5f9' }
                : { fontSize: 10, borderRadius: 6, backgroundColor: '#ffffff', border: '1px solid #e2e8f0', padding: '4px 8px', color: '#0f172a' };

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
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        {chartType === 'bar' ? (
                          <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                            <XAxis dataKey="name" stroke={axisStroke} fontSize={9} tickLine={false} />
                            <YAxis stroke={axisStroke} fontSize={9} tickLine={false} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Bar dataKey="value" fill={theme.chartColor} radius={[3, 3, 0, 0]} name={`${yAxisColumn} (${aggregate})`} />
                          </BarChart>
                        ) : chartType === 'line' ? (
                          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                            <XAxis dataKey="name" stroke={axisStroke} fontSize={9} tickLine={false} />
                            <YAxis stroke={axisStroke} fontSize={9} tickLine={false} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Line type="monotone" dataKey="value" stroke={theme.chartColor} strokeWidth={1.5} dot={{ r: 2 }} activeDot={{ r: 4 }} name={`${yAxisColumn} (${aggregate})`} />
                          </LineChart>
                        ) : chartType === 'area' ? (
                          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                            <XAxis dataKey="name" stroke={axisStroke} fontSize={9} tickLine={false} />
                            <YAxis stroke={axisStroke} fontSize={9} tickLine={false} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Area type="monotone" dataKey="value" fill={theme.hex50} stroke={theme.chartColor} strokeWidth={1.5} name={`${yAxisColumn} (${aggregate})`} />
                          </AreaChart>
                        ) : (
                          // Pie Chart
                          <PieChart>
                            <Pie
                              data={chartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={40}
                              outerRadius={65}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ fontSize: 10, borderRadius: 6, padding: '4px 8px' }} />
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
              const displayColumns = config.columns.length > 0 ? config.columns : Object.keys(filteredRows[0] || {});
              const pageSize = config.pageSize || 8;
              const totalRows = filteredRows.length;
              const totalPages = Math.ceil(totalRows / pageSize) || 1;

              const currentPage = tablePages[card.id] || 0;
              const startIdx = currentPage * pageSize;
              const slicedRows = filteredRows.slice(startIdx, startIdx + pageSize);

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

              return (
                <div className="flex flex-col h-full justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                      <div className="flex items-center gap-1 truncate mr-12">
                        {isCustomMode && (
                          <GripVertical className="w-3.5 h-3.5 text-slate-400 shrink-0 cursor-grab active:cursor-grabbing" />
                        )}
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate" title={card.title}>
                          {card.title}
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
                            {displayColumns.map((col) => (
                              <th key={col} className="px-2 py-1.5 text-slate-600 dark:text-slate-300 font-bold truncate max-w-[150px]" title={col}>
                                {col}
                              </th>
                            ))}
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
                                  return (
                                    <td
                                      key={col}
                                      className={`px-2 py-1 truncate max-w-[150px] ${isNum ? 'text-right font-mono text-[10px]' : 'text-left'}`}
                                      title={strVal}
                                    >
                                      {strVal}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))
                          )}
                        </tbody>
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
