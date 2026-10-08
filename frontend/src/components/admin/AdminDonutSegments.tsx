type Segment = { value: number; color: string };

const RADIUS = 50;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function AdminDonutSegments({ segments }: { segments: Segment[] }) {
  const total = segments.reduce((sum, segment) => sum + Math.max(0, segment.value), 0);
  let offset = 0;

  return (
    <>
      <circle cx="140" cy="90" r={RADIUS} fill="none" stroke="#E3E9EF" strokeWidth="24" />
      {total > 0 && segments.map((segment, index) => {
        const length = (Math.max(0, segment.value) / total) * CIRCUMFERENCE;
        const start = offset;
        offset += length;
        return (
          <circle
            key={index}
            cx="140"
            cy="90"
            r={RADIUS}
            fill="none"
            stroke={segment.color}
            strokeWidth="24"
            strokeDasharray={`${length} ${CIRCUMFERENCE - length}`}
            strokeDashoffset={-start}
            transform="rotate(-90 140 90)"
          />
        );
      })}
    </>
  );
}
