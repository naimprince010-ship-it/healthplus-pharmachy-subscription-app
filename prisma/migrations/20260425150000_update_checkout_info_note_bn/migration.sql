-- Update checkout success info note default text
ALTER TABLE "CheckoutPageSettings"
ALTER COLUMN "infoNoteBn"
SET DEFAULT 'আমাদের টিম শীঘ্রই আপনার সাথে যোগাযোগ করে অর্ডারটি নিশ্চিত করবে।';

-- Update existing rows that still have the old default text
UPDATE "CheckoutPageSettings"
SET "infoNoteBn" = 'আমাদের টিম শীঘ্রই আপনার সাথে যোগাযোগ করে অর্ডারটি নিশ্চিত করবে।'
WHERE "infoNoteBn" = 'আমাদের একজন ফার্মাসিস্ট শীঘ্রই আপনাকে ফোন করে অর্ডারটি কনফার্ম করবেন।';
