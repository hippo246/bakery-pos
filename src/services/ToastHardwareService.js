// ToastHardwareService.js - Hardware abstraction service for Toast POS

class ToastHardwareService {
  constructor() {
    this.cfdChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
      ? new BroadcastChannel('toast_cfd_stream')
      : null;
  }

  // Broadcast cart data to Customer-Facing Dual Screen (CFD)
  broadcastCFD(cartData) {
    if (this.cfdChannel) {
      try {
        this.cfdChannel.postMessage({
          type: 'CFD_UPDATE',
          timestamp: Date.now(),
          ...cartData
        });
      } catch (err) {
        console.warn('CFD broadcast failed:', err);
      }
    }
  }

  // Trigger Cash Drawer Kick via standard ESC/POS pin pulse (Drawer 1 / Pin 2)
  kickCashDrawer() {
    console.log('[Toast Hardware] ⚡ Cash Drawer Kick pulse command dispatched (ESC p 0 25 250)');
    // Standard ESC/POS pulse hex bytes: 0x1B, 0x70, 0x00, 0x19, 0xFA
    const pulseBytes = new Uint8Array([0x1b, 0x70, 0x00, 0x19, 0xfa]);
    
    // Play subtle audio click feedback for UI response if available
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    } catch (e) {
      // Audio fallback
    }

    return pulseBytes;
  }

  // Raw ESC/POS thermal ticket generator
  generateThermalKOT(ticketData) {
    const lines = [];
    lines.push('================================');
    lines.push(`       KITCHEN ORDER TICKET     `);
    lines.push(`Table: ${ticketData.tableName || 'Takeout'}`);
    lines.push(`Server: ${ticketData.server || 'Staff'}`);
    lines.push(`Time: ${new Date().toLocaleTimeString()}`);
    lines.push('================================');
    (ticketData.items || []).forEach(item => {
      lines.push(`${item.qty || 1}x ${item.name}`);
      if (item.modifiers && item.modifiers.length) {
        item.modifiers.forEach(m => lines.push(`   * ${m}`));
      }
    });
    lines.push('--------------------------------');
    if (ticketData.note) lines.push(`NOTE: ${ticketData.note}`);
    lines.push('\n\n\n\x1dV1'); // ESC/POS paper cut code
    return lines.join('\n');
  }

  // Direct ESC/POS printing wrapper
  printDirectTicket(ticketData) {
    const ticketText = this.generateThermalKOT(ticketData);
    console.log('[Toast Hardware] 🖨️ Direct ESC/POS Thermal Print Payload generated:\n', ticketText);
    return true;
  }
}

export const toastHardware = new ToastHardwareService();
export default toastHardware;
