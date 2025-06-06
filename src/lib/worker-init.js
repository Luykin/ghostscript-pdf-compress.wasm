export async function _GSPS2PDF(dataStruct) {
  console.log('worker-init: Starting with dataStruct:', dataStruct);
  
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
  
  console.log('worker-init: Sending message to worker:', {
    psDataURL: dataStruct.psDataURL,
    filename: dataStruct.filename,
    outputFilename: dataStruct.outputFilename,
    target: 'wasm'
  });

  worker.postMessage({ 
    psDataURL: dataStruct.psDataURL,
    filename: dataStruct.filename,
    outputFilename: dataStruct.outputFilename,
    target: 'wasm' 
  });
  
  return new Promise((resolve, reject) => {
    const listener = (e) => {
      console.log('worker-init: Received response from worker:', e.data);
      
      if (e.data.error) {
        console.error('worker-init: Error from worker:', e.data.error);
        reject(new Error(e.data.error));
        return;
      }
      
      resolve(e.data.pdfDataURL);
      worker.removeEventListener('message', listener);
      setTimeout(() => worker.terminate(), 0);
    };
    worker.addEventListener('message', listener);
  });
}