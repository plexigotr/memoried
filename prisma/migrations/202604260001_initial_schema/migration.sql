-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "phone_number" VARCHAR(20) NOT NULL,
    "language" VARCHAR(5) NOT NULL DEFAULT 'tr',
    "plan_type" TEXT NOT NULL DEFAULT 'free',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "premium_until" TIMESTAMPTZ(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magnets" (
    "id" BIGSERIAL NOT NULL,
    "magnet_code" VARCHAR(100) NOT NULL,
    "user_id" BIGINT,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "first_activated_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "magnets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" BIGSERIAL NOT NULL,
    "order_code" VARCHAR(50) NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'pending',
    "package_type" VARCHAR(30) NOT NULL DEFAULT 'starter',
    "gift_package" TEXT DEFAULT 'no',
    "product_name" VARCHAR(255) NOT NULL,
    "variant_text" VARCHAR(100),
    "custom_text" VARCHAR(100),
    "customer_name" VARCHAR(255) NOT NULL,
    "phone_number" VARCHAR(30) NOT NULL,
    "email" VARCHAR(255),
    "identity_number" VARCHAR(30),
    "tax_number" VARCHAR(30),
    "address" TEXT NOT NULL,
    "district" VARCHAR(100),
    "city" VARCHAR(100) NOT NULL,
    "postal_code" VARCHAR(20),
    "price" DECIMAL(10,2) NOT NULL DEFAULT 399.00,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'TRY',
    "iyzico_token" TEXT,
    "iyzico_payment_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memories" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "magnet_id" BIGINT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "title_tr" VARCHAR(255),
    "title_en" VARCHAR(255),
    "subtitle" VARCHAR(255),
    "subtitle_tr" VARCHAR(255),
    "subtitle_en" VARCHAR(255),
    "location_text" VARCHAR(255),
    "location_text_tr" VARCHAR(255),
    "location_text_en" VARCHAR(255),
    "memory_date" DATE,
    "cover_image_path" TEXT,
    "cover_position" TEXT DEFAULT 'center',
    "cover_position_percent" INTEGER DEFAULT 50,
    "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
    "selected_lang" VARCHAR(5) DEFAULT 'tr',
    "edit_password_hash" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "memories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memory_items" (
    "id" BIGSERIAL NOT NULL,
    "memory_id" BIGINT NOT NULL,
    "item_type" VARCHAR(20) NOT NULL,
    "title" VARCHAR(255),
    "title_tr" VARCHAR(255),
    "title_en" VARCHAR(255),
    "content_text" TEXT,
    "content_text_tr" TEXT,
    "content_text_en" TEXT,
    "file_path" TEXT,
    "thumbnail_path" TEXT,
    "location_name" VARCHAR(255),
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rotation" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "memory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_codes" (
    "id" BIGSERIAL NOT NULL,
    "phone_number" VARCHAR(20) NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scan_logs" (
    "id" BIGSERIAL NOT NULL,
    "magnet_id" BIGINT NOT NULL,
    "scanned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "device_info" TEXT,
    "ip_address" VARCHAR(50),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scan_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_number_key" ON "users"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "magnets_magnet_code_key" ON "magnets"("magnet_code");

-- CreateIndex
CREATE INDEX "magnets_user_id_idx" ON "magnets"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_code_key" ON "orders"("order_code");

-- CreateIndex
CREATE UNIQUE INDEX "memories_magnet_id_key" ON "memories"("magnet_id");

-- CreateIndex
CREATE INDEX "memories_user_id_idx" ON "memories"("user_id");

-- CreateIndex
CREATE INDEX "memory_items_memory_id_sort_order_idx" ON "memory_items"("memory_id", "sort_order");

-- CreateIndex
CREATE INDEX "otp_codes_phone_number_idx" ON "otp_codes"("phone_number");

-- CreateIndex
CREATE INDEX "scan_logs_magnet_id_idx" ON "scan_logs"("magnet_id");

-- AddForeignKey
ALTER TABLE "magnets" ADD CONSTRAINT "magnets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memories" ADD CONSTRAINT "memories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memories" ADD CONSTRAINT "memories_magnet_id_fkey" FOREIGN KEY ("magnet_id") REFERENCES "magnets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memory_items" ADD CONSTRAINT "memory_items_memory_id_fkey" FOREIGN KEY ("memory_id") REFERENCES "memories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scan_logs" ADD CONSTRAINT "scan_logs_magnet_id_fkey" FOREIGN KEY ("magnet_id") REFERENCES "magnets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
