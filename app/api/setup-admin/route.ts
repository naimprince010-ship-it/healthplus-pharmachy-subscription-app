import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'

export async function GET() {
    try {
        const adminEmail = 'naimprince010@gmail.com'
        const adminPassword = 'Naim18005'
        const adminPhone = '+8801938264923'
        const adminName = 'Naim Prince'

        const hashedPassword = await hash(adminPassword, 10)

        // Upsert the user. Since email is unique, we find by email.
        // If phone is unique too, we should be careful. 
        // Let's just find by email or phone and update.

        let user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: adminEmail },
                    { phone: adminPhone }
                ]
            }
        })

        if (user) {
            // Update existing user with correct credentials and role
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    role: 'ADMIN',
                    password: hashedPassword,
                    email: adminEmail,
                    phone: adminPhone,
                    name: adminName
                }
            })
            return NextResponse.json({ success: true, message: `Admin account updated successfully for ${adminEmail}` })
        } else {
            // Create new user
            await prisma.user.create({
                data: {
                    role: 'ADMIN',
                    password: hashedPassword,
                    email: adminEmail,
                    phone: adminPhone,
                    name: adminName
                }
            })
            return NextResponse.json({ success: true, message: `Admin account created successfully for ${adminEmail}` })
        }

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
