import { useRef, useEffect, useState } from 'react';
import * as echarts from 'echarts';

// Forecast horizon options in years — 1yr is most reliable, 3yr covers useful planning horizon
const FORECAST_HORIZON_OPTIONS = [1, 2, 3];
const DEFAULT_FORECAST_HORIZON_YEARS = 1;

export default function PriceForecastChart({
  historicalData = [],
  forecastData = [],
  color = '#006400',
  lightColor = '#006400',
  xAxisLabel = 'Date',
  yAxisLabel = '',
  yAxisFormatter = (v) => `${v}`,
  tooltipFormatter,
}) {
  const chartRef = useRef(null);
  const instanceRef = useRef(null);
  const [horizonYears, setHorizonYears] = useState(
    DEFAULT_FORECAST_HORIZON_YEARS,
  );

  const fmtTooltip = tooltipFormatter || yAxisFormatter;
  const hasForecast = forecastData.some((d) => Number.isFinite(d?.value));

  // Convert years to data points. Forecast data is monthly, so multiply by 12.
  const horizonPoints = horizonYears * 12;

  useEffect(() => {
    if (!chartRef.current) return;
    instanceRef.current = echarts.init(chartRef.current, null, {
      renderer: 'svg',
    });
    return () => instanceRef.current?.dispose();
  }, []);

  useEffect(() => {
    if (!instanceRef.current) return;

    if (!historicalData.length) {
      instanceRef.current.setOption(
        {
          animation: true,
          animationDuration: 500,
          animationEasing: 'cubicInOut',
          backgroundColor: 'transparent',
          grid: {
            top: 24,
            right: 24,
            bottom: 56,
            left: 48,
            containLabel: true,
          },
          tooltip: {
            trigger: 'axis',
            backgroundColor: '#fff',
            borderColor: '#e5e7eb',
            borderWidth: 1,
            textStyle: { color: '#111827', fontSize: 12 },
            formatter: () => '',
          },
          xAxis: {
            type: 'category',
            data: [],
            boundaryGap: false,
            name: xAxisLabel,
            nameLocation: 'middle',
            nameGap: 36,
            nameTextStyle: { fontSize: 12, color: '#9ca3af', fontWeight: 500 },
            axisLine: { lineStyle: { color: '#e5e7eb' } },
            axisTick: { show: false },
            axisLabel: { fontSize: 12, color: '#9ca3af' },
          },
          yAxis: {
            type: 'value',
            name: yAxisLabel,
            nameLocation: 'middle',
            nameGap: 56,
            nameRotate: 90,
            nameTextStyle: { fontSize: 12, color: '#9ca3af', fontWeight: 500 },
            axisLabel: {
              fontSize: 12,
              color: '#9ca3af',
              formatter: yAxisFormatter,
            },
            splitLine: { lineStyle: { color: '#f3f4f6', type: 'dashed' } },
            axisLine: { show: false },
            axisTick: { show: false },
          },
          series: [
            {
              name: 'Actual',
              type: 'line',
              data: [],
              connectNulls: false,
              smooth: false,
              symbol: 'none',
              lineStyle: { color, width: 2.5 },
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
              data: [],
              connectNulls: false,
              smooth: true,
              symbol: 'none',
              lineStyle: {
                color: lightColor,
                width: 2.5,
                type: 'dashed',
                opacity: 0.65,
              },
              areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: lightColor + '18' },
                  { offset: 1, color: lightColor + '00' },
                ]),
              },
            },
          ],
        },
        false,
      );
      return;
    }

    const slicedForecast = hasForecast
      ? forecastData.slice(0, horizonPoints)
      : [];
    const historicalDates = historicalData.map((d) => d.date);
    const forecastDates = slicedForecast.map((d) => d.date);
    const allDates = [...historicalDates, ...forecastDates];
    const lastHistoricalIndex = historicalDates.length - 1;
    const firstForecastIndex = historicalDates.length;
    const firstForecastDate = forecastDates[0] ?? null;
    const lastDate = allDates.at(-1) ?? null;
    const lastHistoricalValue = historicalData.at(-1)?.value ?? null;
    const firstForecastValue = slicedForecast[0]?.value ?? null;

    const actualData = [
      ...historicalData.map((d) => d.value),
      ...forecastDates.map(() => null),
    ];

    const predictedData = [
      ...historicalDates.map(() => null),
      ...slicedForecast.map((d) => d.value),
    ];

    const transitionConnectorData = Array(allDates.length).fill(null);
    if (
      hasForecast &&
      Number.isFinite(lastHistoricalValue) &&
      Number.isFinite(firstForecastValue)
    ) {
      transitionConnectorData[lastHistoricalIndex] = lastHistoricalValue;
      transitionConnectorData[firstForecastIndex] = firstForecastValue;
    }

    instanceRef.current.setOption(
      {
        animation: true,
        animationDuration: 500,
        animationEasing: 'cubicInOut',
        backgroundColor: 'transparent',
        grid: { top: 24, right: 24, bottom: 56, left: 48, containLabel: true },
        tooltip: {
          trigger: 'axis',
          backgroundColor: '#fff',
          borderColor: '#e5e7eb',
          borderWidth: 1,
          textStyle: { color: '#111827', fontSize: 12, fontFamily: 'inherit' },
          formatter(params) {
            const visible = params.filter((p) => {
              if (p.value == null) return false;
              if (
                hasForecast &&
                p.seriesName === 'Historical' &&
                p.dataIndex === lastHistoricalIndex
              )
                return false;
              return true;
            });
            if (!visible.length) return '';
            const rows = visible.map((p) => {
              const opacity = p.seriesName === 'Forecast' ? '0.6' : '1';
              const dotColor =
                p.seriesName === 'Forecast' ? lightColor : color;
              const dot = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${dotColor};opacity:${opacity};margin-right:6px;"></span>`;
              return `${dot}<b>${p.seriesName}</b>: ${fmtTooltip(p.value)}`;
            });
            return `<div style="font-size:12px;padding:2px 4px"><div style="color:#6b7280;margin-bottom:3px">${params[0].axisValue}</div>${rows.join('<br/>')}</div>`;
          },
        },
        xAxis: {
          type: 'category',
          data: allDates,
          boundaryGap: false,
          name: xAxisLabel,
          nameLocation: 'middle',
          nameGap: 36,
          nameTextStyle: { fontSize: 12, color: '#9ca3af', fontWeight: 500 },
          axisLine: { lineStyle: { color: '#e5e7eb' } },
          axisTick: { show: false },
          axisLabel: {
            fontSize: 12,
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
          nameTextStyle: { fontSize: 12, color: '#9ca3af', fontWeight: 500 },
          axisLabel: {
            fontSize: 12,
            color: '#9ca3af',
            formatter: yAxisFormatter,
          },
          splitLine: { lineStyle: { color: '#f3f4f6', type: 'dashed' } },
          axisLine: { show: false },
          axisTick: { show: false },
        },
        series: [
          {
            name: 'Historical',
            type: 'line',
            data: actualData,
            connectNulls: false,
            smooth: false,
            symbol: 'none',
            lineStyle: { color, width: 2.5, type: 'solid' },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: color + '28' },
                { offset: 1, color: color + '00' },
              ]),
            },
            markPoint:
              hasForecast && Number.isFinite(lastHistoricalValue)
                ? {
                    symbol: 'circle',
                    symbolSize: 6,
                    silent: true,
                    tooltip: { show: false },
                    itemStyle: {
                      color,
                      opacity: 0.45,
                    },
                    data: [{ coord: [historicalDates.at(-1), lastHistoricalValue] }],
                  }
                : undefined,
          },
          ...(hasForecast
            ? [
                {
                  name: 'Forecast',
                  type: 'line',
                  data: predictedData,
                  connectNulls: false,
                  smooth: true,
                  symbol: 'none',
                  lineStyle: {
                    color: lightColor,
                    width: 2.5,
                    type: 'dashed',
                    opacity: 0.65,
                  },
                  areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                      { offset: 0, color: lightColor + '18' },
                      { offset: 1, color: lightColor + '00' },
                    ]),
                  },
                  markLine: firstForecastDate
                    ? {
                        symbol: 'none',
                        silent: true,
                        lineStyle: {
                          color: '#9ca3af',
                          width: 1.5,
                          type: 'solid',
                          opacity: 0.9,
                        },
                        label: {
                          show: true,
                          formatter: 'Forecast begins',
                          color: '#4b5563',
                          backgroundColor: '#fffffff0',
                          borderColor: '#e5e7eb',
                          borderWidth: 1,
                          borderRadius: 4,
                          padding: [3, 6],
                          fontSize: 11,
                          fontWeight: 600,
                          position: 'insideEndTop',
                        },
                        data: [{ xAxis: firstForecastDate }],
                      }
                    : undefined,
                  markArea:
                    firstForecastDate && lastDate
                      ? {
                          silent: true,
                          itemStyle: {
                            color: '#9ca3af22',
                          },
                          data: [
                            [
                              { xAxis: firstForecastDate },
                              { xAxis: lastDate },
                            ],
                          ],
                        }
                      : undefined,
                },
                {
                  name: 'Transition',
                  type: 'line',
                  data: transitionConnectorData,
                  connectNulls: false,
                  smooth: false,
                  symbol: 'none',
                  silent: true,
                  tooltip: { show: false },
                  lineStyle: {
                    color: '#9ca3af',
                    width: 2,
                    type: 'dashed',
                    opacity: 0.7,
                  },
                  z: 2,
                },
              ]
            : []),
        ],
      },
      false,
    );
  }, [
    historicalData,
    forecastData,
    horizonPoints,
    color,
    lightColor,
    yAxisFormatter,
    fmtTooltip,
    xAxisLabel,
    yAxisLabel,
    hasForecast,
  ]);

  useEffect(() => {
    const ro = new ResizeObserver(() => instanceRef.current?.resize());
    if (chartRef.current) ro.observe(chartRef.current);
    return () => ro.disconnect();
  }, []);

  const toggleClass = (active) =>
    active
      ? 'px-3 py-1 rounded-full text-sm font-semibold bg-gray-900 text-white'
      : 'px-3 py-1 rounded-full text-sm font-semibold text-gray-400 hover:text-gray-700 transition-colors';

  return (
    <div className="w-full">
      {hasForecast && (
        <div className="flex items-center justify-between mb-3">
          <span className="text-md text-gray-400 font-medium">
            Forecast horizon
          </span>
          <div className="flex items-center gap-1 bg-gray-100 rounded-full p-0.5">
            {FORECAST_HORIZON_OPTIONS.map((y) => (
              <button
                key={y}
                onClick={() => setHorizonYears(y)}
                className={toggleClass(horizonYears === y)}
              >
                {y}yr
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 mb-2">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-0.5 rounded" style={{ background: color }} />
          <span className="text-sm text-gray-400">Historical</span>
        </div>
        {hasForecast && (
          <div className="flex items-center gap-1.5">
            <div
              className="w-5 h-0.5"
              style={{
                background: `repeating-linear-gradient(90deg,${lightColor} 0,${lightColor} 4px,transparent 4px,transparent 7px)`,
                opacity: 0.65,
              }}
            />
            <span className="text-sm text-gray-400">Forecast</span>
          </div>
        )}
      </div>

      <div ref={chartRef} style={{ width: '100%', height: '220px' }} />
    </div>
  );
}
