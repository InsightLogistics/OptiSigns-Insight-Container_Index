// --- Start of 16:9 Ratio Scaling Code ---

/**
 * This function calculates and applies the correct scale to the dashboard container
 * to maintain a strict 16:9 aspect ratio, centering it within the viewport.
 */
function resizeDashboard() {
    const container = document.querySelector('.container');
    const wrapper = document.querySelector('#viewport-wrapper');

    // If the necessary elements don't exist, stop the function.
    if (!container || !wrapper) {
        console.error("Dashboard container or wrapper not found. Resizing will not work.");
        return;
    }

    // The dashboard's fixed design resolution (16:9).
    const baseWidth = 1920;
    const baseHeight = 1080;

    // The browser window's current inner dimensions.
    const availableWidth = window.innerWidth;
    const availableHeight = window.innerHeight;

    // Calculate the scale ratio by comparing the available space to the base resolution.
    // We use Math.min to ensure the dashboard fits within the smaller of the two dimensions (width or height).
    const scale = Math.min(availableWidth / baseWidth, availableHeight / baseHeight);

    // Apply the calculated scale using a CSS transform.
    container.style.transform = `scale(${scale})`;

    // To keep the scaled container centered, calculate the leftover space and apply it as a margin.
    // This is necessary because transform-origin is set to the top-left corner in the CSS.
    const newWidth = baseWidth * scale;
    const newHeight = baseHeight * scale;
    container.style.marginLeft = `${(availableWidth - newWidth) / 2}px`;
    container.style.marginTop = `${(availableHeight - newHeight) / 2}px`;
}

// --- End of 16:9 Ratio Scaling Code ---


// --- Start of Original Dashboard Logic ---

let KCCIChart;
let SCFIChart;
let WCIChart;
let IACIChart;
let blankSailingChart;
let FBXChart;
let XSIChart;
let MBCIChart;
let exchangeRateChart;

const DATA_JSON_URL = 'data/crawling_data.json';

document.addEventListener('DOMContentLoaded', () => {
    // Call resizeDashboard once the DOM is loaded to set the initial size.
    resizeDashboard();
    
    const setupChart = (chartId, type, datasets, additionalOptions = {}, isAggregated = false) => {
        const ctx = document.getElementById(chartId);
        if (ctx) {
            if (Chart.getChart(chartId)) {
                Chart.getChart(chartId).destroy();
            }

            const defaultOptions = {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: false // X축 타이틀 제거
                        },
                        type: 'time',
                        time: {
                            unit: 'month', // 가로축 단위를 월별로 고정
                            displayFormats: {
                                month: 'MM/01/yy' // 월별 형식 변경
                            },
                            tooltipFormat: 'M/d/yyyy'
                        },
                        ticks: {
                            source: 'auto',
                            autoSkipPadding: 10,
                            maxTicksLimit: 12 // 지난 1년 기준 월별 12개 눈금 배치
                        },
                        grid: {
                            display: false // 가로축 보조선은 유지
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: false // Y축 타이틀 제거
                        },
                        ticks: {
                            count: 5 // 세로 기준 5개 유지
                        },
                        grid: {
                            display: true, // 세로축 보조선 표시
                            color: 'rgba(0, 0, 0, 0.1)' // 보조선 색상 설정
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'right',
                        labels: {
                            usePointStyle: false, 
                            generateLabels: function(chart) {
                                const originalLabels = Chart.defaults.plugins.legend.labels.generateLabels(chart);
                                return originalLabels.map(label => {
                                    label.lineWidth = 0; 
                                    label.strokeStyle = 'transparent'; 
                                    return label;
                                });
                            }
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                elements: {
                    point: {
                        radius: 0
                    }
                }
            };

            const options = { ...defaultOptions, ...additionalOptions };
            if (options.scales && additionalOptions.scales) {
                options.scales = { ...defaultOptions.scales, ...additionalOptions.scales };
                if (options.scales.x && additionalOptions.scales.x) {
                    options.scales.x = { ...defaultOptions.scales.x, ...additionalOptions.scales.x };
                }
                if (options.scales.y && additionalOptions.scales.y) {
                    options.scales.y = { ...defaultOptions.scales.y, ...additionalOptions.scales.y };
                    if (!additionalOptions.scales.y.ticks || !additionalOptions.scales.y.ticks.hasOwnProperty('count')) {
                        options.scales.y.ticks.count = defaultOptions.scales.y.ticks.count;
                    }
                }
            }

            let chartData = { datasets: datasets };
            if (type === 'bar' && additionalOptions.labels) {
                chartData = { labels: additionalOptions.labels, datasets: datasets };
                delete additionalOptions.labels;
            }

            return new Chart(ctx, {
                type: type,
                data: chartData,
                options: options
            });
        }
        return null;
    };

    const colors = [
        'rgba(0, 101, 126, 0.8)',   // Dark Teal
        'rgba(0, 58, 82, 0.8)',    // Darker Blue
        'rgba(40, 167, 69, 0.8)',   // Green
        'rgba(253, 126, 20, 0.8)',  // Orange
        'rgba(111, 66, 193, 0.8)',  // Purple
        'rgba(220, 53, 69, 0.8)',   // Red
        'rgba(23, 162, 184, 0.8)',  // Cyan
        'rgba(108, 117, 125, 0.8)', // Gray
        'rgba(255, 193, 7, 0.8)',   // Yellow
        'rgba(52, 58, 64, 0.8)',    // Dark Gray
        'rgba(200, 100, 0, 0.8)',   // Brown
        'rgba(0, 200, 200, 0.8)',   // Light Blue
        'rgba(150, 50, 100, 0.8)',  // Plum
        'rgba(50, 150, 50, 0.8)',   // Forest Green
        'rgba(250, 100, 150, 0.8)', // Pink
        'rgba(100, 100, 200, 0.8)'  // Medium Blue
    ];

    const borderColors = [
        '#00657e', '#003A52', '#218838', '#e68a00', '#5a32b2', '#c82333',
        '#138496', '#6c757d', '#ffc107', '#343a40', '#c86400', '#00c8c8',
        '#963264', '#329632', '#fa6496', '#6464c8'
    ];

    let colorIndex = 0;
    const getNextColor = () => {
        const color = colors[colorIndex % colors.length];
        colorIndex++;
        return color;
    };

    const aggregateDataByMonth = (data, numMonths = 12) => {
        if (data.length === 0) return { aggregatedData: [], monthlyLabels: [] };

        data.sort((a, b) => new Date(a.date) - new Date(b.date));

        const monthlyDataMap = new Map();
        const latestDate = new Date(data[data.length - 1].date);
        const startDate = new Date(latestDate);
        startDate.setMonth(latestDate.getMonth() - (numMonths - 1));

        const allMonthKeys = [];
        let currentMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
        while (currentMonth <= latestDate) {
            allMonthKeys.push(`${currentMonth.getFullYear()}-${(currentMonth.getMonth() + 1).toString().padStart(2, '0')}`);
            currentMonth.setMonth(currentMonth.getMonth() + 1);
        }

        data.forEach(item => {
            const date = new Date(item.date);
            const yearMonth = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            if (!monthlyDataMap.has(yearMonth)) {
                monthlyDataMap.set(yearMonth, {});
            }
            const monthEntry = monthlyDataMap.get(yearMonth);
            for (const key in item) {
                if (key !== 'date' && item[key] !== null && !isNaN(item[key])) {
                    if (!monthEntry[key]) {
                        monthEntry[key] = { sum: 0, count: 0 };
                    }
                    monthEntry[key].sum += item[key];
                    monthEntry[key].count++;
                }
            }
        });

        const aggregatedData = [];
        const monthlyLabels = [];
        const allDataKeys = new Set();
        if (data.length > 0) {
            Object.keys(data[0]).forEach(key => {
                if (key !== 'date') allDataKeys.add(key);
            });
        }

        allMonthKeys.forEach(yearMonth => {
            const monthEntry = monthlyDataMap.get(yearMonth);
            const newEntry = { date: yearMonth + '-01' };
            allDataKeys.forEach(key => {
                newEntry[key] = monthEntry && monthEntry[key] && monthEntry[key].count > 0
                                ? monthEntry[key].sum / monthEntry[key].count
                                : null;
            });
            aggregatedData.push(newEntry);
            monthlyLabels.push(yearMonth + '-01');
        });

        return { aggregatedData: aggregatedData, monthlyLabels: monthlyLabels };
    };

    const setupSlider = (slidesSelector, intervalTime) => {
        const slides = document.querySelectorAll(slidesSelector);
        let currentSlide = 0;

        const showSlide = (index) => {
            slides.forEach((slide, i) => {
                slide.classList.toggle('active', i === index);
            });
        };

        const nextSlide = () => {
            currentSlide = (currentSlide + 1) % slides.length;
            showSlide(currentSlide);
        };

        if (slides.length > 1) {
            showSlide(currentSlide);
            if (slides[0].dataset.intervalId) {
                clearInterval(parseInt(slides[0].dataset.intervalId));
            }
            const intervalId = setInterval(nextSlide, intervalTime);
            slides[0].dataset.intervalId = intervalId.toString();
        } else if (slides.length > 0) {
            showSlide(0);
        }
    };

    const cityTimezones = {
        'la': 'America/Los_Angeles', 'ny': 'America/New_York', 'paris': 'Europe/Paris',
        'shanghai': 'Asia/Shanghai', 'seoul': 'Asia/Seoul', 'sydney': 'Australia/Sydney'
    };

    function updateWorldClocks() {
        const now = new Date();
        for (const cityKey in cityTimezones) {
            const timeElement = document.getElementById(`time-${cityKey}`);
            if (timeElement) {
                const timeString = now.toLocaleTimeString('en-US', {
                    timeZone: cityTimezones[cityKey],
                    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
                });
                timeElement.textContent = timeString;
            }
        }
    }
    
    const formatDateForTable = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date)) return '';
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${month}-${day}-${year}`;
    };

    const renderTable = (containerId, headers, rows, headerDates = {}) => {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';
        if (!headers || headers.length === 0 || !rows || rows.length === 0) {
            container.innerHTML = '<p class="text-gray-600 text-center">No data available.</p>';
            return;
        }

        const table = document.createElement('table');
        table.className = 'data-table';
        const thead = table.createTHead();
        const headerRow = thead.insertRow();
        headers.forEach(headerText => {
            const th = document.createElement('th');
            if (headerText.includes('Current Index') && headerDates.currentIndexDate) {
                th.innerHTML = `Current Index<br><span class="table-date-header">${headerDates.currentIndexDate}</span>`;
            } else if (headerText.includes('Previous Index') && headerDates.previousIndexDate) {
                th.innerHTML = `Previous Index<br><span class="table-date-header">${headerDates.previousIndexDate}</span>`;
            } else {
                th.textContent = headerText;
            }
            headerRow.appendChild(th);
        });

        const tbody = table.createTBody();
        rows.forEach(rowData => {
            const tr = tbody.insertRow();
            headers.forEach(header => {
                const td = tr.insertCell();
                let content = '-';
                let colorClass = '';

                if (header.includes('Weekly Change')) {
                    const weeklyChange = rowData.weekly_change;
                    if (weeklyChange?.value !== undefined && weeklyChange?.percentage !== undefined) {
                        const valueAsRoundedInteger = Math.round(weeklyChange.value);
                        content = `${valueAsRoundedInteger} (${weeklyChange.percentage})`;
                        colorClass = weeklyChange.color_class || '';
                    }
                } else if (header.includes('Current Index')) {
                    content = rowData.current_index ?? '-';
                } else if (header.includes('Previous Index')) {
                    content = rowData.previous_index ?? '-';
                } else if (header.toLowerCase().includes('route')) {
                    content = rowData.route ? rowData.route.split('_').slice(1).join('_') : '-';
                } else {
                    content = rowData[header.toLowerCase().replace(/\s/g, '_')] ?? '-';
                }
                td.textContent = content;
                if (colorClass) td.className = colorClass;
            });
        });
        container.appendChild(table);
    };
    
    const routeToDataKeyMap = {
        KCCI: { "종합지수": "KCCI_Composite_Index", "미주서안": "KCCI_US_West_Coast", "미주동안": "KCCI_US_East_Coast", "유럽": "KCCI_Europe", "지중해": "KCCI_Mediterranean", "중동": "KCCI_Middle_East", "호주": "KCCI_Australia", "남미동안": "KCCI_South_America_East_Coast", "남미서안": "KCCI_South_America_West_Coast", "남아프리카": "KCCI_South_Africa", "서아프리카": "KCCI_West_Africa", "중국": "KCCI_China", "일본": "KCCI_Japan", "동남아시아": "KCCI_Southeast_Asia" },
        SCFI: { "종합지수": "SCFI_Composite_Index", "미주서안": "SCFI_US_West_Coast", "미주동안": "SCFI_US_East_Coast", "북유럽": "SCFI_North_Europe", "지중해": "SCFI_Mediterranean", "동남아시아": "SCFI_Southeast_Asia", "중동": "SCFI_Middle_East", "호주/뉴질랜드": "SCFI_Australia_New_Zealand", "남아메리카": "SCFI_South_America", "일본서안": "SCFI_Japan_West_Coast", "일본동안": "SCFI_Japan_East_Coast", "한국": "SCFI_Korea", "동부/서부 아프리카": "SCFI_East_West_Africa", "남아공": "SCFI_South_Africa" },
        WCI: { "종합지수": "WCI_Composite_Index", "상하이 → 로테르담": "WCI_Shanghai_Rotterdam", "로테르담 → 상하이": "WCI_Rotterdam_Shanghai", "상하이 → 제노바": "WCI_Shanghai_Genoa", "상하이 → 로스엔젤레스": "WCI_Shanghai_to_Los_Angeles", "로스엔젤레스 → 상하이": "WCI_Los_Angeles_to_Shanghai", "상하이 → 뉴욕": "WCI_Shanghai_New_York", "뉴욕 → 로테르담": "WCI_New_York_Rotterdam", "로테르담 → 뉴욕": "WCI_Rotterdam_New_York" },
        IACI: { "종합지수": "IACI_Composite_Index" },
        BLANKSAILING: { "Gemini Cooperation": "BLANKSAILING_Gemini_Cooperation", "MSC": "BLANKSAILING_MSC", "OCEAN Alliance": "BLANKSAILING_OCEAN_Alliance", "Premier Alliance": "BLANKSAILING_Premier_Alliance", "Others/Independent": "BLANKSAILING_Others_Independent", "Total": "BLANKSAILING_Total" },
        FBX: { "종합지수": "FBX_Composite_Index", "중국/동아시아 → 미주서안": "FBX_China_EA_US_West_Coast", "미주서안 → 중국/동아시아": "FBX_US_West_Coast_China_EA", "중국/동아시아 → 미주동안": "FBX_China_EA_US_East_Coast", "미주동안 → 중국/동아시아": "FBX_US_East_Coast_China_EA", "중국/동아시아 → 북유럽": "FBX_China_EA_North_Europe", "북유럽 → 중국/동아시아": "FBX_North_Europe_China_EA", "중국/동아시아 → 지중해": "FBX_China_EA_Mediterranean", "지중해 → 중국/동아시아": "FBX_Mediterranean_China_EA", "미주동안 → 북유럽": "FBX_US_East_Coast_North_Europe", "북유럽 → 미주동안": "FBX_North_Europe_US_East_Coast", "유럽 → 남미동안": "FBX_Europe_South_America_East_Coast", "유럽 → 남미서안": "FBX_Europe_South_America_West_Coast" },
        XSI: { "동아시아 → 북유럽": "XSI_East_Asia_North_Europe", "북유럽 → 동아시아": "XSI_North_Europe_East_Asia", "동아시아 → 미주서안": "XSI_East_Asia_US_West_Coast", "미주서안 → 동아시아": "XSI_US_West_Coast_East_Asia", "동아시아 → 남미동안": "XSI_East_Asia_South_America_East_Coast", "북유럽 → 미주동안": "XSI_North_Europe_US_East_Coast", "미주동안 → 북유럽": "XSI_US_East_Coast_North_Europe", "북유럽 → 남미동안": "XSI_North_Europe_South_America_East_Coast" },
        MBCI: { "종합지수": "MBCI_Value" }
    };

    const createDatasetsFromTableRows = (indexType, chartData, tableRows) => {
        const datasets = [];
        const mapping = routeToDataKeyMap[indexType];
        if (!mapping) return datasets;
        
        colorIndex = 0;
        
        tableRows.forEach(row => {
            const originalRouteName = row.route.split('_').slice(1).join('_');
            const dataKey = mapping[originalRouteName];
            
            if (dataKey !== null && dataKey !== undefined && row.current_index !== "") {
                const filteredMappedData = chartData
                    .map(item => ({ x: item.date, y: item[dataKey] }))
                    .filter(point => point.y != null);
                
                if (filteredMappedData.length > 0) {
                    const sharedColor = borderColors[colorIndex % borderColors.length];
                    colorIndex++;
                    
                    datasets.push({
                        label: originalRouteName,
                        data: filteredMappedData,
                        backgroundColor: sharedColor,
                        borderColor: sharedColor,
                        borderWidth: (originalRouteName.includes('종합지수')) ? 2 : 1,
                        fill: false
                    });
                }
            }
        });
        return datasets;
    };

    const weatherIconMapping = {
        'clear': '01d', '맑음': '01d', 'clouds': '02d', '구름': '02d',
        'partly cloudy': '02d', 'scattered clouds': '03d', 'broken clouds': '04d',
        'shower rain': '09d', 'rain': '10d', '비': '10d', 'thunderstorm': '11d',
        'snow': '13d', '눈': '13d', 'mist': '50d', 'fog': '50d',
        'haze': '50d', 'drizzle': '09d'
    };

    const weatherIconUrl = (status) => {
        const placeholder = `https://placehold.co/80x80/cccccc/ffffff?text=Icon`;
        if (!status) return placeholder;
        const lowerStatus = status.toLowerCase();
        for (const key in weatherIconMapping) {
            if (lowerStatus.includes(key)) {
                return `https://openweathermap.org/img/wn/${weatherIconMapping[key]}@2x.png`;
            }
        }
        return placeholder;
    };

    async function loadAndDisplayData() {
        try {
            const response = await fetch(DATA_JSON_URL);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const allDashboardData = await response.json();

            const { chart_data = {}, weather_data = {}, exchange_rate = [], table_data = {} } = allDashboardData;
            const { current = {}, forecast = [] } = weather_data;

            // Update Weather UI
            document.getElementById('temperature-current').textContent = current.LA_Temperature ? `${current.LA_Temperature}°F` : '--°F';
            document.getElementById('status-current').textContent = current.LA_WeatherStatus || 'Loading...';
            document.getElementById('weather-icon-current').src = weatherIconUrl(current.LA_WeatherStatus);
            document.getElementById('humidity-current').textContent = current.LA_Humidity ? `${current.LA_Humidity}%` : '--%';
            document.getElementById('wind-speed-current').textContent = current.LA_WindSpeed ? `${current.LA_WindSpeed} mph` : '-- mph';
            document.getElementById('pressure-current').textContent = current.LA_Pressure ? `${current.LA_Pressure} hPa` : '-- hPa';
            document.getElementById('visibility-current').textContent = current.LA_Visibility ? `${current.LA_Visibility} mile` : '-- mile';
            document.getElementById('sunrise-time').textContent = current.LA_Sunrise || '--';
            document.getElementById('sunset-time').textContent = current.LA_Sunset || '--';

            // Render Forecast Table
            const forecastContainer = document.getElementById('forecast-table-container');
            if (forecastContainer) {
                forecastContainer.innerHTML = '';
                if (forecast.length > 0) {
                    const table = document.createElement('table');
                    table.className = 'data-table forecast-table';
                    const colgroup = document.createElement('colgroup');
                    const col1 = document.createElement('col');
                    col1.style.width = '20%';
                    colgroup.appendChild(col1);
                    for (let i = 0; i < 5; i++) {
                        const col = document.createElement('col');
                        col.style.width = '16%';
                        colgroup.appendChild(col);
                    }
                    table.appendChild(colgroup);

                    const thead = table.createTHead();
                    const headerRow = thead.insertRow();
                    headerRow.insertCell(); // Empty cell
                    const displayForecast = forecast.slice(1, 6);
                    for (let i = 0; i < 5; i++) {
                        const th = document.createElement('th');
                        const day = displayForecast[i];
                        th.textContent = (day && day.date) ? `${day.date.split('/')[0]}/${day.date.split('/')[1]}` : '--';
                        headerRow.appendChild(th);
                    }

                    const tbody = table.createTBody();
                    ['Max (°F)', 'Min (°F)', 'Weather'].forEach((label, rowIndex) => {
                        const row = tbody.insertRow();
                        row.insertCell().textContent = label;
                        for (let i = 0; i < 5; i++) {
                            const day = displayForecast[i];
                            const td = row.insertCell();
                            if (rowIndex === 0) td.textContent = day?.max_temp ?? '--';
                            else if (rowIndex === 1) td.textContent = day?.min_temp ?? '--';
                            else td.textContent = day?.status ? day.status.replace(/\s*\(.*\)/, '').trim() : '--';
                        }
                    });
                    forecastContainer.appendChild(table);
                } else {
                    forecastContainer.innerHTML = '<p class="text-gray-600 text-center">No forecast data.</p>';
                }
            }

            // Update Exchange Rate UI
            const latestRate = exchange_rate.length > 0 ? exchange_rate[exchange_rate.length - 1].rate : null;
            document.getElementById('current-exchange-rate-value').textContent = latestRate ? `${latestRate.toFixed(2)} KRW` : 'Loading...';
            
            if (exchangeRateChart) exchangeRateChart.destroy();
            exchangeRateChart = setupChart('exchangeRateChartCanvas', 'line', [{
                label: 'USD/KRW Exchange Rate',
                data: exchange_rate.map(item => ({ x: item.date, y: item.rate })),
                backgroundColor: 'rgba(253, 126, 20, 0.5)',
                borderColor: '#e68a00',
                borderWidth: 2, fill: false, pointRadius: 0
            }], {
                scales: {
                    x: { time: { unit: 'day', displayFormats: { day: 'MM/dd' } }, ticks: { maxTicksLimit: undefined } },
                    y: { beginAtZero: false, ticks: { count: 5 } }
                },
                plugins: { legend: { display: false } }
            });

            const getLatestAndPreviousDates = (data) => {
                if (!data || data.length < 2) return { latestDate: null, previousDate: null };
                const sorted = [...data].sort((a, b) => new Date(b.date) - new Date(a.date));
                return { latestDate: sorted[0]?.date, previousDate: sorted[1]?.date };
            };

            // Process and render all index charts and tables
            ['KCCI', 'SCFI', 'WCI', 'IACI', 'FBX', 'XSI', 'MBCI'].forEach(index => {
                const chartData = chart_data[index] || [];
                const tableInfo = table_data[index] || { headers: [], rows: [] };
                const { latestDate, previousDate } = getLatestAndPreviousDates(chartData);
                const datasets = createDatasetsFromTableRows(index, chartData, tableInfo.rows);
                
                // Dynamically assign chart instance to global variable
                window[index + 'Chart'] = setupChart(`${index}Chart`, 'line', datasets, {}, false);
                
                renderTable(`${index}TableContainer`, tableInfo.headers, tableInfo.rows, {
                    currentIndexDate: formatDateForTable(latestDate),
                    previousIndexDate: formatDateForTable(previousDate)
                });
            });

            // Blank Sailing Chart and Table (special case: bar chart)
            const bsRawData = chart_data.BLANKSAILING || [];
            const { aggregatedData: aggBsData } = aggregateDataByMonth(bsRawData, 12);
            const bsTableInfo = table_data.BLANKSAILING || { headers: [], rows: [] };
            const { latestDate: bsLatest, previousDate: bsPrev } = getLatestAndPreviousDates(bsRawData);
            
            colorIndex = 0; // Reset color index for this specific chart
            const bsDatasets = [
                "Gemini Cooperation", "MSC", "OCEAN Alliance", "Premier Alliance", "Others/Independent", "Total"
            ].map(label => ({
                label: label,
                data: aggBsData.map(item => ({ x: item.date, y: item[`BLANKSAILING_${label.replace(/[\s\/]/g, '_')}`] })),
                backgroundColor: getNextColor(),
                borderColor: 'rgba(0, 0, 0, 0)',
                borderWidth: 0
            })).filter(ds => ds.data.some(p => p.y != null));

            if (blankSailingChart) blankSailingChart.destroy();
            blankSailingChart = setupChart('blankSailingChart', 'bar', bsDatasets, {
                scales: { x: { stacked: true }, y: { stacked: true } }
            }, true);
            renderTable('BLANKSAILINGTableContainer', bsTableInfo.headers, bsTableInfo.rows, {
                currentIndexDate: formatDateForTable(bsLatest),
                previousIndexDate: formatDateForTable(bsPrev)
            });

            // Setup sliders
            setupSlider('.chart-slider-container > .chart-slide', 10000);
            setupSlider('.top-info-slider-container > .top-info-slide', 10000);

            // Start world clocks
            updateWorldClocks();
            setInterval(updateWorldClocks, 1000);

        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            const chartSliderContainer = document.querySelector('.chart-slider-container');
            if (chartSliderContainer) {
                chartSliderContainer.innerHTML = '<p class="placeholder-text text-red-500">Error loading data. Please try again later.</p>';
            }
        }
    }

    loadAndDisplayData();
});

// Add an event listener to call resizeDashboard whenever the window is resized.
window.addEventListener('resize', resizeDashboar
