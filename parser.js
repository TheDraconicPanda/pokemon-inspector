/**
     * SaveReader Class
     * Standardized binary wrapper over DataView with Gen 4 helpers.
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

      getUint16(offset, littleEndian = true) {
        return this.view.getUint16(offset, littleEndian);
      }

      getUint32(offset, littleEndian = true) {
        return this.view.getUint32(offset, littleEndian);
      }

      getBytes(offset, length) {
        return new Uint8Array(this.buffer, offset, length);
      }

      /**
       * Decodes Gen 4 Character Sets (DPPt/HGSS character table)
       */
      getGen4String(offset, maxLength = 16) {
        let result = '';
        for (let i = 0; i < maxLength; i++) {
          const charCode = this.getUint16(offset + i * 2, true);
          
          // String terminator codes in Gen 4
          if (charCode === 0xFFFF || charCode === 0x0000) break;

          // Mapping standard Gen 4 English Character Table
          if (charCode >= 0x0101 && charCode <= 0x010A) {
            // Digits '0'-'9'
            result += String.fromCharCode(charCode - 0x0101 + 48);
          } else if (charCode >= 0x0121 && charCode <= 0x013A) {
            // Uppercase 'A'-'Z'
            result += String.fromCharCode(charCode - 0x0121 + 65);
          } else if (charCode >= 0x013B && charCode <= 0x0154) {
            // Lowercase 'a'-'z'
            result += String.fromCharCode(charCode - 0x013B + 97);
          } else if (charCode === 0x0000) {
            result += ' ';
          } else {
            // Placeholder for special/unmapped characters
            result += '?';
          }
        }
        return result;
      }
    }