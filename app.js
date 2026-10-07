// UI Controller Logic
    document.addEventListener('DOMContentLoaded', () => {
      const dropZone = document.getElementById('drop-zone');
      const fileInput = document.getElementById('file-input');
      const consoleOutput = document.getElementById('console-output');
      const fileInfoCard = document.getElementById('file-info-card');

      const metaFilename = document.getElementById('meta-filename');
      const metaFilesize = document.getElementById('meta-filesize');
      const metaFormat = document.getElementById('meta-format');
      const metaStatus = document.getElementById('meta-status');

      function log(message) {
        consoleOutput.textContent += message + '\n';
      }

      function clearLog() {
        consoleOutput.textContent = '';
      }

      // Drag & Drop Handlers
      dropZone.addEventListener('click', () => fileInput.click());

      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
      });

      dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
      });

      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
          handleFile(e.dataTransfer.files[0]);
        }
      });

      fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          handleFile(e.target.files[0]);
        }
      });

      // File Reader Logic
      function handleFile(file) {
        clearLog();
        log(`Loading file: ${file.name}`);
        log(`File size: ${file.size} bytes`);

        const reader = new FileReader();

        reader.onload = function(e) {
          const buffer = e.target.result;
          const saveReader = new SaveReader(buffer);

          // Update Meta Header UI
          fileInfoCard.style.display = 'block';
          metaFilename.textContent = file.name;
          metaFilesize.textContent = `${(file.size / 1024).toFixed(1)} KB (${file.size} B)`;

          // Validate file size (NDS save standard is 512 KB = 524,288 bytes, or .dsv with footer ~524,410 bytes)
          let formatType = 'Unknown File';
          if (file.size === 524288) {
            formatType = 'Standard NDS Raw (.sav)';
            metaStatus.innerHTML = `<span class="badge badge-success">Valid Size</span>`;
          } else if (file.size > 524288 && file.name.endsWith('.dsv')) {
            formatType = 'DeSmuME / Delta Save (.dsv)';
            metaStatus.innerHTML = `<span class="badge badge-success">Valid DSV</span>`;
          } else {
            metaStatus.innerHTML = `<span class="badge badge-warning">Non-Standard</span>`;
          }
          metaFormat.textContent = formatType;

          log(`Successfully initialized SaveReader instance.`);
          log(`Header Byte 0x0000: 0x${saveReader.getUint8(0).toString(16).padStart(2, '0').toUpperCase()}`);
          log(`First 4 Bytes (32-bit LE): 0x${saveReader.getUint32(0, true).toString(16).toUpperCase()}`);
          log(`Ready for Phase 2: Save block detection and offsets.`);
        };

        reader.onerror = function() {
          log('Error reading file!');
        };

        reader.readAsArrayBuffer(file);
      }
    });