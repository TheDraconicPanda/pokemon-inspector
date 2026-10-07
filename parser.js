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
   * Determines active Gen 4 save block (Block A or Block B) based on Save Counter
   * @returns {Object} Block metadata
   */
  getGen4ActiveBlock() {
    // HeartGold / SoulSilver Footer Offsets
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
   * Parses save file header and verifies file size
   * @returns {Object} Header details
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
}
