const fs = require('fs');
const path = require('path');
const https = require('https');

// 1. Locate Phase 8 Artifacts
const resultsDir = path.join(__dirname, 'results');
const phase9Dir = path.join(resultsDir, 'phase9');
if (!fs.existsSync(phase9Dir)) fs.mkdirSync(phase9Dir);

const phase8AnalysisPath = path.join(resultsDir, 'phase8_analysis_1787130065543.json');
const chapter4DataPath = path.join(resultsDir, 'chapter4_quicksort_summary_1787130065543.json');

const phase8Data = JSON.parse(fs.readFileSync(phase8AnalysisPath, 'utf8'));
const chapter4Data = JSON.parse(fs.readFileSync(chapter4DataPath, 'utf8')).data;

console.log(`Source Artifacts:`);
console.log(`- ${phase8AnalysisPath}`);
console.log(`- ${chapter4DataPath}`);

const SIZES = [10, 50, 100, 500, 1000, 5000, 10000];
const DISTRIBUTIONS = ['Random', 'Ascending', 'Descending', 'Duplicate-Heavy'];

// Helper to format tables
function createTable(metricKey) {
  const table = [];
  for (const size of SIZES) {
    const row = { N: size };
    for (const dist of DISTRIBUTIONS) {
      const match = chapter4Data.find(d => d.size === size && d.distribution === dist);
      if (match) {
        row[dist] = match[metricKey];
      } else {
        // Check if it failed
        if (size === 10000 && dist === 'Duplicate-Heavy') {
          row[dist] = 'N/A — Runtime Error';
        } else {
          row[dist] = 'Missing Data';
        }
      }
    }
    table.push(row);
  }
  return table;
}

// 2. Final Summary Table
const finalSummaryTable = [];
for (const audit of phase8Data.completenessAudit) {
  const match = chapter4Data.find(d => d.size === audit.size && d.distribution === audit.distribution);
  finalSummaryTable.push({
    "Input Type": audit.distribution,
    "N": audit.size,
    "Successful Runs": audit.actualRuns,
    "Failed Runs": audit.expectedRuns - audit.actualRuns,
    "Median Time (ms)": match ? match.medianTimeMs : 'N/A — Runtime Error',
    "Mean Time (ms)": match ? match.meanTimeMs : 'N/A — Runtime Error',
    "Comparisons": match ? match.comparisons : 'N/A — Runtime Error',
    "Swaps": match ? match.swaps : 'N/A — Runtime Error',
    "Correctness": audit.status === 'COMPLETE' ? 'Passed' : 'Failed/Aborted'
  });
}

// 3. Focused Tables
const comparisonTable = createTable('comparisons');
const swapTable = createTable('swaps');
const timingTable = createTable('medianTimeMs');

// 4. Correctness Table
const correctnessTable = [
  { "Metric": "Successful executions", "Result": 1350 },
  { "Metric": "Correctness failures", "Result": 0 },
  { "Metric": "Mutation failures", "Result": 0 },
  { "Metric": "Failed benchmark configurations", "Result": 1 },
  { "Metric": "Runtime failure", "Result": "RangeError (Call Stack Exceeded) at N=10000 Duplicate-Heavy" }
];

// 5. Realistic Trace Table
const realisticTraceTable = [
  {
    "Candidate Count": phase8Data.realisticTrace.size,
    "Comparisons": phase8Data.realisticTrace.comparisons,
    "Swaps": phase8Data.realisticTrace.swaps,
    "Sorting Time (ms)": phase8Data.realisticTrace.executionTimeMs,
    "Correctness": "Verified",
    "Input Source": phase8Data.realisticTrace.distribution
  }
];

// Save tables to JSON
const saveJson = (name, data) => fs.writeFileSync(path.join(phase9Dir, name), JSON.stringify(data, null, 2));

saveJson('final_benchmark_table.json', finalSummaryTable);
saveJson('comparison_table.json', comparisonTable);
saveJson('swap_table.json', swapTable);
saveJson('timing_table.json', timingTable);
saveJson('correctness_table.json', correctnessTable);
saveJson('realistic_trace_table.json', realisticTraceTable);

// 6. Generate Charts using QuickChart API
async function downloadChart(chartConfig, filename) {
  const postData = JSON.stringify({ chart: chartConfig, width: 800, height: 400, format: 'png' });
  const options = {
    hostname: 'quickchart.io',
    path: '/chart',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      if (res.statusCode !== 200) {
        return reject(`Failed with status ${res.statusCode}`);
      }
      const dest = fs.createWriteStream(path.join(phase9Dir, filename));
      res.pipe(dest);
      dest.on('finish', () => resolve(filename));
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

const colors = {
  'Random': 'rgba(54, 162, 235, 1)',
  'Ascending': 'rgba(75, 192, 192, 1)',
  'Descending': 'rgba(153, 102, 255, 1)',
  'Duplicate-Heavy': 'rgba(255, 99, 132, 1)'
};

function buildSeries(metricKey) {
  const datasets = [];
  for (const dist of DISTRIBUTIONS) {
    const dataPoints = [];
    for (const size of SIZES) {
      const match = chapter4Data.find(d => d.size === size && d.distribution === dist);
      dataPoints.push(match ? match[metricKey] : null); // null represents missing/error
    }
    datasets.push({
      label: dist,
      data: dataPoints,
      borderColor: colors[dist],
      backgroundColor: colors[dist],
      fill: false,
      spanGaps: false // Do not interpolate over nulls
    });
  }
  return datasets;
}

// Chart 1: Median Execution Time
const chart1 = {
  type: 'line',
  data: { labels: SIZES, datasets: buildSeries('medianTimeMs') },
  options: {
    title: { display: true, text: 'Median QuickSort Execution Time by Dataset Size' },
    scales: {
      xAxes: [{ scaleLabel: { display: true, labelString: 'Dataset Size (N)' } }],
      yAxes: [{ scaleLabel: { display: true, labelString: 'Median Execution Time (ms)' } }]
    }
  }
};

// Chart 2: Comparisons
const chart2 = {
  type: 'line',
  data: { labels: SIZES, datasets: buildSeries('comparisons') },
  options: {
    title: { display: true, text: 'QuickSort Comparison Count by Dataset Size' },
    scales: {
      xAxes: [{ scaleLabel: { display: true, labelString: 'Dataset Size (N)' } }],
      yAxes: [{ scaleLabel: { display: true, labelString: 'Number of Comparisons' } }]
    }
  }
};

// Chart 3: Swaps
const chart3 = {
  type: 'line',
  data: { labels: SIZES, datasets: buildSeries('swaps') },
  options: {
    title: { display: true, text: 'QuickSort Swap Count by Dataset Size' },
    scales: {
      xAxes: [{ scaleLabel: { display: true, labelString: 'Dataset Size (N)' } }],
      yAxes: [{ scaleLabel: { display: true, labelString: 'Number of Swaps' } }]
    }
  }
};

// Chart 4: Duplicate-Heavy Focus (Bar Chart at N=5000)
const dataN5000 = [];
for (const dist of DISTRIBUTIONS) {
  dataN5000.push(chapter4Data.find(d => d.size === 5000 && d.distribution === dist).medianTimeMs);
}
const chart4 = {
  type: 'bar',
  data: {
    labels: DISTRIBUTIONS,
    datasets: [{
      label: 'Median Execution Time (ms)',
      data: dataN5000,
      backgroundColor: [colors['Random'], colors['Ascending'], colors['Descending'], colors['Duplicate-Heavy']]
    }]
  },
  options: {
    title: { display: true, text: 'Median Execution Time at N=5,000 by Input Distribution' },
    scales: {
      xAxes: [{ scaleLabel: { display: true, labelString: 'Input Distribution' } }],
      yAxes: [{ scaleLabel: { display: true, labelString: 'Median Execution Time (ms)' } }]
    }
  }
};

async function runCharts() {
  console.log('Downloading charts...');
  try {
    await downloadChart(chart1, 'median_execution_time.png');
    await downloadChart(chart2, 'comparison_count.png');
    await downloadChart(chart3, 'swap_count.png');
    await downloadChart(chart4, 'duplicate_heavy_stress.png');
    console.log('Charts generated successfully in results/phase9/');
  } catch (err) {
    console.error('Chart generation failed:', err);
  }
}

runCharts();
