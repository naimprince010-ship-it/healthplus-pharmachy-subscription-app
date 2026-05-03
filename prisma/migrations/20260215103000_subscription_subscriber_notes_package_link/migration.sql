-- Optional full medicine list PDF/doc link per plan + subscriber preference note
ALTER TABLE "SubscriptionPlan" ADD COLUMN "packageDetailLink" TEXT;

ALTER TABLE "Subscription" ADD COLUMN "subscriberNotes" TEXT;
