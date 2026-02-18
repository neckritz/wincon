import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
  type MouseEvent,
} from 'react';
import { Line as RoughLine } from 'rough-viz';

export interface ClanProgressPoint {
  label: string;
  fame: number;
  placement: number | null;
}

export interface ClanTrophyPoint {
  label: string;
  clanWarTrophies: number;
  trophyChange: number;
}

interface ClanWarProgressSectionProps {
  progression: ClanProgressPoint[];
  trophyProgression: ClanTrophyPoint[];
  averagePlacement: number | null;
}

interface ChartTheme {
  primary: string;
  secondary: string;
}

interface TooltipState {
  x: number;
  y: number;
  lines: string[];
}

const TROPHY_CHART_MARGIN = {
  top: 34,
  right: 18,
  bottom: 68,
  left: 74,
};

const PROGRESSION_CHART_MARGIN = {
  top: 34,
  right: 18,
  bottom: 68,
  left: 78,
};

function readTickValue(tickGroup: SVGGElement): number | null {
  const datum = (tickGroup as unknown as { __data__?: unknown }).__data__;
  if (typeof datum === 'number' && Number.isFinite(datum)) return datum;

  const textValue = tickGroup.querySelector('text')?.textContent?.trim();
  if (!textValue) return null;

  const parsed = Number(textValue.replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function formatCompactAxisValue(value: number): string {
  const absoluteValue = Math.abs(value);

  if (absoluteValue >= 1000) {
    const compactValue = value / 1000;
    if (Number.isInteger(compactValue)) return `${compactValue}k`;
    return `${compactValue.toFixed(1).replace(/\.0$/, '')}k`;
  }

  return `${Math.round(value)}`;
}

function tuneYAxisTicks(
  container: HTMLElement,
  maxVisibleTicks: number,
  valueFormatter?: (value: number) => string,
): void {
  const yAxisTickGroups = Array.from(
    container.querySelectorAll<SVGGElement>('[class^="yAxis"] .tick'),
  );

  if (yAxisTickGroups.length <= maxVisibleTicks) return;

  const stride = Math.ceil(yAxisTickGroups.length / maxVisibleTicks);

  yAxisTickGroups.forEach((tickGroup, index) => {
    const keepTick = index % stride === 0 || index === yAxisTickGroups.length - 1;
    tickGroup.style.opacity = keepTick ? '1' : '0';

    if (!valueFormatter) return;
    const tickValue = readTickValue(tickGroup);
    const tickText = tickGroup.querySelector('text');
    if (tickValue === null || !tickText) return;
    tickText.textContent = valueFormatter(tickValue);
  });
}

function resolveHoverIndex(
  event: MouseEvent<HTMLDivElement>,
  pointCount: number,
  margins: { left: number; right: number; top: number; bottom: number },
): number | null {
  if (pointCount === 0) return null;

  const bounds = event.currentTarget.getBoundingClientRect();
  const pointerX = event.clientX - bounds.left;
  const pointerY = event.clientY - bounds.top;
  const plotLeft = margins.left;
  const plotRight = bounds.width - margins.right;
  const plotTop = margins.top;
  const plotBottom = bounds.height - margins.bottom;

  if (
    pointerX < plotLeft ||
    pointerX > plotRight ||
    pointerY < plotTop ||
    pointerY > plotBottom
  ) {
    return null;
  }

  if (pointCount === 1) return 0;

  const plotWidth = Math.max(1, plotRight - plotLeft);
  const relativeRatio = (pointerX - plotLeft) / plotWidth;
  const rawIndex = Math.round(relativeRatio * (pointCount - 1));
  return Math.max(0, Math.min(pointCount - 1, rawIndex));
}

export default function ClanWarProgressSection({
  progression,
  trophyProgression,
  averagePlacement,
}: ClanWarProgressSectionProps) {
  const [trophyTooltip, setTrophyTooltip] = useState<TooltipState | null>(null);
  const [progressionTooltip, setProgressionTooltip] = useState<TooltipState | null>(
    null,
  );

  const baseId = useId().replace(/:/g, '');

  const chartIds = useMemo(() => {
    return {
      trophy: `rough-trophy-${baseId}`,
      progression: `rough-progression-${baseId}`,
    };
  }, [baseId]);

  const trophyLabels = useMemo(
    () => trophyProgression.map((point) => point.label),
    [trophyProgression],
  );

  const trophyValues = useMemo(
    () => trophyProgression.map((point) => point.clanWarTrophies),
    [trophyProgression],
  );

  const trophySeries = useMemo(() => {
    if (trophyValues.length === 0) {
      return {
        baseline: 0,
        normalizedValues: [],
      };
    }

    const minTrophies = Math.min(...trophyValues);
    const maxTrophies = Math.max(...trophyValues);
    const range = Math.max(1, maxTrophies - minTrophies);
    const padding = Math.max(10, Math.round(range * 0.35));
    const baseline = Math.max(0, minTrophies - padding);

    return {
      baseline,
      normalizedValues: trophyValues.map((value) => value - baseline),
    };
  }, [trophyValues]);

  const progressionSeries = useMemo(() => {
    const labels = progression.map((point) => point.label);
    const fameValues = progression.map((point) => point.fame);
    const maxFame = Math.max(1, ...fameValues);
    const placementValues = progression
      .map((point) => point.placement)
      .filter((placement): placement is number => placement !== null);
    const maxPlacement = Math.max(1, ...placementValues);

    const scaledPlacementValues = progression.map((point) => {
      if (point.placement === null) return 0;
      const normalizedPlacement = (maxPlacement - point.placement + 1) / maxPlacement;
      return Math.round(normalizedPlacement * maxFame);
    });

    return {
      labels,
      fameValues,
      scaledPlacementValues,
    };
  }, [progression]);

  const handleTrophyMouseMove = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      const pointIndex = resolveHoverIndex(
        event,
        trophySeries.normalizedValues.length,
        TROPHY_CHART_MARGIN,
      );

      if (pointIndex === null) {
        setTrophyTooltip(null);
        return;
      }

      const bounds = event.currentTarget.getBoundingClientRect();
      const value = trophyValues[pointIndex];

      setTrophyTooltip({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
        lines: [`Trophies: ${value.toLocaleString()}`],
      });
    },
    [trophySeries.normalizedValues.length, trophyValues],
  );

  const handleProgressionMouseMove = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      const pointIndex = resolveHoverIndex(
        event,
        progressionSeries.labels.length,
        PROGRESSION_CHART_MARGIN,
      );

      if (pointIndex === null) {
        setProgressionTooltip(null);
        return;
      }

      const bounds = event.currentTarget.getBoundingClientRect();
      const placement = progression[pointIndex]?.placement;
      const fame = progressionSeries.fameValues[pointIndex];

      setProgressionTooltip({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
        lines: [
          `Fame: ${Math.round(fame).toLocaleString()}`,
          `Placement: ${placement === null || placement === undefined ? 'N/A' : `#${placement}`}`,
        ],
      });
    },
    [progression, progressionSeries.fameValues, progressionSeries.labels.length],
  );

  const resolveTheme = (target: HTMLElement): ChartTheme => {
    const themeSource = target.closest('.clan-page') ?? document.documentElement;
    const styles = getComputedStyle(themeSource);

    return {
      primary: styles.getPropertyValue('--chart-line-primary').trim() || '#2f67e8',
      secondary: styles.getPropertyValue('--chart-line-secondary').trim() || '#df4b4b',
    };
  };

  useEffect(() => {
    if (trophyProgression.length === 0) return;

    const chartElement = document.getElementById(chartIds.trophy);
    if (!chartElement) return;

    chartElement.innerHTML = '';
    const theme = resolveTheme(chartElement);

    const chart = new RoughLine({
      element: `#${chartIds.trophy}`,
      data: {
        Trophies: trophySeries.normalizedValues,
      },
      x: trophyLabels,
      colors: [theme.primary],
      stroke: theme.primary,
      roughness: 1.35,
      axisRoughness: 0.65,
      strokeWidth: 2,
      circle: true,
      circleRadius: 7,
      circleRoughness: 1.3,
      legend: true,
      interactive: false,
      xLabel: 'River Wars',
      yLabel: 'War Trophies',
      margin: TROPHY_CHART_MARGIN,
      font: 'Montserrat',
      axisFontSize: '0.72rem',
      labelFontSize: '0.9rem',
      tooltipFontSize: '0.85rem',
    });

    chart.responsive = false;
    tuneYAxisTicks(chartElement, 6, (value) =>
      formatCompactAxisValue(value + trophySeries.baseline),
    );

    return () => {
      chart.responsive = false;
      chart.remove();
      chartElement.innerHTML = '';
    };
  }, [
    chartIds.trophy,
    trophyLabels,
    trophyProgression.length,
    trophySeries.baseline,
    trophySeries.normalizedValues,
  ]);

  useEffect(() => {
    if (progression.length === 0) return;

    const chartElement = document.getElementById(chartIds.progression);
    if (!chartElement) return;

    chartElement.innerHTML = '';
    const theme = resolveTheme(chartElement);

    const chart = new RoughLine({
      element: `#${chartIds.progression}`,
      data: {
        Fame: progressionSeries.fameValues,
        'Placement (scaled)': progressionSeries.scaledPlacementValues,
      },
      x: progressionSeries.labels,
      colors: [theme.primary, theme.secondary],
      roughness: 1.35,
      axisRoughness: 0.65,
      strokeWidth: 2,
      circle: true,
      circleRadius: 7,
      circleRoughness: 1.3,
      legend: true,
      interactive: false,
      xLabel: 'River Wars',
      yLabel: 'Fame / Scaled Placement',
      margin: PROGRESSION_CHART_MARGIN,
      font: 'Montserrat',
      axisFontSize: '0.68rem',
      labelFontSize: '0.9rem',
      yValueFormat: '~s',
      tooltipFontSize: '0.85rem',
    });

    chart.responsive = false;
    tuneYAxisTicks(chartElement, 7);

    return () => {
      chart.responsive = false;
      chart.remove();
      chartElement.innerHTML = '';
    };
  }, [chartIds.progression, progression.length, progressionSeries]);

  return (
    <section className="clan-section">
      <h2 className="clan-section__heading">Clan Performance</h2>
      <p className="clan-section__subtext">
        Average placement:{' '}
        {averagePlacement === null ? 'N/A' : averagePlacement.toFixed(2)}
      </p>

      <div className="performance-cards">
        <article className="panel-card panel-card--chart">
          <h3 className="panel-card__title">Clan War Trophies</h3>
          <div className="panel-card__content">
            {trophyProgression.length === 0 ? (
              <p className="panel-card__empty">No clan war trophy data available.</p>
            ) : (
              <div
                className="chart-shell"
                onMouseMove={handleTrophyMouseMove}
                onMouseLeave={() => setTrophyTooltip(null)}
              >
                <div className="chart-shell__canvas" id={chartIds.trophy} />
                {trophyTooltip ? (
                  <div
                    className="chart-shell__tooltip"
                    style={{ left: `${trophyTooltip.x}px`, top: `${trophyTooltip.y}px` }}
                  >
                    {trophyTooltip.lines.map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </article>

        <article className="panel-card panel-card--chart">
          <h3 className="panel-card__title">Fame And Placement</h3>
          <div className="panel-card__content">
            {progression.length === 0 ? (
              <p className="panel-card__empty">No clan war progression data available.</p>
            ) : (
              <>
                <div
                  className="chart-shell"
                  onMouseMove={handleProgressionMouseMove}
                  onMouseLeave={() => setProgressionTooltip(null)}
                >
                  <div className="chart-shell__canvas" id={chartIds.progression} />
                  {progressionTooltip ? (
                    <div
                      className="chart-shell__tooltip"
                      style={{
                        left: `${progressionTooltip.x}px`,
                        top: `${progressionTooltip.y}px`,
                      }}
                    >
                      {progressionTooltip.lines.map((line) => (
                        <p key={line}>{line}</p>
                      ))}
                    </div>
                  ) : null}
                </div>
                <p className="panel-card__hint">
                  Placement is scaled to the fame range for a single rough-viz graph.
                </p>
              </>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
