/**
 * Binary Save Reader for NDS Save Files
 */

// Gen 4 HeartGold / SoulSilver Character Map
const GEN4_CHAR_MAP = {
  // Numbers
  0x010E: '0', 0x010F: '1', 0x0110: '2', 0x0111: '3', 0x0112: '4',
  0x0113: '5', 0x0114: '6', 0x0115: '7', 0x0116: '8', 0x0117: '9',

  // Uppercase Letters A-Z
  0x0121: 'A', 0x0122: 'B', 0x0123: 'C', 0x0124: 'D', 0x0125: 'E',
  0x0126: 'F', 0x0127: 'G', 0x0128: 'H', 0x0129: 'I', 0x012A: 'J',
  0x012B: 'K', 0x012C: 'L', 0x012E: 'M', 0x012F: 'N', 0x0130: 'O',
  0x0131: 'P', 0x0132: 'Q', 0x0133: 'R', 0x0134: 'S', 0x0135: 'T',
  0x0136: 'U', 0x0137: 'V', 0x0138: 'W', 0x0139: 'X', 0x013A: 'Y',
  0x013B: 'Z',

  // Lowercase Letters a-z
  0x013C: 'a', 0x013D: 'b', 0x013E: 'c', 0x013F: 'd', 0x0140: 'e',
  0x0141: 'f', 0x0142: 'g', 0x0143: 'h', 0x0144: 'i', 0x0145: 'j',
  0x0146: 'k', 0x0147: 'l', 0x0148: 'm', 0x0149: 'n', 0x014A: 'o',
  0x014B: 'p', 0x014C: 'q', 0x014D: 'r', 0x014E: 's', 0x014F: 't',
  0x0150: 'u', 0x0151: 'v', 0x0152: 'w', 0x0153: 'x', 0x0154: 'y',
  0x0155: 'z',

  // Special Characters
  0x0000: '',  0x0001: ' ', 0x01A1: ' ', 0x01A2: '♂', 0x01A3: '♀',
  0x01A8: '?', 0x01A9: '!', 0x01AB: '-', 0x01AC: '.', 0x01AD: '…'
};

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
   * Decodes Gen 4 character encoding using precise table lookups
   */
  getString(offset, maxChars = 8) {
    let result = '';
    for (let i = 0; i < maxChars; i++) {
      const charCode = this.getUint16(offset + (i * 2));
      
      // End-of-string terminators
      if (charCode === 0xFFFF || charCode === 0x0000) break;

      if (GEN4_CHAR_MAP[charCode] !== undefined) {
        result += GEN4_CHAR_MAP[charCode];
      } else if (charCode <= 0x007F) {
        result += String.fromCharCode(charCode);
      } else {
        result += '?';
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