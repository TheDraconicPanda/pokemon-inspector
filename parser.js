/**
 * Binary Save Reader for NDS Save Files
 */

// Gen 4 Character Encoding Map (HeartGold / SoulSilver)
const GEN4_CHAR_MAP = {
  // Digits
  0x010E: '0', 0x010F: '1', 0x0110: '2', 0x0111: '3', 0x0112: '4',
  0x0113: '5', 0x0114: '6', 0x0115: '7', 0x0116: '8', 0x0117: '9',

  // Uppercase Letters
  0x0121: 'A', 0x0122: 'B', 0x0123: 'C', 0x0124: 'D', 0x0125: 'E',
  0x0126: 'F', 0x0127: 'G', 0x0128: 'H', 0x0129: 'I', 0x012A: 'J',
  0x012B: 'K', 0x012C: 'L', 0x012D: 'M', 0x012E: 'N', 0x012F: 'O',
  0x0130: 'P', 0x0131: 'Q', 0x0132: 'R', 0x0133: 'S', 0x0134: 'T',
  0x0135: 'U', 0x0136: 'V', 0x0137: 'W', 0x0138: 'X', 0x0139: 'Y',
  0x013A: 'Z',

  // Lowercase Letters
  0x013B: 'a', 0x013C: 'b', 0x013D: 'c', 0x013E: 'd', 0x013F: 'e',
  0x0140: 'f', 0x0141: 'g', 0x0142: 'h', 0x0143: 'i', 0x0144: 'j',
  0x0145: 'k', 0x0146: 'l', 0x0147: 'm', 0x0148: 'n', 0x0149: 'o',
  0x014A: 'p', 0x014B: 'q', 0x014C: 'r', 0x014D: 's', 0x014E: 't',
  0x014F: 'u', 0x0150: 'v', 0x0151: 'w', 0x0152: 'x', 0x0153: 'y',
  0x0154: 'z',

  // Symbols & Formatting
  0x0000: '',  0x0001: ' ', 0x01A1: ' ', 0x01A2: '♂', 0x01A3: '♀',
  0x01A8: '?', 0x01A9: '!', 0x01AA: '/', 0x01AB: '-', 0x01AC: '.'
};

// Gen 4 Nature List
const NATURES = [
  "Hardy", "Lonely", "Brave", "Adamant", "Naughty",
  "Bold", "Docile", "Relaxed", "Impish", "Lax",
  "Timid", "Hasty", "Serious", "Jolly", "Naive",
  "Modest", "Mild", "Quiet", "Bashful", "Rash",
  "Calm", "Gentle", "Sassy", "Careful", "Quirky"
];

// Gen 1-4 Species Map (Selected/Common + Indexed)
const SPECIES_NAMES = {
  1: "Bulbasaur", 2: "Ivysaur", 3: "Venusaur", 4: "Charmander", 5: "Charmeleon", 6: "Charizard",
  7: "Squirtle", 8: "Wartortle", 9: "Blastoise", 10: "Caterpie", 11: "Metapod", 12: "Butterfree",
  16: "Pidgey", 19: "Rattata", 25: "Pikachu", 35: "Clefairy", 37: "Vulpix", 41: "Zubat",
  43: "Oddish", 46: "Paras", 47: "Paras", 48: "Venonat", 50: "Diglett", 52: "Meowth", 54: "Psyduck",
  60: "Poliwag", 63: "Abra", 66: "Machop", 72: "Tentacool", 74: "Geodude", 77: "Ponyta", 79: "Slowpoke",
  81: "Magnemite", 83: "Farfetch'd", 84: "Doduo", 86: "Seel", 88: "Grimer", 90: "Shellder", 92: "Gastly",
  95: "Onix", 96: "Drowzee", 98: "Krabby", 100: "Voltorb", 102: "Exeggcute", 104: "Cubone", 108: "Lickitung",
  109: "Koffing", 111: "Rhyhorn", 113: "Chansey", 114: "Tangela", 115: "Kangaskhan", 116: "Horsea",
  118: "Goldeen", 120: "Staryu", 122: "Mr. Mime", 123: "Scyther", 124: "Jynx", 125: "Electabuzz",
  126: "Magmar", 127: "Pinsir", 128: "Tauros", 129: "Magikarp", 131: "Lapras", 132: "Ditto", 133: "Eevee",
  138: "Omanyte", 140: "Kabuto", 142: "Aerodactyl", 143: "Snorlax", 144: "Articuno", 145: "Zapdos",
  146: "Moltres", 147: "Dratini", 150: "Mewtwo", 151: "Mew", 152: "Chikorita", 155: "Cyndaquil",
  158: "Totodile", 161: "Sentret", 163: "Hoothoot", 165: "Ledyba", 167: "Spinarak", 170: "Chinchou",
  172: "Pichu", 173: "Cleffa", 174: "Igglybuff", 175: "Togepi", 177: "Natu", 179: "Mareep", 183: "Marill",
  185: "Sudowoodo", 187: "Hoppip", 190: "Aipom", 191: "Sunkern", 193: "Yanma", 194: "Wooper", 198: "Murkrow",
  200: "Misdreavus", 201: "Unown", 202: "Wobbuffet", 203: "Girafarig", 204: "Pineco", 206: "Dunsparce",
  207: "Gligar", 208: "Steelix", 209: "Snubbull", 211: "Qwilfish", 212: "Scizor", 213: "Shuckle",
  214: "Heracross", 215: "Sneasel", 216: "Teddiursa", 218: "Slugma", 220: "Swinub", 222: "Corsola",
  223: "Remoraid", 225: "Delibird", 226: "Mantine", 227: "Skarmory", 228: "Houndour", 231: "Phanpy",
  233: "Porygon2", 234: "Stantler", 235: "Smeargle", 236: "Tyrogue", 238: "Smoochum", 239: "Elekid",
  240: "Magby", 241: "Miltank", 242: "Blissey", 243: "Raikou", 244: "Entei", 245: "Suicune", 246: "Larvitar",
  249: "Lugia", 250: "Ho-Oh", 251: "Celebi"
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
    return this.view.getUint16(offset, true);
  }

  getUint32(offset) {
    return this.view.getUint32(offset, true);
  }

  getString(offset, maxLengthBytes) {
    let result = '';
    for (let i = 0; i < maxLengthBytes; i += 2) {
      const charCode = this.getUint16(offset + i);
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

  parseHeader() {
    const NDS_SAV_SIZE = 524288;
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

  parseTrainerInfo(baseOffset) {
    const TRAINER_NAME_OFFSET = baseOffset + 0x0064;
    const TID_OFFSET = baseOffset + 0x0074;
    const SID_OFFSET = baseOffset + 0x0076;
    const MONEY_OFFSET = baseOffset + 0x0078;

    return {
      name: this.getString(TRAINER_NAME_OFFSET, 16) || "UNKNOWN",
      tid: this.getUint16(TID_OFFSET),
      sid: this.getUint16(SID_OFFSET),
      money: this.getUint32(MONEY_OFFSET)
    };
  }

  /**
   * Decrypts and unshuffles a 236-byte Gen 4 Party Pokémon structure
   */
  decryptPokemon(pokemonOffset) {
    const decrypted = new Uint8Array(236);

    for (let i = 0; i < 8; i++) {
      decrypted[i] = this.getUint8(pokemonOffset + i);
    }
    for (let i = 136; i < 236; i++) {
      decrypted[i] = this.getUint8(pokemonOffset + i);
    }

    const pid = this.getUint32(pokemonOffset);
    const checksum = this.getUint16(pokemonOffset + 0x06);

    let seed = checksum;
    const decryptedBlock = new Uint8Array(128);
    const blockView = new DataView(decryptedBlock.buffer);

    for (let i = 0; i < 64; i++) {
      const rawWord = this.getUint16(pokemonOffset + 0x08 + (i * 2));
      seed = (Math.imul(seed, 0x41C64E6D) + 0x000060B9) >>> 0;
      const key = seed >>> 16;
      blockView.setUint16(i * 2, rawWord ^ key, true);
    }

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

  getDecryptedString(decryptedArray, offset, maxLengthBytes = 22) {
    const view = new DataView(decryptedArray.buffer);
    let result = '';
    for (let i = 0; i < maxLengthBytes; i += 2) {
      const charCode = view.getUint16(offset + i, true);
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
   * Auto-detects party count/data offsets and extracts party Pokémon
   */
  parseParty(baseOffset) {
    const candidateOffsets = [0x00A0, 0x00A4, 0x009C, 0x0098];
    let partyCountOffset = null;
    let partyDataOffset = null;

    for (const candidate of candidateOffsets) {
      const count = this.getUint32(baseOffset + candidate);
      if (count >= 1 && count <= 6) {
        const testDataOffset = baseOffset + candidate + 4;
        const testLevel = this.getUint8(testDataOffset + 0x8C);
        if (testLevel >= 1 && testLevel <= 100) {
          partyCountOffset = baseOffset + candidate;
          partyDataOffset = testDataOffset;
          break;
        }
      }
    }

    if (!partyCountOffset) {
      partyCountOffset = baseOffset + 0x00A0;
      partyDataOffset = baseOffset + 0x00A4;
    }

    const count = Math.min(this.getUint32(partyCountOffset), 6);
    const party = [];

    for (let i = 0; i < count; i++) {
      const slotOffset = partyDataOffset + (i * 236);
      const decrypted = this.decryptPokemon(slotOffset);
      const view = new DataView(decrypted.buffer);

      const pid = view.getUint32(0x00, true);
      const speciesId = view.getUint16(0x08, true);
      const speciesName = SPECIES_NAMES[speciesId] || `Species #${speciesId}`;
      const nickname = this.getDecryptedString(decrypted, 0x48, 22) || speciesName;
      const level = view.getUint8(0x8C);
      const currentHP = view.getUint16(0x8E, true);
      const maxHP = view.getUint16(0x90, true);
      const nature = NATURES[pid % 25] || "Unknown";

      party.push({
        slot: i + 1,
        speciesId,
        speciesName,
        nickname,
        level,
        currentHP,
        maxHP,
        nature
      });
    }

    return party;
  }
}