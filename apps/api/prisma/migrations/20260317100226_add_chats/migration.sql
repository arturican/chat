-- CreateEnum
CREATE TYPE "ChatType" AS ENUM ('DIRECT', 'GROUP');

-- CreateEnum
CREATE TYPE "ChatMemberRole" AS ENUM ('OWNER', 'MEMBER');

-- CreateTable
CREATE TABLE "chats" (
    "id" UUID NOT NULL,
    "type" "ChatType" NOT NULL,
    "title" TEXT,
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "chats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_members" (
    "chat_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "ChatMemberRole" NOT NULL DEFAULT 'MEMBER',
    "joined_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_members_pkey" PRIMARY KEY ("chat_id","user_id")
);

-- CreateIndex
CREATE INDEX "chats_type_idx" ON "chats"("type");

-- CreateIndex
CREATE INDEX "chats_updated_at_idx" ON "chats"("updated_at");

-- CreateIndex
CREATE INDEX "chat_members_user_joined_idx" ON "chat_members"("user_id", "joined_at");

-- CreateIndex
CREATE INDEX "chat_members_chat_role_idx" ON "chat_members"("chat_id", "role");

-- AddForeignKey
ALTER TABLE "chats" ADD CONSTRAINT "chats_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_members" ADD CONSTRAINT "chat_members_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_members" ADD CONSTRAINT "chat_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
