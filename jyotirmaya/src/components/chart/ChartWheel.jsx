import ChartWheelNorth from './ChartWheelNorth.jsx';
import ChartWheelSouth from './ChartWheelSouth.jsx';

export default function ChartWheel({ style, ...props }) {
  return style === 'south'
    ? <ChartWheelSouth {...props} />
    : <ChartWheelNorth {...props} />;
}
