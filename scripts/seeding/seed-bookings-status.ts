import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findFirst({
    where: { fullName: { contains: 'Minh Anh' } }
  }) || await prisma.user.findFirst({
    where: { bookings: { some: {} } }
  })
  
  if (!user) {
    console.log("User not found!")
    return
  }

  const bookings = await prisma.booking.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' }
  })

  // We want to make sure the user has enough bookings to test
  if (bookings.length > 0) {
    if (bookings[0]) {
      await prisma.booking.update({
        where: { id: bookings[0].id },
        data: { status: 'CONFIRMED', paymentStatus: 'PAID' }
      });
    }
    if (bookings[1]) {
      await prisma.booking.update({
        where: { id: bookings[1].id },
        data: { status: 'COMPLETED', paymentStatus: 'PAID' }
      });
    }
    if (bookings[2]) {
      await prisma.booking.update({
        where: { id: bookings[2].id },
        data: { status: 'CANCELLED', paymentStatus: 'UNPAID' }
      });
    }
    // bookings[3] or any others will stay PENDING
    console.log("Updated bookings with CONFIRMED, COMPLETED, and CANCELLED statuses!")
  } else {
    console.log("User has no bookings!")
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
