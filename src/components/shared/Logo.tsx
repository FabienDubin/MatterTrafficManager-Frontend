interface LogoProps {
  className?: string;
}

export function Logo({ className = 'size-4' }: LogoProps) {
  return (
    <img
      src='/Monogram.svg'
      alt='Matter Traffic Manager Logo'
      className={`${className} dark:invert`}
    />
  );
}
