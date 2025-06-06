export async function _GSPS2PDF(dataStruct) {
  const worker = new Worker(
    '/background-worker.js',
    {type: 'module'}
  );
  
  if (!dataStruct.filename) {
    dataStruct.filename = 'input.pdf';
  }
  if (!dataStruct.outputFilename) {
    dataStruct.outputFilename = 'output.pdf';
  }
  
  worker.postMessage({ 
    psDataURL: dataStruct.psDataURL,
    filename: dataStruct.filename,
    outputFilename: dataStruct.outputFilename,
    target: 'wasm' 
  });
  
  return new Promise((resolve, reject) => {
    const listener = (e) => {
      if (e.data.error) {
        reject(new Error(e.data.error));
        return;
      }
      
      const { pdfData } = e.data;
      const blob = new Blob([pdfData], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      resolve(url);
      worker.removeEventListener('message', listener);
      setTimeout(() => worker.terminate(), 0);
    };
    worker.addEventListener('message', listener);
  });
}