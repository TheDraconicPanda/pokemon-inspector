/**
 * Binary Save Reader for NDS Save Files
 */

// Full Gen 4 Character Encoding Mapping (English / Standard NDS)
function decodeGen4Char(charCode) {
  // End of string or null
  if (charCode === 0xFFFF || charCode === 0x0000) return null;

  // Numbers 0-9
  if (charCode >= 0x010E && charCode <= 0x0117) {
    return String.fromCharCode(48 + (charCode - 0x010E));
  }

  // Uppercase A-Z (0x0121 is 'A')
  if (charCode >= 0x0121 && charCode <= 0x013A) {
    return String.fromCharCode(65 + (charCode - 0x0121));
  }

  // Lowercase a-z (0x013B is 'a')
  if (charCode >= 0x013B && charCode <= 0x0154) {
    return String.fromCharCode(97 + (charCode - 0x013B));
  }

  // Space & Special Characters
  if (charCode === 0x01A1 || charCode === 0x0001) return ' ';
  if (charCode === 0x01A2) return '♂';
  if (charCode === 0x01A3) return '♀';
  if (charCode === 0x01A8) return '?';
  if (charCode === 0x01A9) return '!';
  if (charCode === 0x01AB) return '-';
  if (charCode === 0x01AC) return '.';
  if (charCode === 0x01AD) return '…';

  // Direct ASCII fallback for codes under 128
  if (charCode < 0x007F) {
    return String.fromCharCode(charCode);
  }

  return '?'; // Unknown/Unsupported symbol
}

class SaveReader {
  constructor(arrayBuffer) {
    this.buffer = arrayBuffer;
    this.view = new DataView(arrayBuffer);
    this.byteLength = arrayBuffer.byteLength;
  }

  getUint8(offset) {
    return this.view.getUint8(offset);
  }

  getUint16(offset) {
    return this.view.getUint16(offset, true); // Little-Endian
  }

  getUint32(offset) {
    return this.view.getUint32(offset, true); // Little-Endian
  }

  /**
   * Decodes Gen 4 string up to max characters
   */
  getString(offset, maxChars = 8) {
    let result = '';
    for (let i = 0; i < maxChars; i++) {
      const charCode = this.getUint16(offset + (i * 2));
      const char = decodeGen4Char(charCode);
      if (char === null) break; // Terminate on 0xFFFF or 0x0000
      result += char;
    }
    return result;
  }

  /**
   * Determines active Gen 4 save block (Block A or Block B) based on Save Counter
   */
  getGen4ActiveBlock() {
    const BLOCK_A_FOOTER = 0xC0F0;
    const BLOCK_B_FOOTER = 0x4C0F0;

    const countA = this.getUint32(BLOCK_A_FOOTER);
    const countB = this.getUint32(BLOCK_B_FOOTER);

    if (countB > countA) {
      return {
        activeBlockOffset: 0x40000,
        saveCount: countB,
        blockName: 'Block B (Secondary)'
      };
    }

    return {
      activeBlockOffset: 0x00000,
      saveCount: countA,
      blockName: 'Block A (Primary)'
    };
  }

  /**
   * Parses save file header details
   */
  parseHeader() {
    const NDS_SAV_SIZE = 524288; // 512KB
    
    if (this.byteLength < NDS_SAV_SIZE) {
      throw new Error(`Invalid file size: ${this.byteLength} bytes. Expected at least 512KB.`);
    }

    const blockInfo = this.getGen4ActiveBlock();

    return {
      fileSizeKB: Math.floor(this.byteLength / 1024),
      isDsv: this.byteLength > NDS_SAV_SIZE,
      activeBlockOffset: blockInfo.activeBlockOffset,
      saveCount: blockInfo.saveCount,
      activeBlockName: blockInfo.blockName
    };
  }

  /**
   * Extracts Trainer Information from HG/SS save block
   */
  parseTrainerInfo(baseOffset) {
    const TRAINER_NAME_OFFSET = baseOffset + 0x0064;
    const TID_OFFSET = baseOffset + 0x0074;
    const SID_OFFSET = baseOffset + 0x0076;
    const MONEY_OFFSET = baseOffset + 0x0078;

    return {
      name: this.getString(TRAINER_NAME_OFFSET, 8) || "UNKNOWN",
      tid: this.getUint16(TID_OFFSET),
      sid: this.getUint16(SID_OFFSET),
      money: this.getUint32(MONEY_OFFSET)
    };
  }
}