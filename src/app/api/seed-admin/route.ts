import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

// POST - Create admin user only
export async function POST() {
  try {
    // Check if admin already exists
    const existingAdmin = await db.user.findUnique({
      where: { email: 'admin@cyjcondominios.cl' }
    })
    
    if (existingAdmin) {
      return NextResponse.json({ message: 'Admin user already exists', email: 'admin@cyjcondominios.cl' })
    }
    
    // Create admin user
    const hashedPassword = await hashPassword('admin123')
    
    const user = await db.user.create({
      data: {
        email: 'admin@cyjcondominios.cl',
        nombre: 'Administrador',
        apellido: 'CyJ',
        password: hashedPassword,
        rol: 'admin',
        activo: true,
        emailVerificado: new Date(),
      }
    })
    
    return NextResponse.json({ 
      message: 'Admin user created successfully', 
      email: user.email,
      password: 'admin123'
    })
  } catch (error) {
    console.error('Error creating admin:', error)
    return NextResponse.json({ error: 'Error creating admin user', details: String(error) }, { status: 500 })
  }
}

// GET - Check admin user status
export async function GET() {
  try {
    const admin = await db.user.findUnique({
      where: { email: 'admin@cyjcondominios.cl' },
      select: { email: true, nombre: true, rol: true, activo: true }
    })
    
    return NextResponse.json({ 
      exists: !!admin,
      admin: admin
    })
  } catch (error) {
    console.error('Error checking admin:', error)
    return NextResponse.json({ error: 'Error checking admin user' }, { status: 500 })
  }
}
