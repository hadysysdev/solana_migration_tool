export default function SectionSkeleton() {
  return (
    <div className="py-12 px-4 animate-pulse">
      <div className="max-w-6xl mx-auto">
        <div className="h-12 bg-slate-800/50 rounded-lg w-3/4 mx-auto mb-8" />
        <div className="h-6 bg-slate-800/30 rounded-lg w-1/2 mx-auto mb-16" />
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-800/30 rounded-lg" />
          <div className="h-64 bg-slate-800/30 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

