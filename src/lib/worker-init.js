export async function _GSPS2PDF(dataStruct) {
  const worker = new Worker(
    '/background-worker.js',
    {type: 'module'}
  );
  
  worker.postMessage({ ...dataStruct, target: 'wasm' });
  
  return new Promise((resolve, reject) => {
    const listener = (e) => {
      resolve(e.data);
      worker.removeEventListener('message', listener);
      setTimeout(() => worker.terminate(), 0);
    };
    worker.addEventListener('message', listener);
  });
}