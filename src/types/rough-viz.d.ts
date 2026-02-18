declare module 'rough-viz' {
  export interface RoughLineOptions {
    element: string;
    data: Record<string, number[]>;
    x?: string[];
    colors?: string[];
    stroke?: string;
    roughness?: number;
    axisRoughness?: number;
    strokeWidth?: number;
    circle?: boolean;
    circleRadius?: number;
    circleRoughness?: number;
    legend?: boolean;
    interactive?: boolean;
    xLabel?: string;
    yLabel?: string;
    margin?: {
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
    };
    font?: string;
    axisFontSize?: string;
    labelFontSize?: string;
    yValueFormat?: string;
    xValueFormat?: string;
    tooltipFontSize?: string;
  }

  export class Line {
    constructor(options: RoughLineOptions);
    remove(): void;
    responsive: boolean;
  }
}
