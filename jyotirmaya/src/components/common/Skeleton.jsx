export function SkeletonLine({ w = 'w-full', h = 'h-4' }) {
  return <div className={`${w} ${h} rounded bg-indigo/10 animate-pulse`} />;
}

export function SkeletonCard() {
  return (
    <div className="bg-white/70 rounded-lg border border-ink/10 p-5 space-y-3">
      <SkeletonLine w="w-1/3" />
      <SkeletonLine />
      <SkeletonLine w="w-2/3" />
    </div>
  );
}

export function SkeletonGrid({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );
}
