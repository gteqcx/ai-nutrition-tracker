-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female');

-- CreateEnum
CREATE TYPE "Goal" AS ENUM ('lose', 'maintain', 'gain');

-- CreateEnum
CREATE TYPE "ActivityLevel" AS ENUM ('sedentary', 'light', 'moderate', 'high', 'veryHigh');

-- CreateEnum
CREATE TYPE "PendingStatus" AS ENUM ('awaitingGrams', 'awaitingConfirmation');

-- CreateTable
CREATE TABLE "User" (
    "id" BIGINT NOT NULL,
    "gender" "Gender" NOT NULL,
    "age" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "targetWeight" DOUBLE PRECISION,
    "goal" "Goal" NOT NULL,
    "activityLevel" "ActivityLevel" NOT NULL,
    "dailyCalories" INTEGER NOT NULL,
    "dailyProtein" INTEGER NOT NULL,
    "dailyFat" INTEGER NOT NULL,
    "dailyCarbs" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meal" (
    "id" SERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "description" TEXT NOT NULL,
    "calories" INTEGER NOT NULL,
    "protein" INTEGER NOT NULL,
    "fat" INTEGER NOT NULL,
    "carbs" INTEGER NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Meal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PendingMeal" (
    "id" SERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "description" TEXT NOT NULL,
    "calories" INTEGER,
    "protein" INTEGER,
    "fat" INTEGER,
    "carbs" INTEGER,
    "imageUrl" TEXT,
    "detectedDish" TEXT,
    "status" "PendingStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PendingMeal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Meal_userId_createdAt_idx" ON "Meal"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "PendingMeal_userId_idx" ON "PendingMeal"("userId");

-- AddForeignKey
ALTER TABLE "Meal" ADD CONSTRAINT "Meal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingMeal" ADD CONSTRAINT "PendingMeal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
