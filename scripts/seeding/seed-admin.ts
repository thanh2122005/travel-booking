import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('123', 10)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin' },
    update: {
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
    create: {
      email: 'admin',
      fullName: 'Administrator',
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
    }
  })

  console.log(`Admin account created! Email: ${admin.email}, Role: ${admin.role}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
