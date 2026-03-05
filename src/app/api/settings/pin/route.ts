import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';

// Default PIN
const DEFAULT_PIN = '123456';

// Simple hash function using crypto
function hashPin(pin: string): string {
  return crypto.createHash('sha256').update(pin + 'neon-erp-salt').digest('hex');
}

// GET - Check if PIN is set
export async function GET() {
  try {
    const settings = await db.systemSettings.findFirst();
    
    return NextResponse.json({
      hasPin: !!settings?.settingsPin,
    });
  } catch (error) {
    console.error('Get PIN status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Verify PIN
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pin } = body;

    if (!pin) {
      return NextResponse.json({ valid: false, error: 'PIN harus diisi' }, { status: 400 });
    }

    // Get stored PIN from database
    const settings = await db.systemSettings.findFirst();
    
    // If no PIN set, use default PIN hash
    const storedPinHash = settings?.settingsPin || hashPin(DEFAULT_PIN);
    
    // If no settings record exists, create one with default PIN
    if (!settings) {
      await db.systemSettings.create({
        data: {
          settingsPin: storedPinHash,
        },
      });
    }

    // Verify PIN
    const inputHash = hashPin(pin);
    const isValid = inputHash === storedPinHash;

    if (isValid) {
      return NextResponse.json({ valid: true });
    } else {
      return NextResponse.json({ valid: false, error: 'PIN salah' }, { status: 401 });
    }
  } catch (error) {
    console.error('Verify PIN error:', error);
    return NextResponse.json({ valid: false, error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// PUT - Change PIN
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { currentPin, newPin } = body;

    if (!currentPin || !newPin) {
      return NextResponse.json({ error: 'PIN lama dan baru harus diisi' }, { status: 400 });
    }

    if (newPin.length < 4) {
      return NextResponse.json({ error: 'PIN baru minimal 4 digit' }, { status: 400 });
    }

    // Get stored PIN from database
    const settings = await db.systemSettings.findFirst();
    
    // If no PIN set, use default PIN hash
    let storedPinHash = settings?.settingsPin;
    
    if (!storedPinHash) {
      storedPinHash = hashPin(DEFAULT_PIN);
      // Create settings with default PIN
      await db.systemSettings.create({
        data: {
          settingsPin: storedPinHash,
        },
      });
    }

    // Verify current PIN
    const currentHash = hashPin(currentPin);
    const isValid = currentHash === storedPinHash;

    if (!isValid) {
      return NextResponse.json({ error: 'PIN lama salah' }, { status: 401 });
    }

    // Hash new PIN
    const newPinHash = hashPin(newPin);

    // Update PIN
    if (settings) {
      await db.systemSettings.update({
        where: { id: settings.id },
        data: { settingsPin: newPinHash },
      });
    } else {
      await db.systemSettings.create({
        data: { settingsPin: newPinHash },
      });
    }

    return NextResponse.json({ success: true, message: 'PIN berhasil diubah' });
  } catch (error) {
    console.error('Change PIN error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
