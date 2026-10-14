// prisma/seed.ts
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Create Admin user
  const admin = await prisma.user.upsert({
    where: { nationalId: "0000000000000" },
    update: {},
    create: {
      nationalId: "0000000000000",
      firstName: "Admin",
      lastName: "System",
      address: "System Administrator",
      role: "ADMIN",
      constituency: {
        connectOrCreate: {
          where: {
            province_districtNumber: {
              province: "Bangkok",
              districtNumber: 1,
            },
          },
          create: {
            province: "Bangkok",
            districtNumber: 1,
          },
        },
      },
    },
  });
}

main()
  .catch((e) => {
    console.error("Error during seeding: ", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
