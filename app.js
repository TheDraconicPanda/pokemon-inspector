document.addEventListener('DOMContentLoaded', () => {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const outputContainer = document.getElementById('output');

  // Drag and drop event handling
  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
    }, false);
  });

  dropZone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files.length) handleFile(files[0]);
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) handleFile(e.target.files[0]);
  });

  function handleFile(file) {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target.result;
        processSaveFile(arrayBuffer);
      } catch (err) {
        displayError(err.message);
      }
    };

    reader.readAsArrayBuffer(file);
  }

  function processSaveFile(arrayBuffer) {
    const saveReader = new SaveReader(arrayBuffer);
    const header = saveReader.parseHeader();

    outputContainer.innerHTML = `
      <div class="card">
        <h3>Save File Header Details</h3>
        <ul>
          <li><strong>File Format:</strong> <span>${header.isDsv ? '.dsv (Emulator Footer Detected)' : '.sav (Standard NDS Raw)'}</span></li>
          <li><strong>Total Size:</strong> <span>${header.fileSizeKB} KB</span></li>
          <li><strong>Active Storage Block:</strong> <span>${header.activeBlockName}</span></li>
          <li><strong>Active Block Offset:</strong> <span>0x${header.activeBlockOffset.toString(16).toUpperCase()}</span></li>
          <li><strong>Save Counter:</strong> <span>${header.saveCount}</span></li>
        </ul>
      </div>
    `;
  }

  function displayError(msg) {
    outputContainer.innerHTML = `
      <div class="error">
        <strong>Parsing Error:</strong> ${msg}
      </div>
    `;
  }
});
