import { useRef, useEffect, useState } from 'react';
import * as echarts from 'echarts';

export default function PriceForecastChart({
  historicalData = [],
  forecastData = [],
  color = '#16a34a',
  xAxisLabel = 'Date',
  yAxisLabel = '',
  yAxisFormatter = (v) => `${v}`,
  tooltipFormatter,
}) {
  const chartRef = useRef(null);
  const instanceRef = useRef(null);
  const [horizon, setHorizon] = useState(12);

  const fmtTooltip = tooltipFormatter || yAxisFormatter;

  useEffect(() => {
    if (!chartRef.current) return;
    instanceRef.current = echarts.init(chartRef.current, null, { renderer: 'svg' });
    return () => instanceRef.current?.dispose();
  }, []);

  useEffect(() => {
    if (!instanceRef.current || !historicalData.length) return;

    const slicedForecast = forecastData.slice(0, horizon);
    const historicalDates = historicalData.map((d) => d.date);
    const forecastDates = slicedForecast.map((d) => d.date);
    const allDates = [...historicalDates, ...forecastDates];

    // Actual series: real vals for historical slots, null for forecasted
    const actualData = [
      ...historicalData.map((d) => d.value),
      ...forecastDates.map(() => null),
    ];

    // Predicted series: null until last historical, then forecast values
    const predictedData = [
      ...historicalDates.slice(0, -1).map(() => null),
      historicalData.at(-1)?.value ?? null,
      ...slicedForecast.map((d) => d.value),
    ];

    const option = {
      backgroundColor: 'transparent',
      grid: {
        top: 24,
        right: 24,
        bottom: 56,  // extra room for x-axis label
        left: 48,
        containLabel: true,
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#fff',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        textStyle: { color: '#111827', fontSize: 12, fontFamily: 'inherit' },
        formatter(params) {
          const visible = params.filter((p) => p.value != null);
          if (!visible.length) return '';
          const rows = visible.map((p) => {
            const opacity = p.seriesName === 'Predicted' ? '0.6' : '1';
            const dot = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};opacity:${opacity};margin-right:6px;"></span>`;
            return `${dot}<b>${p.seriesName}</b>: ${fmtTooltip(p.value)}`;
          });
          return `<div style="font-size:12px;padding:2px 4px">
            <div style="color:#6b7280;margin-bottom:3px">${params[0].axisValue}</div>
            ${rows.join('<br/>')}
          </div>`;
        },
      },
      xAxis: {
        type: 'category',
        data: allDates,
        boundaryGap: false,
        name: xAxisLabel,
        nameLocation: 'middle',
        nameGap: 36,
        nameTextStyle: { fontSize: 11, color: '#9ca3af', fontWeight: 500 },
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisTick: { show: false },
        axisLabel: {
          fontSize: 11,
          color: '#9ca3af',
          interval: Math.max(0, Math.floor(allDates.length / 5) - 1),
        },
      },
      yAxis: {
        type: 'value',
        name: yAxisLabel,
        nameLocation: 'middle',
        nameGap: 56,
        nameRotate: 90,
        nameTextStyle: { fontSize: 11, color: '#9ca3af', fontWeight: 500 },
        axisLabel: {
          fontSize: 11,
          color: '#9ca3af',
          formatter: yAxisFormatter,   // custom tick format
        },
        splitLine: { lineStyle: { color: '#f3f4f6', type: 'dashed' } },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: [
        {
          name: 'Actual',
          type: 'line',
          data: actualData,
          connectNulls: false,
          smooth: true,
          symbol: 'none',
          lineStyle: { color, width: 2.5, type: 'solid' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: color + '28' },
              { offset: 1, color: color + '00' },
            ]),
          },
        },
        {
          name: 'Predicted',
          type: 'line',
          data: predictedData,
          connectNulls: false,
          smooth: true,
          symbol: 'none',
          lineStyle: { color, width: 2.5, type: 'dashed', opacity: 0.65 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: color + '18' },
              { offset: 1, color: color + '00' },
            ]),
          },
        },
      ],
    };

    instanceRef.current.setOption(option, true);
  }, [historicalData, forecastData, horizon, color, yAxisFormatter, fmtTooltip, xAxisLabel, yAxisLabel]);

  useEffect(() => {
    const ro = new ResizeObserver(() => instanceRef.current?.resize());
    if (chartRef.current) ro.observe(chartRef.current);
    return () => ro.disconnect();
  }, []);

  const toggleClass = (active) =>
    active
      ? 'px-3 py-1 rounded-full text-xs font-semibold bg-gray-900 text-white'
      : 'px-3 py-1 rounded-full text-xs font-semibold text-gray-400 hover:text-gray-700 transition-colors';

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-400 font-medium">Forecast horizon</span>
        <div className="flex items-center gap-1 bg-gray-100 rounded-full p-0.5">
          {[3, 6, 12].map((h) => (
            <button key={h} onClick={() => setHorizon(h)} className={toggleClass(horizon === h)}>
              {h}mo
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4 mb-2">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-0.5 rounded" style={{ background: color }} />
          <span className="text-xs text-gray-400">Actual</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-5 h-0.5"
            style={{
              background: `repeating-linear-gradient(90deg,${color} 0,${color} 4px,transparent 4px,transparent 7px)`,
              opacity: 0.65,
            }}
          />
          <span className="text-xs text-gray-400">Predicted</span>
        </div>
      </div>

      <div ref={chartRef} style={{ width: '100%', height: '220px' }} />
    </div>
  );
}