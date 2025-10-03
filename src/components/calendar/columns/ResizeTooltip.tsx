import ReactDOM from 'react-dom';

export interface ResizeTooltipProps {
  visible: boolean;
  x: number;
  y: number;
  timeRange: string;
}

/**
 * Tooltip displayed during task resize (via portal)
 */
export function ResizeTooltip({ visible, x, y, timeRange }: ResizeTooltipProps) {
  if (!visible) {
    return null;
  }

  return ReactDOM.createPortal(
    <div
      className='fixed z-[9999] px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg pointer-events-none'
      style={{
        left: x,
        top: y,
      }}
    >
      {timeRange}
    </div>,
    document.body
  );
}
