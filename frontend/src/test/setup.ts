import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock HTMLCanvasElement for QR code generation
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: vi.fn(() => ({
    createImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
    putImageData: vi.fn(),
    canvas: { width: 256, height: 256 }
  }))
})

// Mock QRCode library
vi.mock('qrcode', () => ({
  default: {
    toCanvas: vi.fn().mockResolvedValue(undefined)
  }
}))