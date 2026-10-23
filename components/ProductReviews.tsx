"use client";

import { useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { ReviewForm } from "./ReviewForm";
import { ReviewList } from "./ReviewList";

interface ProductReviewsProps {
  productId: string;
  initialReviewCount: number;
}

export function ProductReviews({
  productId,
  initialReviewCount,
}: ProductReviewsProps) {
  const { data: session, status } = useSession();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [formOpen, setFormOpen] = useState(initialReviewCount > 0);
  const formRef = useRef<HTMLDivElement>(null);

  const handleReviewSubmitted = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const openForm = () => {
    if (status !== "loading" && !session) {
      window.location.href = `/auth/signin?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    setFormOpen(true);
    requestAnimationFrame(() =>
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }),
    );
  };

  return (
    <div className="space-y-8">
      {initialReviewCount > 0 ? (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            রিভিউ ও রেটিং
          </h2>
          <ReviewList productId={productId} refreshTrigger={refreshTrigger} />
        </div>
      ) : (
        <div className="py-6 text-center">
          <p className="text-gray-500">এখনো কোনো রিভিউ নেই।</p>
          <button
            type="button"
            onClick={openForm}
            className="mt-4 min-h-11 rounded-xl bg-teal-700 px-5 font-semibold text-white"
          >
            রিভিউ লিখুন
          </button>
        </div>
      )}

      {formOpen && (
        <div ref={formRef} className="border-t pt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            আপনার রিভিউ দিন
          </h3>
          <ReviewForm
            productId={productId}
            onReviewSubmitted={handleReviewSubmitted}
          />
        </div>
      )}
    </div>
  );
}
