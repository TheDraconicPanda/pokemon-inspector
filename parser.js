/**
 * Binary Save Reader for NDS Save Files
 */

// PKHeX Gen 4 Character Table Mapping
const GEN4_CHAR_MAP = {
  // Numbers (0x011B - 0x0124)
  0x011B: '0', 0x011C: '1', 0x011D: '2', 0x011E: '3', 0x011F: '4',
  0x0120: '5', 0x0121: '6', 0x0122: '7', 0x0123: '8', 0x0124: '9',

  // Uppercase Letters A-Z (0x012B - 0x0144)
  0x012B: 'A', 0x012C: 'B', 0x012D: 'C', 0x012E: 'D', 0x012F: 'E',
  0x0130: 'F', 0x0131: 'G', 0x0132: 'H', 0x0133: 'I', 0x0134: 'J',
  0x0135: 'K', 0x0136: 'L', 0x0137: 'M', 0x0138: 'N', 0x0139: 'O',
  0x013A: 'P', 0x013B: 'Q', 0x013C: 'R', 0x013D: 'S', 0x013E: 'T',
  0x013F: 'U', 0x0140: 'V', 0x0141: 'W', 0x0142: 'X', 0x0143: 'Y',
  0x0144: 'Z',

  // Lowercase Letters a-z (0x0145 - 0x015E)
  0x0145: 'a', 0x0146: 'b', 0x0147: 'c', 0x0148: 'd', 0x0149: 'e',
  0x014A: 'f', 0x014B: 'g', 0x014C: 'h', 0x014D: 'i', 0x014E: 'j',
  0x014F: 'k', 0x0150: 'l', 0x0151: 'm', 0x0152: 'n', 0x0153: 'o',
  0x0154: 'p', 0x0155: 'q', 0x0156: 'r', 0x0157: 's', 0x0158: 't',
  0x0159: 'u', 0x015A: 'v', 0x015B: 'w', 0x015C: 'x', 0x015D: 'y',
  0x015E: 'z',

  // Special / Control Characters
  0x0000: '',  0x0100: ' ', 0x01A1: ' ', 0x01A2: '♂', 0x01A3: '♀',
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
   * Decodes Gen 4 string up to max length in bytes (16 bytes = 8 u16 characters)
   */
  getString(offset, maxLengthBytes = 16) {
    let result = '';
    for (let i = 0; i < maxLengthBytes; i += 2) {
      const charCode = this.getUint16(offset + i);
      
      if (charCode === 0xFFFF || charCode === 0x0000) break;

      if (GEN4_CHAR_MAP[charCode] !== undefined) {
        result += GEN4_CHAR_MAP[charCode];
      } else if (charCode >= 0x012B && charCode <= 0x0144) {
        result += String.fromCharCode(charCode - 0x012B + 65); // Upper ASCII
      } else if (charCode >= 0x0145 && charCode <= 0x015E) {
        result += String.fromCharCode(charCode - 0x0145 + 97); // Lower ASCII
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
   * Extracts Trainer Information using verified offsets
   */
  parseTrainerInfo(baseOffset) {
    const TRAINER_NAME_OFFSET = baseOffset + 0x0064; // 16 bytes
    const TID_OFFSET          = baseOffset + 0x0074; // 2 bytes
    const SID_OFFSET          = baseOffset + 0x0076; // 2 bytes
    const MONEY_OFFSET        = baseOffset + 0x0078; // 4 bytes

    return {
      name: this.getString(TRAINER_NAME_OFFSET, 16) || "UNKNOWN",
      tid: this.getUint16(TID_OFFSET),
      sid: this.getUint16(SID_OFFSET),
      money: this.getUint32(MONEY_OFFSET)
    };
  }

  /**
   * Decrypts and unshuffles a 236-byte Gen 4 Party Pokémon structure
   * @param {number} pokemonOffset - Starting byte offset of the Pokémon in save buffer
   * @returns {Uint8Array} Decrypted 236-byte Pokémon buffer
   */
  decryptPokemon(pokemonOffset) {
    const decrypted = new Uint8Array(236);

    // Copy unencrypted bytes: Header (0x00-0x07) and Party Stats (0x88-0xEB)
    for (let i = 0; i < 8; i++) {
      decrypted[i] = this.getUint8(pokemonOffset + i);
    }
    for (let i = 136; i < 236; i++) {
      decrypted[i] = this.getUint8(pokemonOffset + i);
    }

    const pid = this.getUint32(pokemonOffset);
    const checksum = this.getUint16(pokemonOffset + 0x06);

    // 1. LCRNG Decryption for core 128 bytes (offsets 0x08 to 0x87)
    let seed = checksum;
    const decryptedBlock = new Uint8Array(128);
    const blockView = new DataView(decryptedBlock.buffer);

    for (let i = 0; i < 64; i++) {
      const rawWord = this.getUint16(pokemonOffset + 0x08 + (i * 2));
      seed = (Math.imul(seed, 0x41C64E6D) + 0x000060B9) >>> 0;
      const key = seed >>> 16;
      blockView.setUint16(i * 2, rawWord ^ key, true);
    }

    // 2. Unshuffling 4 sub-blocks (32 bytes each) based on PID
    const blockOrders = [
      [0, 1, 2, 3], [0, 1, 3, 2], [0, 2, 1, 3], [0, 2, 3, 1],
      [0, 3, 1, 2], [0, 3, 2, 1], [1, 0, 2, 3], [1, 0, 3, 2],
      [1, 2, 0, 3], [1, 2, 3, 0], [1, 3, 0, 2], [1, 3, 2, 0],
      [2, 0, 1, 3], [2, 0, 3, 1], [2, 1, 0, 3], [2, 1, 3, 0],
      [2, 3, 0, 1], [2, 3, 1, 0], [3, 0, 1, 2], [3, 0, 2, 1],
      [3, 1, 0, 2], [3, 1, 2, 0], [3, 2, 0, 1], [3, 2, 1, 0]
    ];

    const orderIndex = Math.floor((pid >>> 13) % 24);
    const order = blockOrders[orderIndex];

    // Rearrange blocks A (0), B (1), C (2), D (3) into canonical order inside decrypted array
    for (let currentPos = 0; currentPos < 4; currentPos++) {
      const blockId = order[currentPos];
      const srcStart = currentPos * 32;
      const destStart = 8 + (blockId * 32);

      for (let byteIdx = 0; byteIdx < 32; byteIdx++) {
        decrypted[destStart + byteIdx] = decryptedBlock[srcStart + byteIdx];
      }
    }

    return decrypted;
  }

  /**
   * Reads string from decrypted byte array
   */
  getDecryptedString(decryptedArray, offset, maxLengthBytes = 22) {
    const view = new DataView(decryptedArray.buffer);
    let result = '';
    for (let i = 0; i < maxLengthBytes; i += 2) {
      const charCode = view.getUint16(offset + i, true);
      if (charCode === 0xFFFF || charCode === 0x0000) break;

      if (GEN4_CHAR_MAP[charCode] !== undefined) {
        result += GEN4_CHAR_MAP[charCode];
      } else if (charCode >= 0x012B && charCode <= 0x0144) {
        result += String.fromCharCode(charCode - 0x012B + 65);
      } else if (charCode >= 0x0145 && charCode <= 0x015E) {
        result += String.fromCharCode(charCode - 0x0145 + 97);
      } else {
        result += '?';
      }
    }
    return result;
  }

  /**
   * Extracts party Pokémon count and decrypts each slot
   */
  parseParty(baseOffset) {
    const PARTY_COUNT_OFFSET = baseOffset + 0x0098;
    const PARTY_DATA_OFFSET  = baseOffset + 0x009C;

    const count = Math.min(this.getUint32(PARTY_COUNT_OFFSET), 6);
    const party = [];

    for (let i = 0; i < count; i++) {
      const slotOffset = PARTY_DATA_OFFSET + (i * 236);
      const decrypted = this.decryptPokemon(slotOffset);
      const view = new DataView(decrypted.buffer);

      const speciesId = view.getUint16(0x08, true);
      const nickname = this.getDecryptedString(decrypted, 0x48, 22) || `Species #${speciesId}`;
      const level = view.getUint8(0x8C);
      const currentHP = view.getUint16(0x8E, true);
      const maxHP = view.getUint16(0x90, true);

      party.push({
        slot: i + 1,
        speciesId,
        nickname,
        level,
        currentHP,
        maxHP
      });
    }

    return party;
  }

}