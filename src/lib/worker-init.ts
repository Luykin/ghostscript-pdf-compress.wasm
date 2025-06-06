interface DataStruct {
  psDataURL: string;
  filename?: string;
  outputFilename?: string;
  compressionMode?: string;
}

interface WorkerMessage {
  psDataURL: string;
  filename: string;
  outputFilename: string;
  compressionMode: string;
  target: 'wasm';
}

interface WorkerResponse {
  error?: string;
  pdfDataURL?: string;
}

export async function _GSPS2PDF(dataStruct: DataStruct): Promise<string> {
  console.log('worker-init: Starting with dataStruct:', dataStruct);
  
  const worker = new Worker(
    '/background-worker.js',
    {type: 'module'}
  );
  
  const message: WorkerMessage = {
    psDataURL: dataStruct.psDataURL,
    filename: dataStruct.filename || 'input.pdf',
    outputFilename: dataStruct.outputFilename || 'output.pdf',
    compressionMode: dataStruct.compressionMode || '/ebook',
    target: 'wasm'
  };
  
  console.log('worker-init: Sending message to worker:', message);
  worker.postMessage(message);
  
  return new Promise((resolve, reject) => {
    const listener = (e: MessageEvent<WorkerResponse>) => {
      console.log('worker-init: Received response from worker:', e.data);
      
      if (e.data.error) {
        console.error('worker-init: Error from worker:', e.data.error);
        reject(new Error(e.data.error));
        return;
      }
      
      if (!e.data.pdfDataURL) {
        reject(new Error('No PDF URL received from worker'));
        return;
      }
      
      resolve(e.data.pdfDataURL);
      worker.removeEventListener('message', listener);
      setTimeout(() => worker.terminate(), 0);
    };
    worker.addEventListener('message', listener);
  });
}