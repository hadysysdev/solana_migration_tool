/**
 * Loading Fallback Components
 *
 * Provides consistent loading states for lazy-loaded components.
 * These fallbacks maintain layout stability and prevent content shift.
 */

export function ScrollingVideoFallback() {
  return (
    <div className="relative h-[200px] w-full overflow-hidden bg-transparent pointer-events-none -mt-44">
      {/* Blur logo placeholder - prevents CLS by reserving exact space for logo video */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <img
          src="/images/blurLogo.png"
          alt=""
          className="h-full w-auto relative z-50 mb-12"
          width={600}
          height={200}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

export function PerformanceModalFallback() {
  return (
    <div className="btn-brand max-w-md mt-12 relative mx-auto opacity-50 cursor-wait">
      <div className="flex items-center justify-center gap-2">
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        <span>Loading...</span>
      </div>
    </div>
  );
}

export function ThreeBackgroundFallback() {
  // No fallback needed - background element that loads after initial paint
  return null;
}

export function VideoBackgroundFallback() {
  // No fallback needed - background element that loads after initial paint
  return null;
}

export function LoginModalFallback() {
  // No fallback needed - modal only appears on user action
  return null;
}

export function KeystrokeListenerFallback() {
  // No fallback needed - invisible utility component
  return null;
}

