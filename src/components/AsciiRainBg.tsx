import { AsciiRain } from '@/components/neonblade-ui/ascii-rain';

export default function AsciiRainBg() {
  return (
    <div className="fixed inset-0 z-0" aria-hidden>
      <AsciiRain
        textColor="#00ed3f"
        bgColor="rgba(5, 5, 5, 0.08)"
        fontSize={14}
        speed={50}
        opacity={25}
      />
    </div>
  );
}
