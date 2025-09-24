import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    console.log('Getting ZIMRA FDMS configuration')

    const config = await prisma.zimra_config.findFirst({
      include: {
        fiscal_devices: {
          where: { status: 'Active' },
          take: 1
        }
      }
    })

    if (!config) {
      return NextResponse.json({
        success: false,
        data: null,
        message: 'No ZIMRA configuration found'
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: config.id,
        taxpayerTIN: config.taxpayer_tin,
        vatRegistrationNo: config.vat_registration_no,
        businessName: config.business_name,
        businessType: config.business_type,
        branchName: config.branch_name,
        branchAddress: config.branch_address,
        status: config.status,
        isFDMSEnabled: config.is_fdms_enabled,
        testEnvironment: config.test_environment,
        hasActiveFiscalDevice: config.fiscal_devices.length > 0,
        fiscalDevice: config.fiscal_devices[0] ? {
          deviceId: config.fiscal_devices[0].device_id,
          deviceSerialNo: config.fiscal_devices[0].device_serial_no,
          status: config.fiscal_devices[0].status,
          globalReceiptCounter: config.fiscal_devices[0].global_receipt_counter.toString(),
          dailyReceiptCounter: config.fiscal_devices[0].daily_receipt_counter
        } : null
      }
    })

  } catch (error: unknown) {
    console.error('FDMS config GET error:', error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('Creating/updating ZIMRA FDMS configuration:', body)

    const {
      taxpayerTIN,
      vatRegistrationNo,
      businessName,
      businessType,
      branchName,
      branchAddress,
      testEnvironment = true,
      isFDMSEnabled = false
    } = body

    // Validate required fields
    if (!taxpayerTIN || !businessName || !businessType || !branchName || !branchAddress) {
      return NextResponse.json({
        error: 'Missing required fields: taxpayerTIN, businessName, businessType, branchName, branchAddress'
      }, { status: 400 })
    }

    // Validate TIN format (10 digits)
    if (!/^\d{10}$/.test(taxpayerTIN)) {
      return NextResponse.json({
        error: 'TIN must be exactly 10 digits'
      }, { status: 400 })
    }

    // Check if config already exists
    const existingConfig = await prisma.zimra_config.findUnique({
      where: { taxpayer_tin: taxpayerTIN }
    })

    let config
    if (existingConfig) {
      // Update existing config
      config = await prisma.zimra_config.update({
        where: { id: existingConfig.id },
        data: {
          vat_registration_no: vatRegistrationNo,
          business_name: businessName,
          business_type: businessType,
          branch_name: branchName,
          branch_address: branchAddress,
          test_environment: testEnvironment,
          is_fdms_enabled: isFDMSEnabled,
          updated_at: new Date()
        }
      })
    } else {
      // Create new config
      config = await prisma.zimra_config.create({
        data: {
          taxpayer_tin: taxpayerTIN,
          vat_registration_no: vatRegistrationNo,
          business_name: businessName,
          business_type: businessType,
          branch_name: branchName,
          branch_address: branchAddress,
          test_environment: testEnvironment,
          is_fdms_enabled: isFDMSEnabled,
          status: 'pending'
        }
      })
    }

    // Create fiscal device if FDMS is enabled and no device exists
    if (isFDMSEnabled) {
      const existingDevice = await prisma.fiscal_devices.findFirst({
        where: { zimra_config_id: config.id }
      })

      if (!existingDevice) {
        const deviceId = `VFD_${taxpayerTIN}_${Date.now()}`
        const deviceSerialNo = `SN${taxpayerTIN.slice(-6)}${Date.now().toString().slice(-4)}`

        await prisma.fiscal_devices.create({
          data: {
            zimra_config_id: config.id,
            device_id: deviceId,
            device_serial_no: deviceSerialNo,
            branch_name: branchName,
            branch_address: branchAddress,
            operating_mode: 'Online',
            status: 'Pending',
            daily_receipt_counter: 0,
            global_receipt_counter: 0
          }
        })

        console.log(`Created fiscal device: ${deviceId}`)
      }
    }

    return NextResponse.json({
      success: true,
      data: config,
      message: existingConfig ? 'Configuration updated successfully' : 'Configuration created successfully'
    })

  } catch (error: unknown) {
    console.error('FDMS config POST error:', error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { isFDMSEnabled } = body

    console.log('Toggling FDMS mode:', isFDMSEnabled)

    const config = await prisma.zimra_config.findFirst()

    if (!config) {
      return NextResponse.json({
        error: 'No ZIMRA configuration found. Please create configuration first.'
      }, { status: 404 })
    }

    const updatedConfig = await prisma.zimra_config.update({
      where: { id: config.id },
      data: {
        is_fdms_enabled: isFDMSEnabled,
        updated_at: new Date()
      }
    })

    // If enabling FDMS and no fiscal device exists, create one
    if (isFDMSEnabled) {
      const existingDevice = await prisma.fiscal_devices.findFirst({
        where: { zimra_config_id: config.id }
      })

      if (!existingDevice) {
        const deviceId = `VFD_${config.taxpayer_tin}_${Date.now()}`
        const deviceSerialNo = `SN${config.taxpayer_tin.slice(-6)}${Date.now().toString().slice(-4)}`

        await prisma.fiscal_devices.create({
          data: {
            zimra_config_id: config.id,
            device_id: deviceId,
            device_serial_no: deviceSerialNo,
            branch_name: config.branch_name,
            branch_address: config.branch_address,
            operating_mode: 'Online',
            status: 'Active', // Auto-activate for demo
            daily_receipt_counter: 0,
            global_receipt_counter: 0
          }
        })

        console.log(`Created and activated fiscal device: ${deviceId}`)
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedConfig,
      message: isFDMSEnabled ? 'FDMS mode enabled successfully' : 'FDMS mode disabled successfully'
    })

  } catch (error: unknown) {
    console.error('FDMS toggle error:', error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}