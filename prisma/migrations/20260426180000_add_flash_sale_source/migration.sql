-- Flash rotation cron tags rows with flashSaleSource = 'auto'
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "flashSaleSource" TEXT;
