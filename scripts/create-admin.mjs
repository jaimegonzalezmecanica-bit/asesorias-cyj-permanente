import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const email = 'admin@cyjcondominios.cl'
  const password = 'admin123'
  
  // Check if exists
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    console.log('✓ Admin ya existe:', email)
    return
  }
  
  // Create admin
  const hashedPassword = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: {
      id: crypto.randomUUID(),
      email,
      nombre: 'Administrador',
      apellido: 'CyJ',
      password: hashedPassword,
      rol: 'admin',
      activo: true,
      emailVerificado: new Date(),
      updatedAt: new Date()
    }
  })
  
  console.log('✓ Admin creado exitosamente!')
  console.log('  Email:', user.email)
  console.log('  Password:', password)
}

main()
  .catch(e => { console.error('Error:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
