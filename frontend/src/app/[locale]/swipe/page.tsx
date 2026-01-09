import { SwipeFeature } from "@/features/swipe/components/SwipeFeature";

export default function SwipePage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-black py-8">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
          Discover New People
        </h1>
        <SwipeFeature />
      </div>
    </main>
  );
}
