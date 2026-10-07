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
    const trainer = saveReader.parseTrainerInfo(header.activeBlockOffset);

    // Format TID/SID with leading zeros (5 digits)
    const formattedTID = String(trainer.tid).padStart(5, '0');
    const formattedSID = String(trainer.sid).padStart(5, '0');
    const formattedMoney = trainer.money.toLocaleString();

    outputContainer.innerHTML = `
      <div class="card" style="margin-bottom: 16px;">
        <h3>Trainer Information</h3>
        <ul>
          <li><strong>Trainer Name:</strong> <span>${trainer.name}</span></li>
          <li><strong>Trainer ID (TID):</strong> <span>${formattedTID}</span></li>
          <li><strong>Secret ID (SID):</strong> <span>${formattedSID}</span></li>
          <li><strong>Money:</strong> <span>$${formattedMoney}</span></li>
        </ul>
      </div>

      <div class="card">
        <h3>Save File Details</h3>
        <ul>
          <li><strong>File Format:</strong> <span>${header.isDsv ? '.dsv (Emulator Footer)' : '.sav (Standard Raw)'}</span></li>
          <li><strong>Active Block:</strong> <span>${header.activeBlockName}</span></li>
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
