function loadScript() {
  import("./gs-worker.js");
}

var Module;

function _GSPS2PDF(
  dataStruct,
  responseCallback
) {
  console.log('background-worker: Starting compression with:', dataStruct);
  
  var xhr = new XMLHttpRequest();
  xhr.open("GET", dataStruct.psDataURL);
  xhr.responseType = "arraybuffer";
  
  xhr.onload = function () {
    console.log('background-worker: PDF data loaded, size:', xhr.response.byteLength);
    self.URL.revokeObjectURL(dataStruct.psDataURL);
    
    Module = {
      preRun: [
        function () {
          console.log('background-worker: Writing file:', dataStruct.filename);
          self.Module.FS.writeFile(dataStruct.filename || "input.pdf", new Uint8Array(xhr.response));
        },
      ],
      postRun: [
        function () {
          console.log('background-worker: Processing complete, reading output file');
          var uarray = self.Module.FS.readFile(dataStruct.outputFilename || "output.pdf", { encoding: "binary" });
          var blob = new Blob([uarray], { type: "application/pdf" });
          var pdfDataURL = self.URL.createObjectURL(blob);
          console.log('background-worker: Created output URL:', pdfDataURL);
          responseCallback({ pdfDataURL });
        },
      ],
      arguments: [
        "-sDEVICE=pdfwrite",
        "-dCompatibilityLevel=1.4",
        "-dPDFSETTINGS=/ebook",
        "-DNOPAUSE",
        "-dQUIET",
        "-dBATCH",
        `-sOutputFile=${dataStruct.outputFilename || "output.pdf"}`,
        dataStruct.filename || "input.pdf",
      ],
      print: function (text) {
        console.log('background-worker [gs]:', text);
      },
      printErr: function (text) {
        console.error('background-worker [gs error]:', text);
      },
      totalDependencies: 0,
      noExitRuntime: 1
    };

    if (!self.Module) {
      console.log('background-worker: Initializing new module');
      self.Module = Module;
      loadScript();
    } else {
      console.log('background-worker: Reusing existing module');
      self.Module["calledRun"] = false;
      self.Module["postRun"] = Module.postRun;
      self.Module["preRun"] = Module.preRun;
      self.Module.callMain();
    }
  };
  
  xhr.onerror = function(error) {
    console.error('background-worker: XHR error:', error);
    responseCallback({ error: 'Failed to load PDF file' });
  };
  
  xhr.send();
}

self.addEventListener('message', function(e) {
  console.log('background-worker: Received message:', e.data);
  
  if (e.data.target !== 'wasm'){
    console.log('background-worker: Ignoring non-wasm message');
    return;
  }
  
  _GSPS2PDF(e.data, (data) => {
    console.log('background-worker: Sending response:', data);
    self.postMessage(data);
  });
});

console.log("Worker ready");