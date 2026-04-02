import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const puntoId = searchParams.get('puntoId')

  if (!puntoId) {
    return NextResponse.json({ error: 'ID de punto no proporcionado' }, { status: 400 })
  }

  try {
    // Generar un token único y temporal para el QR
    const token = uuidv4()
    
    // Guardar el token en el punto de ronda para validación posterior
    await db.puntoRonda.update({
      where: { id: puntoId },
      data: { 
        qrToken: token,
        qrExpiracion: new Date(Date.now() + 10 * 60 * 1000) // 10 minutos de validez
      }
    })

    // La URL que contendrá el QR
    const qrUrl = `${process.env.NEXTAUTH_URL}/sistema/rondas/scan?token=${token}&puntoId=${puntoId}`

    return NextResponse.json({ qrUrl, token })
  } catch (error) {
    console.error('Error al generar QR dinámico:', error)
    return NextResponse.json({ error: 'Error al generar QR' }, { status: 500 })
  }
}
