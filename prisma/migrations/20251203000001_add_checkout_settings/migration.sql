-- CreateTable
CREATE TABLE "CheckoutPageSettings" (
    "id" TEXT NOT NULL,
    "pageTitleBn" TEXT NOT NULL DEFAULT 'চেকআউট',
    "addressSectionTitleBn" TEXT NOT NULL DEFAULT '১. ডেলিভারি ঠিকানা',
    "addAddressButtonBn" TEXT NOT NULL DEFAULT '+ নতুন ঠিকানা যোগ করুন',
    "paymentSectionTitleBn" TEXT NOT NULL DEFAULT '২. পেমেন্ট মেথড',
    "codLabelBn" TEXT NOT NULL DEFAULT 'ক্যাশ অন ডেলিভারি',
    "bkashLabelBn" TEXT NOT NULL DEFAULT 'বিকাশ / নগদ',
    "couponSectionTitleBn" TEXT NOT NULL DEFAULT '৩. কুপন কোড',
    "couponPlaceholderBn" TEXT NOT NULL DEFAULT 'কুপন কোড লিখুন',
    "couponApplyBn" TEXT NOT NULL DEFAULT 'Apply',
    "orderSummarySectionTitleBn" TEXT NOT NULL DEFAULT '৪. অর্ডার সামারি',
    "viewDetailsBn" TEXT NOT NULL DEFAULT 'বিস্তারিত দেখুন',
    "totalLabelBn" TEXT NOT NULL DEFAULT 'সর্বমোট:',
    "confirmButtonBn" TEXT NOT NULL DEFAULT 'অর্ডার কনফার্ম করুন',
    "successPageTitleBn" TEXT NOT NULL DEFAULT 'অর্ডার কনফার্মেশন',
    "successLine1Bn" TEXT NOT NULL DEFAULT 'ধন্যবাদ! আপনার অর্ডারটি',
    "successLine2Bn" TEXT NOT NULL DEFAULT 'সফলভাবে প্লেস করা হয়েছে 🎉',
    "orderIdLabelBn" TEXT NOT NULL DEFAULT 'অর্ডার আইডি:',
    "successTotalLabelBn" TEXT NOT NULL DEFAULT 'সর্বমোট:',
    "successPaymentLabelBn" TEXT NOT NULL DEFAULT 'পেমেন্ট মেথড:',
    "infoNoteBn" TEXT NOT NULL DEFAULT 'আমাদের একজন ফার্মাসিস্ট শীঘ্রই আপনাকে ফোন করে অর্ডারটি কনফার্ম করবেন।',
    "trackOrderButtonBn" TEXT NOT NULL DEFAULT 'অর্ডার ট্র্যাক করুন',
    "goHomeButtonBn" TEXT NOT NULL DEFAULT 'হোম পেজে যান',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CheckoutPageSettings_pkey" PRIMARY KEY ("id")
);
