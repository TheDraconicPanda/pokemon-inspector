/**
 * Binary Save Reader for NDS Save Files
 */
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
   * Decodes Gen 4 character encoding (UTF-16 variant) into a readable JS String
   */
  getString(offset, maxLengthBytes) {
    let result = '';
    for (let i = 0; i < maxLengthBytes; i += 2) {
      const charCode = this.getUint16(offset + i);
      if (charCode === 0xFFFF || charCode === 0x0000) break; // String terminator

      // Character mapping for Gen 4 (English/Standard)
      if (charCode >= 0x0121 && charCode <= 0x013A) {
        // Upper case A-Z
        result += String.fromCharCode(charCode - 0x0121 + 65);
      } else if (charCode >= 0x013B && charCode <= 0x0154) {
        // Lower case a-z
        result += String.fromCharCode(charCode - 0x013B + 97);
      } else if (charCode >= 0x010E && charCode <= 0x0117) {
        // Numbers 0-9
        result += String.fromCharCode(charCode - 0x010E + 48);
      } else {
        result += '?'; // Fallback for special characters
      }
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
   * Extracts Trainer Information from HeartGold / SoulSilver save structure
   */
  parseTrainerInfo(baseOffset) {
    const TRAINER_NAME_OFFSET = baseOffset + 0x0064;
    const TID_OFFSET = baseOffset + 0x0084;
    const SID_OFFSET = baseOffset + 0x0086;
    const MONEY_OFFSET = baseOffset + 0x0088;

    return {
      name: this.getString(TRAINER_NAME_OFFSET, 16) || "UNKNOWN",
      tid: this.getUint16(TID_OFFSET),
      sid: this.getUint16(SID_OFFSET),
      money: this.getUint32(MONEY_OFFSET)
    };
  }
}
