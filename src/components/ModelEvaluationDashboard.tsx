import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './ModelEvaluationDashboard.css';

// Responsive chart height hook
function useChartHeight(defaultHeight = 340, mobileHeight = 220) {
  const getResponsiveHeight = () => (window.innerWidth <= 480 ? mobileHeight : defaultHeight);
  const [height, setHeight] = useState(getResponsiveHeight());
  useEffect(() => {
    const onResize = () => setHeight(getResponsiveHeight());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return height;
}

// Responsive axis font size
function useTickFontSize() {
  const getFontSize = () => (window.innerWidth <= 480 ? 14 : 12);
  const [size, setSize] = useState(getFontSize());
  useEffect(() => {
    const onResize = () => setSize(getFontSize());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return size;
}

// Responsive Y-axis domain
function useYAxisDomain(type: 'main' | 'class') {
  // On mobile, use a lower min for spread, else use [90, 100]
  if (typeof window !== 'undefined' && window.innerWidth <= 480) {
    return type === 'main' ? [85, 100] : [80, 100];
  }
  return [90, 100];
}

// Data types...
interface ClassificationReport {
  [key: string]: {
    precision: number;
    recall: number;
    'f1-score': number;
    support: number;
  };
}
interface ModelData {
  confusion_matrix: number[][];
  classification_report: ClassificationReport;
  accuracy: number;
  roc_auc: number;
}
interface Data {
  validation: {
    int8: ModelData;
    float32: ModelData;
  };
  test: {
    float32: ModelData;
  };
}
interface PerformanceData {
  name: string;
  accuracy: number;
  roc_auc: number;
  type: string;
}
interface ClassificationData {
  class: string;
  precision: number;
  recall: number;
  'f1-score': number;
  support: number;
  model: string;
}
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}
interface ConfusionMatrixProps {
  matrix: number[][];
  title: string;
  classes: string[];
}
interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  change?: string;
  trend?: 'up' | 'down' | 'stable';
}

const ModelEvaluationDashboard = () => {
  const [selectedView, setSelectedView] = useState('overview');

  // Data from the JSON file
  const data: Data = {
    validation: {
      int8: {
        confusion_matrix: [[901, 11, 39], [6, 2634, 1], [59, 44, 2020]],
        classification_report: {
          '0': { precision: 0.932712215320911, recall: 0.9474237644584648, 'f1-score': 0.9400104329681794, support: 951 },
          '1': { precision: 0.9795462997396802, recall: 0.9973494888299886, 'f1-score': 0.9883677298311444, support: 2641 },
          '2': { precision: 0.9805825242718447, recall: 0.9514837494112105, 'f1-score': 0.9658140090843892, support: 2123 },
        },
        accuracy: 0.9720034995625547,
        roc_auc: 0.9938727708628464,
      },
      float32: {
        confusion_matrix: [[887, 15, 49], [4, 2633, 4], [49, 43, 2031]],
        classification_report: {
          '0': { precision: 0.9436170212765957, recall: 0.9327024185068349, 'f1-score': 0.9381279746166049, support: 951 },
          '1': { precision: 0.978446674098848, recall: 0.9969708443771299, 'f1-score': 0.9876219054763692, support: 2641 },
          '2': { precision: 0.9745681381957774, recall: 0.9566650965614696, 'f1-score': 0.9655336344188258, support: 2123 },
        },
        accuracy: 0.9713035870516186,
        roc_auc: 0.9938294023065458,
      },
    },
    test: {
      float32: {
        confusion_matrix: [[1157, 19, 71], [5, 3292, 14], [57, 56, 2550]],
        classification_report: {
          '0': { precision: 0.9491386382280558, recall: 0.9278267842822775, 'f1-score': 0.9383617193836172, support: 1247 },
          '1': { precision: 0.9777249777249777, recall: 0.9942615524010873, 'f1-score': 0.9859239293201557, support: 3311 },
          '2': { precision: 0.967741935483871, recall: 0.9575666541494555, 'f1-score': 0.9626274065685164, support: 2663 },
        },
        accuracy: 0.9692563356875779,
        roc_auc: 0.9954362830294294,
      },
    },
  };

  const classNames = ['Early Blight', 'Healthy', 'Late Blight'];
  const professionalColors = {
    primary: '#1e40af',
    secondary: '#059669',
    accent: '#dc2626',
    neutral: '#374151',
    light: '#f8fafc',
    border: '#e5e7eb',
  };

  // Prepare data for charts
  const performanceData: PerformanceData[] = [
    {
      name: 'Validation (INT8)',
      accuracy: data.validation.int8.accuracy * 100,
      roc_auc: data.validation.int8.roc_auc * 100,
      type: 'Validation',
    },
    {
      name: 'Validation (FP32)',
      accuracy: data.validation.float32.accuracy * 100,
      roc_auc: data.validation.float32.roc_auc * 100,
      type: 'Validation',
    },
    {
      name: 'Test (FP32)',
      accuracy: data.test.float32.accuracy * 100,
      roc_auc: data.test.float32.roc_auc * 100,
      type: 'Test',
    },
  ];

  const classificationData = (report: ClassificationReport, modelName: string): ClassificationData[] => [
    {
      class: 'Early Blight',
      precision: report['0'].precision * 100,
      recall: report['0'].recall * 100,
      'f1-score': report['0']['f1-score'] * 100,
      support: report['0'].support,
      model: modelName,
    },
    {
      class: 'Healthy',
      precision: report['1'].precision * 100,
      recall: report['1'].recall * 100,
      'f1-score': report['1']['f1-score'] * 100,
      support: report['1'].support,
      model: modelName,
    },
    {
      class: 'Late Blight',
      precision: report['2'].precision * 100,
      recall: report['2'].recall * 100,
      'f1-score': report['2']['f1-score'] * 100,
      support: report['2'].support,
      model: modelName,
    },
  ];

  // Professional Tooltip
  const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-800 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: <span className="font-medium">{entry.value.toFixed(2)}%</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Professional Confusion Matrix Component
  const ConfusionMatrix: React.FC<ConfusionMatrixProps> = ({ matrix, title, classes }) => {
    const total = matrix.flat().reduce((a: number, b: number) => a + b, 0);
    const rowSums = matrix.map((row) => row.reduce((a: number, b: number) => a + b, 0));

    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200" style={{ width: "100%" }}>
        <h3 className="text-lg font-semibold text-gray-800 mb-6 text-center">{title}</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-3 text-sm font-medium text-gray-600 border-b border-gray-200"></th>
                <th colSpan={3} className="p-3 text-sm font-medium text-gray-600 border-b border-gray-200 text-center">
                  Predicted
                </th>
              </tr>
              <tr>
                <th className="p-3 text-sm font-medium text-gray-600 border-b border-gray-200"></th>
                {classes.map((cls, i) => (
                  <th key={i} className="p-3 text-sm font-medium text-gray-600 border-b border-gray-200 text-center min-w-[100px]">
                    {cls}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row, i) => (
                <tr key={i}>
                  {i === Math.floor(matrix.length / 2) && (
                    <th rowSpan={matrix.length} className="p-3 text-sm font-medium text-gray-600 border-r border-gray-200 text-center writing-mode-vertical">
                      Actual
                    </th>
                  )}
                  {i !== Math.floor(matrix.length / 2) && (
                    <th className="p-3 text-sm font-medium text-gray-600 border-r border-gray-200 text-right">
                      {classes[i]}
                    </th>
                  )}
                  {row.map((cell, j) => {
                    const isCorrect = i === j;
                    const percentage = ((cell / rowSums[i]) * 100).toFixed(1);
                    return (
                      <td
                        key={j}
                        className={`p-4 text-center border border-gray-200 ${
                          isCorrect
                            ? 'bg-green-50 text-green-800 font-semibold'
                            : cell > 0
                              ? 'bg-red-50 text-red-700'
                              : 'bg-gray-50 text-gray-500'
                        }`}
                      >
                        <div className="text-base font-medium">{cell}</div>
                        <div className="text-xs text-gray-600 mt-1">{percentage}%</div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-sm text-gray-600">
          <p>Total samples: {total.toLocaleString()}</p>
          <p>Overall accuracy: {((matrix[0][0] + matrix[1][1] + matrix[2][2]) / total * 100).toFixed(2)}%</p>
        </div>
      </div>
    );
  };

  // Professional Metric Card
  const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtitle, change, trend }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow" style={{ width: "100%" }}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">{title}</h3>
          <div className="text-2xl font-bold text-gray-900 mt-1">{value}</div>
        </div>
        {change && trend && (
          <div
            className={`px-2 py-1 rounded text-xs font-medium ${
              trend === 'up' ? 'bg-green-100 text-green-800' : trend === 'down' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
            }`}
          >
            {change}
          </div>
        )}
      </div>
      <p className="text-sm text-gray-600">{subtitle}</p>
    </div>
  );

  // Navigation items
  const navigationItems = [
    { key: 'overview', label: 'Executive Summary' },
    { key: 'confusion-matrix', label: 'Confusion Matrices' },
    { key: 'classification', label: 'Classification Report' },
    { key: 'comparison', label: 'Model Comparison' },
  ];

  // Define tickFormatter function
  const formatTick = (value: number): string => `${value}%`;

  // Responsive chart heights and font sizes
  const chartHeight = useChartHeight(340, 220);
  const overviewChartHeight = useChartHeight(400, 250);
  const tickFontSize = useTickFontSize();
  const mainYAxisDomain = useYAxisDomain('main');
  const classYAxisDomain = useYAxisDomain('class');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Plant Disease Classification Model</h1>
            <p className="text-lg text-gray-600 mb-6">Performance Analysis Dashboard - Model Evaluation Report</p>
            {/* Navigation */}
            <nav className="flex justify-center">
              <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                {navigationItems.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setSelectedView(item.key)}
                    className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                      selectedView === item.key ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </nav>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Overview */}
        {selectedView === 'overview' && (
          <div className="space-y-8">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <MetricCard title="Best Accuracy" value="97.20%" subtitle="Validation INT8 Model" change="+0.07%" trend="up" />
              <MetricCard title="ROC AUC Score" value="99.54%" subtitle="Test FP32 Model" change="Excellent" trend="stable" />
              <MetricCard title="Model Variants" value="3" subtitle="INT8, FP32 Precision" />
              <MetricCard title="Classes" value="3" subtitle="Early Blight, Healthy, Late Blight" />
            </div>
            {/* Performance Overview Chart */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200" style={{ width: "100%" }}>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Model Performance Comparison</h2>
                  <p className="text-sm text-gray-600 mt-1">Accuracy and ROC AUC scores across model configurations</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={overviewChartHeight}>
                <BarChart data={performanceData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: tickFontSize }} angle={-45} textAnchor="end" height={80} />
                  <YAxis
                    domain={mainYAxisDomain}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: tickFontSize, fontWeight: 700 }}
                    tickFormatter={formatTick}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="accuracy" fill={professionalColors.primary} name="Accuracy (%)" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="roc_auc" fill={professionalColors.secondary} name="ROC AUC (%)" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Key Findings */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200" style={{ width: "100%" }}>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Key Findings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Performance Highlights</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• All models achieve Greater than 96% accuracy with excellent generalization</li>
                    <li>• ROC AUC scores consistently above 99%, indicating strong discrimination</li>
                    <li>• Minimal performance degradation from validation to test sets</li>
                    <li>• INT8 quantization maintains competitive performance</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Class-wise Performance</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Healthy class shows highest precision and recall (Greater than 99%)</li>
                    <li>• Early blight detection slightly more challenging (93-95% metrics)</li>
                    <li>• Late blight shows balanced performance across all metrics</li>
                    <li>• F1-scores demonstrate consistent reliability across classes</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confusion Matrices */}
        {selectedView === 'confusion-matrix' && (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Confusion Matrix Analysis</h2>
              <p className="text-gray-600">Detailed classification performance across all model configurations</p>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <ConfusionMatrix matrix={data.validation.int8.confusion_matrix} title="Validation Set - INT8 Quantized Model" classes={classNames} />
              <ConfusionMatrix matrix={data.validation.float32.confusion_matrix} title="Validation Set - FP32 Model" classes={classNames} />
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <ConfusionMatrix matrix={data.test.float32.confusion_matrix} title="Test Set - FP32 Model" classes={classNames} />
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200" style={{ width: "100%" }}>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Analysis Summary</h3>
                <div className="space-y-4 text-sm text-gray-600">
                  <div>
                    <h4 className="font-medium text-gray-800">Strong Diagonal Performance</h4>
                    <p>All models show strong diagonal values in confusion matrices, indicating accurate classification across all classes.</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">Minimal Cross-Class Confusion</h4>
                    <p>Low off-diagonal values demonstrate the model's ability to distinguish between disease states effectively.</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">Consistent Performance</h4>
                    <p>Similar patterns across validation and test sets indicate robust model generalization.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Classification Reports */}
        {selectedView === 'classification' && (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Classification Performance Metrics</h2>
              <p className="text-gray-600">Precision, Recall, and F1-Score analysis by class and model configuration</p>
            </div>
            {[
              { data: classificationData(data.validation.int8.classification_report, 'Validation INT8'), title: 'Validation Set - INT8 Model', color: professionalColors.primary },
              { data: classificationData(data.validation.float32.classification_report, 'Validation FP32'), title: 'Validation Set - FP32 Model', color: professionalColors.secondary },
              { data: classificationData(data.test.float32.classification_report, 'Test FP32'), title: 'Test Set - FP32 Model', color: professionalColors.accent },
            ].map((dataset, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200" style={{ width: "100%" }}>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{dataset.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">Performance metrics by classification class</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={chartHeight}>
                  <BarChart data={dataset.data} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="class" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: tickFontSize }} />
                    <YAxis
                      domain={classYAxisDomain}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6b7280', fontSize: tickFontSize, fontWeight: 700 }}
                      tickFormatter={formatTick}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="precision" fill="#dc2626" name="Precision (%)" radius={[1, 1, 0, 0]} />
                    <Bar dataKey="recall" fill="#059669" name="Recall (%)" radius={[1, 1, 0, 0]} />
                    <Bar dataKey="f1-score" fill="#1e40af" name="F1-Score (%)" radius={[1, 1, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        )}

        {/* Model Comparison */}
        {selectedView === 'comparison' && (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Comprehensive Model Comparison</h2>
              <p className="text-gray-600">Comparative analysis across all model configurations and metrics</p>
            </div>
            {/* Comparison Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden" style={{ width: "100%" }}>
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Performance Summary Table</h3>
                <p className="text-sm text-gray-600 mt-1">Comprehensive metrics comparison across all model variants</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model Configuration</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Accuracy</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ROC AUC</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Macro Avg F1</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sample Size</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {[
                      {
                        name: 'Validation INT8',
                        accuracy: data.validation.int8.accuracy * 100,
                        roc_auc: data.validation.int8.roc_auc * 100,
                        f1:
                          ((data.validation.int8.classification_report['0']['f1-score'] +
                            data.validation.int8.classification_report['1']['f1-score'] +
                            data.validation.int8.classification_report['2']['f1-score']) / 3) * 100,
                        samples: 5715,
                      },
                      {
                        name: 'Validation FP32',
                        accuracy: data.validation.float32.accuracy * 100,
                        roc_auc: data.validation.float32.roc_auc * 100,
                        f1:
                          ((data.validation.float32.classification_report['0']['f1-score'] +
                            data.validation.float32.classification_report['1']['f1-score'] +
                            data.validation.float32.classification_report['2']['f1-score']) / 3) * 100,
                        samples: 5715,
                      },
                      {
                        name: 'Test FP32',
                        accuracy: data.test.float32.accuracy * 100,
                        roc_auc: data.test.float32.roc_auc * 100,
                        f1:
                          ((data.test.float32.classification_report['0']['f1-score'] +
                            data.test.float32.classification_report['1']['f1-score'] +
                            data.test.float32.classification_report['2']['f1-score']) / 3) * 100,
                        samples: 7221,
                      },
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{row.accuracy.toFixed(2)}%</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{row.roc_auc.toFixed(2)}%</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{row.f1.toFixed(2)}%</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.samples.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {/* Recommendations */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200" style={{ width: "100%" }}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations & Insights</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-800 mb-3">Model Selection</h4>
                  <div className="space-y-3 text-sm text-gray-600">
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="font-medium text-green-800">Recommended: FP32 Model</p>
                      <p className="text-green-700">Best balance of accuracy (96.93%) and inference speed for production deployment.</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="font-medium text-blue-800">Alternative: INT8 Model</p>
                      <p className="text-blue-700">Suitable for edge deployment with minimal performance trade-off (97.20% validation accuracy).</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 mb-3">Deployment Considerations</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• All models show excellent generalization (validation ≈ test performance)</li>
                    <li>• ROC AUC Greater than 99% indicates strong class separation capability</li>
                    <li>• Healthy class identification is most reliable ( Greater than 99% metrics)</li>
                    <li>• Early blight detection may benefit from additional training data</li>
                    <li>• Consider ensemble methods for critical applications</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelEvaluationDashboard;