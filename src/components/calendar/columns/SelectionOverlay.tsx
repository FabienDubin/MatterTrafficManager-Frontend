export interface SelectionOverlayProps {
  top: number;
  height: number;
}

/**
 * Visual overlay during time slot selection
 */
export function SelectionOverlay({ top, height }: SelectionOverlayProps) {
  return (
    <div
      className='absolute left-0 right-0 bg-primary/20 pointer-events-none'
      style={{
        top: `${top}px`,
        height: `${height}px`,
        zIndex: 100,
      }}
    />
  );
}
