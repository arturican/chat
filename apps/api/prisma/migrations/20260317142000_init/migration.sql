CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

CREATE TABLE "messages" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "messages_user_id_idx" ON "messages"("user_id");

CREATE INDEX "messages_created_at_idx" ON "messages"("created_at");

ALTER TABLE "messages"
ADD CONSTRAINT "messages_user_id_fkey"
FOREIGN KEY ("user_id")
REFERENCES "users"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
