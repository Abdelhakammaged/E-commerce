-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "sku" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- Migrate existing products into default variants
INSERT INTO "ProductVariant" ("id", "productId", "color", "size", "price", "stock", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    p."id",
    COALESCE(p."colors"[1], 'default'),
    COALESCE(p."size", 'default'),
    p."price",
    p."stock",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "Product" p;

-- Add variantId columns (nullable during backfill)
ALTER TABLE "CartItem" ADD COLUMN "variantId" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN "variantId" TEXT;

-- Backfill cart items using the first variant per product
UPDATE "CartItem" ci
SET "variantId" = (
    SELECT pv."id"
    FROM "ProductVariant" pv
    WHERE pv."productId" = ci."productId"
    ORDER BY pv."createdAt" ASC
    LIMIT 1
);

-- Backfill order items using the first variant per product
UPDATE "OrderItem" oi
SET "variantId" = (
    SELECT pv."id"
    FROM "ProductVariant" pv
    WHERE pv."productId" = oi."productId"
    ORDER BY pv."createdAt" ASC
    LIMIT 1
);

-- Drop old product relations
ALTER TABLE "CartItem" DROP CONSTRAINT "CartItem_productId_fkey";
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_productId_fkey";

DROP INDEX IF EXISTS "CartItem_cartId_productId_key";

ALTER TABLE "CartItem" DROP COLUMN "productId";
ALTER TABLE "OrderItem" DROP COLUMN "productId";

ALTER TABLE "CartItem" ALTER COLUMN "variantId" SET NOT NULL;
ALTER TABLE "OrderItem" ALTER COLUMN "variantId" SET NOT NULL;

-- Drop variant fields moved off Product
ALTER TABLE "Product" DROP COLUMN "price",
DROP COLUMN "stock",
DROP COLUMN "size",
DROP COLUMN "colors";

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_sku_key" ON "ProductVariant"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_productId_color_size_key" ON "ProductVariant"("productId", "color", "size");

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_cartId_variantId_key" ON "CartItem"("cartId", "variantId");

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
