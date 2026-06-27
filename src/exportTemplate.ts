/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CardConfig, Slicer, RowData, ColumnInfo } from './types';
import { ThemeId, getTheme } from './themes';

export function generateHtmlDashboard(
  fileName: string,
  rows: RowData[],
  columns: ColumnInfo[],
  cards: CardConfig[],
  slicers: Slicer[],
  themeId: ThemeId = 'indigo'
): string {
  const theme = getTheme(themeId);

  // Serialize configurations
  const rowsJson = JSON.stringify(rows);
  const columnsJson = JSON.stringify(columns);
  const cardsJson = JSON.stringify(cards);
  const slicersJson = JSON.stringify(slicers);

  return `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${fileName} - 互動式儀表板</title>
  
  <!-- CSS & Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  
  <!-- ChartJS CDN -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  
  <!-- Lucide Icons -->
  <script src="https://unpkg.com/lucide@latest"></script>

  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: {
            sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
            display: ['Space Grotesk', 'sans-serif'],
            mono: ['JetBrains Mono', 'monospace'],
          },
          colors: {
            brand: {
              50: '${theme.hex50}',
              100: '${theme.hex100}',
              600: '${theme.hex600}',
              700: '${theme.hex700}',
            }
          }
        }
      }
    }
  </script>

  <style>
    body {
      font-family: 'Inter', sans-serif;
    }
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 3px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }
  </style>
</head>
<body class="bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 min-h-screen flex flex-col transition-colors duration-200">

  <!-- Top Header Bar -->
  <header class="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 px-4 py-2.5 shadow-sm transition-colors duration-200">
    <div class="max-w-[1536px] mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <div class="flex items-center gap-2.5">
        <div class="p-1.5 bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 rounded-lg">
          <i data-lucide="layout-dashboard" class="w-5 h-5"></i>
        </div>
        <div>
          <div class="flex items-center gap-1.5">
            <h1 class="text-sm font-bold text-slate-900 dark:text-white tracking-tight font-display">${fileName}</h1>
            <span class="bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 text-[9px] font-semibold px-1.5 py-0.5 rounded border border-brand-100 dark:border-brand-900 uppercase tracking-wider font-mono">
              High Density Mode
            </span>
          </div>
          <p class="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.25">
            <i data-lucide="calendar" class="w-3 h-3"></i>
            匯出時間: <span id="export-time"></span> • 
            總資料筆數: <span class="font-semibold text-slate-700 dark:text-slate-300">${rows.length}</span> 筆
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2 flex-wrap md:flex-nowrap">
        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-150 dark:border-emerald-900">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          離線互動版面已啟用
        </span>

        <!-- Theme Mode Selector -->
        <div class="flex items-center gap-1 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg px-2 py-1 shadow-sm text-slate-600 dark:text-slate-300">
          <i data-lucide="sun" class="w-3.5 h-3.5 text-slate-400 dark:text-slate-500"></i>
          <select id="export-theme-mode" onchange="setThemeMode(this.value)" class="bg-transparent text-slate-700 dark:text-slate-200 text-[11px] font-bold outline-none cursor-pointer">
            <option value="light" class="bg-white dark:bg-slate-800 text-slate-800 dark:text-white">淺色模式 (Light)</option>
            <option value="dark" class="bg-white dark:bg-slate-800 text-slate-800 dark:text-white">深色模式 (Dark)</option>
            <option value="system" class="bg-white dark:bg-slate-800 text-slate-800 dark:text-white">系統同步 (System)</option>
          </select>
        </div>

        <button onclick="resetFilters()" class="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
          <i data-lucide="rotate-ccw" class="w-3 h-3"></i>
          重設篩選
        </button>
      </div>
    </div>
  </header>

  <div class="flex-1 max-w-[1536px] w-full mx-auto p-3 sm:p-4 lg:p-5 flex flex-col lg:flex-row gap-3.5">
    
    <!-- Left Sidebar: Slicers (Filters) -->
    <aside class="w-full lg:w-56 shrink-0 flex flex-col gap-3">
      <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-3 sticky top-16 max-h-[85vh] flex flex-col transition-colors duration-200">
        <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-2.5">
          <div class="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-bold text-xs">
            <i data-lucide="sliders-horizontal" class="w-3.5 h-3.5 text-brand-600"></i>
            <span>篩選器 (Slicers)</span>
          </div>
          <span id="active-filter-badge" class="hidden text-[9px] px-1.5 py-0.25 bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 border border-brand-100 dark:border-brand-900 font-bold rounded"></span>
        </div>

        <div id="slicer-container" class="flex-1 overflow-y-auto custom-scrollbar space-y-3.5 pr-1">
          <!-- Slicers will be dynamically rendered here -->
          <div id="no-slicers-msg" class="text-xs text-slate-400 dark:text-slate-500 text-center py-6 hidden">
            未設定任何篩選器。
          </div>
        </div>
      </div>
    </aside>

    <!-- Main Content Panel: Dashboard Cards -->
    <main class="flex-1 flex flex-col gap-3.5">
      
      <!-- Filter status bar -->
      <div id="filter-summary-bar" class="hidden items-center justify-between bg-brand-50/50 dark:bg-brand-950/20 border border-brand-100 dark:border-brand-900 rounded-xl px-3 py-1.5 text-xs text-brand-700 dark:text-brand-300">
        <div class="flex items-center gap-1.5">
          <i data-lucide="info" class="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 shrink-0"></i>
          <span>目前已套用篩選。顯示符合的資料：<strong id="filtered-count" class="text-slate-950 dark:text-white">0</strong> / ${rows.length} 筆 (佔 <strong id="filtered-pct" class="text-slate-950 dark:text-white">100%</strong>)</span>
        </div>
        <button onclick="resetFilters()" class="text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-bold">清除所有</button>
      </div>

      <!-- Dashboard Cards Grid -->
      <div id="dashboard-grid" class="grid grid-cols-1 md:grid-cols-6 gap-3">
        <!-- Cards will be dynamically rendered here -->
      </div>
    </main>

  </div>

  <footer class="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-4 px-6 text-center text-xs text-slate-400 dark:text-slate-500 mt-auto transition-colors duration-200">
    由 Spreadsheet Dashboard Generator 自動產生 • 本檔案為自包含之離線互動式 Dashboard，不需連接伺服器。
  </footer>

  <!-- RAW DATA & CONFIG EMBED -->
  <script id="raw-data-script" type="application/json">${rowsJson}</script>
  <script id="columns-script" type="application/json">${columnsJson}</script>
  <script id="cards-script" type="application/json">${cardsJson}</script>
  <script id="slicers-script" type="application/json">${slicersJson}</script>

  <!-- Interactive Logic Script -->
  <script>
    // 1. Core State
    let rawData = [];
    let columns = [];
    let cards = [];
    let slicers = [];
    
    let currentFilters = {}; // columnName -> Set of selected values
    let chartInstances = {}; // cardId -> ChartJS instance
    
    // Pagination for card tables
    let tablePagination = {}; // cardId -> currentPage

    // 2. Initialize
    window.addEventListener('DOMContentLoaded', () => {
      // Parse embedded data
      try {
        rawData = JSON.parse(document.getElementById('raw-data-script').textContent);
        columns = JSON.parse(document.getElementById('columns-script').textContent);
        cards = JSON.parse(document.getElementById('cards-script').textContent);
        slicers = JSON.parse(document.getElementById('slicers-script').textContent);
      } catch (err) {
        console.error("Error parsing embedded data:", err);
      }

      // Set timestamp
      const now = new Date();
      document.getElementById('export-time').innerText = now.toLocaleString('zh-Hant');

      // Initialize filter state
      slicers.forEach(s => {
        currentFilters[s.columnName] = new Set();
      });

      // Render Slicer Sidebar UI
      renderSlicerSidebar();

      // Render Empty Dashboard Card Skeleton elements
      buildDashboardSkeleton();

      // Execute Filter & Update for the first time
      runFilterAndRender();

      // Initialize lucide icons
      lucide.createIcons();

      // Initialize theme/appearance mode
      const savedMode = localStorage.getItem('dashboard-appearance-mode') || 'light';
      document.getElementById('export-theme-mode').value = savedMode;
      setThemeMode(savedMode);
    });

    // 3. Render Slicer Sidebar Controls
    function renderSlicerSidebar() {
      const container = document.getElementById('slicer-container');
      const noMsg = document.getElementById('no-slicers-msg');
      container.innerHTML = '';

      if (slicers.length === 0) {
        noMsg.classList.remove('hidden');
        return;
      }
      noMsg.classList.add('hidden');

      slicers.forEach((slic, idx) => {
        const colName = slic.columnName;
        const colInfo = columns.find(c => c.name === colName);
        if (!colInfo) return;

        // Extract all unique values from rawData
        const uniqueValues = Array.from(new Set(
          rawData.map(row => {
            const val = row[colName];
            return val !== undefined && val !== null ? String(val).trim() : 'Blank';
          })
        )).sort();

        const filterBox = document.createElement('div');
        filterBox.className = 'border-b border-slate-100 dark:border-slate-800 pb-4 mb-4 last:border-0 last:pb-0 last:mb-0';
        
        // Search bar id
        const searchId = \`search-\${idx}\`;
        
        filterBox.innerHTML = \`
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate" title="\${colName}">\${colName}</span>
            <div class="flex items-center gap-1.5 text-[10px]">
              <button onclick="toggleAllSlicerValues('\${colName}', true)" class="text-brand-600 dark:text-brand-400 hover:underline">全選</button>
              <span class="text-slate-300 dark:text-slate-700">|</span>
              <button onclick="toggleAllSlicerValues('\${colName}', false)" class="text-slate-500 dark:text-slate-400 hover:underline">清空</button>
            </div>
          </div>
          
          <!-- Search in slicer -->
          \${uniqueValues.length > 6 ? \`
          <div class="relative mb-2">
            <input type="text" id="\${searchId}" onkeyup="filterSlicerList('\${colName}', '\${searchId}')" placeholder="搜尋項目..." 
                   class="w-full text-xs pl-7 pr-3 py-1 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-md focus:outline-none focus:border-brand-600 focus:ring-0" />
            <i data-lucide="search" class="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2"></i>
          </div>
          \` : ''}

          <div id="list-\${colName}" class="max-h-40 overflow-y-auto custom-scrollbar space-y-1.5 pr-1 text-xs">
            \${uniqueValues.map(val => {
              const checked = currentFilters[colName].has(val) ? 'checked' : '';
              return \`
                <label class="flex items-start gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer select-none transition-colors py-0.5" data-val="\${val.toLowerCase()}">
                  <input type="checkbox" data-column="\${colName}" value="\${val}" onchange="handleSlicerChange(this)"
                         class="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-brand-600 focus:ring-brand-600 w-3.5 h-3.5 mt-0.5" \${checked} />
                  <span class="truncate" title="\${val}">\${val === '' || val === 'Blank' ? '<em>(空白)</em>' : val}</span>
                </label>
              \`;
            }).join('')}
          </div>
        \`;

        container.appendChild(filterBox);
      });
      lucide.createIcons();
    }

    // Dynamic filtering within the slicer list
    function filterSlicerList(colName, searchInputId) {
      const q = document.getElementById(searchInputId).value.toLowerCase();
      const listDiv = document.getElementById(\`list-\${colName}\`);
      const labels = listDiv.getElementsByTagName('label');
      
      for (let label of labels) {
        const valAttr = label.getAttribute('data-val') || '';
        if (valAttr.includes(q)) {
          label.classList.remove('hidden');
          label.classList.add('flex');
        } else {
          label.classList.remove('flex');
          label.classList.add('hidden');
        }
      }
    }

    // Toggle all slicer values on/off
    function toggleAllSlicerValues(colName, selectAll) {
      const uniqueValues = Array.from(new Set(
        rawData.map(row => {
          const val = row[colName];
          return val !== undefined && val !== null ? String(val).trim() : 'Blank';
        })
      )).sort();

      const filterSet = currentFilters[colName];
      filterSet.clear();

      if (!selectAll) {
        // Clear all (which technically means filtering to everything excluded, or in standard dashboard logic:
        // if nothing is checked, it acts as select all? Let's check common BI rules.
        // Usually: if no filters are checked, it means show all. If any check, filter by that.
        // Let's implement that: if set is empty, show everything.
      } else {
        // If select all, let's keep set empty as well (empty Set acts as no filter, meaning show all).
        // Or we check all of them.
      }

      // Update checkboxes in DOM
      const checkboxes = document.querySelectorAll(\`input[data-column="\${colName}"]\`);
      checkboxes.forEach(cb => {
        cb.checked = selectAll;
        if (selectAll) {
          // If we want to filter to only these, we can add them to set
          filterSet.add(cb.value);
        }
      });

      // If selectAll is true, technically filtering to everything is same as no filter. We can just clear the set
      if (selectAll) {
        filterSet.clear();
      }

      runFilterAndRender();
    }

    // Handle single checkbox click
    function handleSlicerChange(input) {
      const colName = input.getAttribute('data-column');
      const val = input.value;
      const checked = input.checked;

      const filterSet = currentFilters[colName];
      if (checked) {
        filterSet.add(val);
      } else {
        filterSet.delete(val);
      }

      runFilterAndRender();
    }

    // Reset all filters in sidebar
    function resetFilters() {
      Object.keys(currentFilters).forEach(key => {
        currentFilters[key].clear();
      });

      // Uncheck everything
      const checkboxes = document.querySelectorAll('input[type="checkbox"]');
      checkboxes.forEach(cb => {
        cb.checked = false;
      });

      runFilterAndRender();
    }

    // 4. Data Filter Engine
    function runFilterAndRender() {
      // Determine active filters
      let isFiltering = false;
      const activeFilterColumns = [];

      Object.keys(currentFilters).forEach(col => {
        if (currentFilters[col].size > 0) {
          isFiltering = true;
          activeFilterColumns.push(col);
        }
      });

      // Filter rows
      let filteredData = rawData;
      if (isFiltering) {
        filteredData = rawData.filter(row => {
          return activeFilterColumns.every(col => {
            const val = row[col];
            const strVal = val !== undefined && val !== null ? String(val).trim() : 'Blank';
            return currentFilters[col].has(strVal);
          });
        });
      }

      // Update Top Status Bar
      const summaryBar = document.getElementById('filter-summary-bar');
      const badge = document.getElementById('active-filter-badge');

      if (isFiltering) {
        summaryBar.classList.remove('hidden');
        summaryBar.classList.add('flex');
        
        badge.classList.remove('hidden');
        badge.innerText = \`已套用 \${activeFilterColumns.length} 個篩選\`;

        const countSpan = document.getElementById('filtered-count');
        const pctSpan = document.getElementById('filtered-pct');
        countSpan.innerText = filteredData.length.toLocaleString();
        
        const pct = ((filteredData.length / rawData.length) * 100).toFixed(1);
        pctSpan.innerText = pct + '%';
      } else {
        summaryBar.classList.remove('flex');
        summaryBar.classList.add('hidden');
        badge.classList.add('hidden');
      }

      // Update Cards
      updateDashboardCards(filteredData);
    }

    // 5. Build Dashboard Skeleton Grid
    function buildDashboardSkeleton() {
      const grid = document.getElementById('dashboard-grid');
      grid.innerHTML = '';

      if (cards.length === 0) {
        grid.innerHTML = \`
          <div class="col-span-1 md:col-span-6 flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500">
            <i data-lucide="layout" class="w-12 h-12 stroke-1 mb-3"></i>
            <p class="text-sm">尚未設定任何資訊卡片。</p>
          </div>
        \`;
        return;
      }

      cards.forEach((card, idx) => {
        // Determine grid colspan based on card width
        let colSpanClass = 'col-span-1 md:col-span-6';
        if (card.width === '1/3') colSpanClass = 'col-span-1 md:col-span-2';
        else if (card.width === '1/2') colSpanClass = 'col-span-1 md:col-span-3';
        else if (card.width === '2/3') colSpanClass = 'col-span-1 md:col-span-4';

        const cardElement = document.createElement('div');
        cardElement.id = \`card-\${card.id}\`;
        cardElement.className = \`bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-3.5 flex flex-col h-fit overflow-hidden transition-colors duration-200 \${colSpanClass}\`;
        
        // Inside structure based on Card Type
        if (card.type === 'metric') {
          cardElement.innerHTML = \`
            <div class="flex items-center justify-between mb-1.5">
              <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate" title="\${card.title}">\${card.title}</span>
              <div class="p-1.5 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-lg">
                <i data-lucide="calculator" class="w-3.5 h-3.5"></i>
              </div>
            </div>
            <div class="flex flex-col mt-0.5">
              <span id="metric-val-\${card.id}" class="text-2xl font-bold text-slate-900 dark:text-white tracking-tight font-display">0</span>
              <span id="metric-sub-\${card.id}" class="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 truncate"></span>
            </div>
          \`;
        } else if (card.type === 'chart') {
          cardElement.innerHTML = \`
            <div class="flex items-center justify-between mb-2 border-b border-slate-100 dark:border-slate-800 pb-1.5">
              <span class="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate" title="\${card.title}">\${card.title}</span>
              <div class="p-1 bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 rounded">
                <i data-lucide="bar-chart-3" class="w-3.5 h-3.5"></i>
              </div>
            </div>
            <div class="relative h-52 w-full flex items-center justify-center">
              <canvas id="chart-canvas-\${card.id}"></canvas>
            </div>
          \`;
        } else if (card.type === 'table') {
          tablePagination[card.id] = 0; // page 0
          cardElement.innerHTML = \`
            <div class="flex items-center justify-between mb-2 border-b border-slate-100 dark:border-slate-800 pb-1.5">
              <span class="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate" title="\${card.title}">\${card.title}</span>
              <span class="text-[9px] bg-slate-100 dark:bg-slate-800 px-2 py-0.25 rounded text-slate-500 dark:text-slate-400 font-mono" id="table-badge-\${card.id}"></span>
            </div>
            <div class="overflow-x-auto custom-scrollbar border border-slate-100 dark:border-slate-800 rounded-lg mb-2">
              <table class="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr id="th-\${card.id}" class="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                    <!-- Column headers -->
                  </tr>
                </thead>
                <tbody id="tb-\${card.id}" class="text-slate-600 dark:text-slate-300 divide-y divide-slate-100 dark:divide-slate-800">
                  <!-- Row data -->
                </tbody>
              </table>
            </div>
            <!-- Pagination -->
            <div class="flex items-center justify-between mt-auto pt-1.5 text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-50 dark:border-slate-800">
              <span id="table-info-\${card.id}"></span>
              <div class="flex gap-1">
                <button id="btn-prev-\${card.id}" class="px-1.5 py-0.5 bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 text-[10px]" disabled>上一頁</button>
                <button id="btn-next-\${card.id}" class="px-1.5 py-0.5 bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 text-[10px]" disabled>下一頁</button>
              </div>
            </div>
          \`;
        }

        grid.appendChild(cardElement);
      });
      lucide.createIcons();
    }

    // 6. Update Cards Content Dynamically based on Filtered Data
    function updateDashboardCards(filteredRows) {
      cards.forEach(card => {
        if (card.type === 'metric') {
          renderMetricCard(card, filteredRows);
        } else if (card.type === 'chart') {
          renderChartCard(card, filteredRows);
        } else if (card.type === 'table') {
          renderTableCard(card, filteredRows);
        }
      });
    }

    // A. Render single metric card
    function renderMetricCard(card, filteredRows) {
      const config = card.metric;
      if (!config) return;

      const valSpan = document.getElementById(\`metric-val-\${card.id}\`);
      const subSpan = document.getElementById(\`metric-sub-\${card.id}\`);

      const colName = config.column;
      const op = config.operation;

      // Extract numeric values
      const numbers = filteredRows
        .map(r => Number(r[colName]))
        .filter(n => !isNaN(n));

      let result = 0;
      if (numbers.length > 0) {
        if (op === 'SUM') result = numbers.reduce((a, b) => a + b, 0);
        else if (op === 'AVG') result = numbers.reduce((a, b) => a + b, 0) / numbers.length;
        else if (op === 'COUNT') result = filteredRows.length;
        else if (op === 'MIN') result = Math.min(...numbers);
        else if (op === 'MAX') result = Math.max(...numbers);
        else if (op === 'MEDIAN') {
          const sorted = [...numbers].sort((a, b) => a - b);
          const mid = Math.floor(sorted.length / 2);
          result = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
        }
      } else {
        if (op === 'COUNT') result = filteredRows.length;
      }

      // Format result
      let formatted = result.toLocaleString(undefined, { maximumFractionDigits: 2 });
      if (config.prefix) formatted = config.prefix + ' ' + formatted;
      if (config.suffix) formatted = formatted + ' ' + config.suffix;

      valSpan.innerText = formatted;
      subSpan.innerText = \`欄位: \${colName} (\${op})\`;
    }

    // B. Render single chart card
    function renderChartCard(card, filteredRows) {
      const config = card.chart;
      if (!config) return;

      const canvasId = \`chart-canvas-\${card.id}\`;
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;

      // Detect dark mode status
      const isDark = document.documentElement.classList.contains('dark');
      const textColor = isDark ? '#94a3b8' : '#475569';
      const gridColor = isDark ? '#334155' : '#e2e8f0';

      // Group & Aggregate Data for Chart
      const xCol = config.xAxisColumn;
      const yCol = config.yAxisColumn;
      const method = config.aggregate;

      let labels = [];
      let dataPoints = [];

      if (method === 'RAW') {
        const sliced = filteredRows.slice(0, 100);
        labels = sliced.map((r, i) => String(r[xCol] || \`Row \${i + 1}\`));
        dataPoints = sliced.map(r => isNaN(Number(r[yCol])) ? 0 : Number(r[yCol]));
      } else {
        const groups = {};
        filteredRows.forEach(row => {
          const xVal = String(row[xCol] ?? 'Blank');
          const yVal = isNaN(Number(row[yCol])) ? 0 : Number(row[yCol]);
          if (!groups[xVal]) groups[xVal] = [];
          groups[xVal].push(yVal);
        });

        // Calculate aggregate
        Object.keys(groups).forEach(key => {
          labels.push(key);
          const list = groups[key];
          if (method === 'SUM') {
            dataPoints.push(list.reduce((a, b) => a + b, 0));
          } else if (method === 'AVG') {
            dataPoints.push(list.reduce((a, b) => a + b, 0) / list.length);
          }
        });
      }

      // Destroy old chart if exists
      if (chartInstances[card.id]) {
        chartInstances[card.id].destroy();
      }

      // Premium styling colors
      const bgColors = ${JSON.stringify(theme.pieColors)};
      const borderColors = bgColors;

      // Configure Chart Type
      let chartType = config.type;
      if (chartType === 'area') chartType = 'line'; // Chart.js handles Area via Line with fill:true

      const chartConfig = {
        type: chartType,
        data: {
          labels: labels,
          datasets: [{
            label: \`\${yCol} (\${method})\`,
            data: dataPoints,
            backgroundColor: config.type === 'pie' ? bgColors : bgColors[0],
            borderColor: config.type === 'pie' ? borderColors : borderColors[0],
            borderWidth: 1.5,
            fill: config.type === 'area',
            tension: 0.35,
            pointRadius: 4,
            pointHoverRadius: 6,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: config.type === 'pie',
              position: 'bottom',
              labels: {
                boxWidth: 12,
                color: textColor,
                font: { size: 10 }
              }
            }
          },
          scales: config.type === 'pie' ? {} : {
            y: {
              beginAtZero: true,
              grid: { color: gridColor },
              ticks: { color: textColor, font: { size: 10, family: 'Inter' } }
            },
            x: {
              grid: { display: false },
              ticks: { color: textColor, font: { size: 10, family: 'Inter' } }
            }
          }
        }
      };

      // Create new instance
      chartInstances[card.id] = new Chart(canvas, chartConfig);
    }

    // C. Render single Table Card (with client-side pagination)
    function renderTableCard(card, filteredRows) {
      const config = card.table;
      if (!config) return;

      const cardId = card.id;
      const displayCols = config.columns.length > 0 ? config.columns : Object.keys(filteredRows[0] || {});
      const pageSize = config.pageSize || 10;
      
      const totalRows = filteredRows.length;
      const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
      
      // Keep current page within boundaries
      if (tablePagination[cardId] >= totalPages) {
        tablePagination[cardId] = totalPages - 1;
      }
      if (tablePagination[cardId] < 0) {
        tablePagination[cardId] = 0;
      }
      
      const currPage = tablePagination[cardId];
      const startIdx = currPage * pageSize;
      const endIdx = Math.min(startIdx + pageSize, totalRows);
      const slicedRows = filteredRows.slice(startIdx, endIdx);

      // Render Headers
      const thTr = document.getElementById(\`th-\${cardId}\`);
      thTr.innerHTML = displayCols.map(col => \`
        <th class="px-2 py-1 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-100 dark:border-slate-800 text-left shrink-0 truncate max-w-[150px]" title="\${col}">\${col}</th>
      \`).join('');

      // Render Rows
      const tb = document.getElementById(\`tb-\${cardId}\`);
      tb.innerHTML = '';

      if (slicedRows.length === 0) {
        tb.innerHTML = \`
          <tr>
            <td colspan="\${displayCols.length}" class="px-2 py-4 text-center text-slate-400 dark:text-slate-500 italic">
              無相符資料。
            </td>
          </tr>
        \`;
      } else {
        slicedRows.forEach(row => {
          const rowHtml = displayCols.map(col => {
            const rawVal = row[col];
            const strVal = rawVal !== undefined && rawVal !== null ? String(rawVal) : '';
            const isNum = !isNaN(Number(rawVal)) && strVal !== '';
            const alignClass = isNum ? 'text-right' : 'text-left';
            return \`<td class="px-2 py-1 border-b border-slate-100 dark:border-slate-800 truncate max-w-[150px] \${alignClass}" title="\${strVal}">\${strVal}</td>\`;
          }).join('');
          
          const tr = document.createElement('tr');
          tr.className = 'hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors';
          tr.innerHTML = rowHtml;
          tb.appendChild(tr);
        });
      }

      // Update Pagination UI
      document.getElementById(\`table-badge-\${cardId}\`).innerText = \`共 \${totalRows} 筆\`;
      
      const infoSpan = document.getElementById(\`table-info-\${cardId}\`);
      if (totalRows > 0) {
        infoSpan.innerText = \`顯示 \${startIdx + 1} - \${endIdx} 筆，共 \${totalRows} 筆 (頁次 \${currPage + 1}/\${totalPages})\`;
      } else {
        infoSpan.innerText = '顯示 0 - 0 筆，共 0 筆';
      }

      // Hook up buttons
      const btnPrev = document.getElementById(\`btn-prev-\${cardId}\`);
      const btnNext = document.getElementById(\`btn-next-\${cardId}\`);

      btnPrev.disabled = currPage === 0;
      btnNext.disabled = currPage >= totalPages - 1;

      btnPrev.onclick = () => {
        tablePagination[cardId]--;
        renderTableCard(card, filteredRows);
      };

      btnNext.onclick = () => {
        tablePagination[cardId]++;
        renderTableCard(card, filteredRows);
      };
    }

    // Theme and Appearance Mode Support
    function setThemeMode(mode) {
      localStorage.setItem('dashboard-appearance-mode', mode);
      const root = document.documentElement;
      let isDark = false;
      
      if (mode === 'dark') {
        root.classList.add('dark');
        isDark = true;
      } else if (mode === 'light') {
        root.classList.remove('dark');
        isDark = false;
      } else {
        // system
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (isDark) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
      
      updateChartTheme(isDark);
    }

    function updateChartTheme(isDark) {
      const textColor = isDark ? '#94a3b8' : '#475569';
      const gridColor = isDark ? '#334155' : '#e2e8f0';
      
      Object.keys(chartInstances).forEach(cardId => {
        const chart = chartInstances[cardId];
        if (chart && chart.options && chart.options.scales) {
          if (chart.options.scales.x) {
            if (!chart.options.scales.x.ticks) chart.options.scales.x.ticks = {};
            chart.options.scales.x.ticks.color = textColor;
            if (!chart.options.scales.x.grid) chart.options.scales.x.grid = {};
            chart.options.scales.x.grid.color = gridColor;
          }
          if (chart.options.scales.y) {
            if (!chart.options.scales.y.ticks) chart.options.scales.y.ticks = {};
            chart.options.scales.y.ticks.color = textColor;
            if (!chart.options.scales.y.grid) chart.options.scales.y.grid = {};
            chart.options.scales.y.grid.color = gridColor;
          }
          chart.update();
        }
      });
    }

  </script>
</body>
</html>`;
}
