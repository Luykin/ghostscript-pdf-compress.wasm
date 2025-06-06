function loadScript() {
  import("./gs-worker.js");
}

var Module;

function _GSPS2PDF(
  dataStruct,
  responseCallback,
  quality = 'ebook'
) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", dataStruct.psDataURL);
  xhr.responseType = "arraybuffer";
  xhr.onload = function () {
    self.URL.revokeObjectURL(dataStruct.psDataURL);
    
    Module = {
      preRun: [
        function () {
          self.Module.FS.writeFile(dataStruct.filename || "input.pdf", new Uint8Array(xhr.response));
        },
      ],
      postRun: [
        function () {
          var uarray = self.Module.FS.readFile(dataStruct.outputFilename || "output.pdf", { encoding: "binary" });
          responseCallback({ 
            pdfData: uarray,
            filename: dataStruct.outputFilename || "output.pdf"
          });
        },
      ],
      arguments: [
        "-sDEVICE=pdfwrite",
        "-dCompatibilityLevel=1.4",
        `-dPDFSETTINGS=/${quality}`,
        "-DNOPAUSE",
        "-dQUIET",
        "-dBATCH",
        `-sOutputFile=${dataStruct.outputFilename || "output.pdf"}`,
        dataStruct.filename || "input.pdf",
      ],
      print: function (text) {},
      printErr: function (text) {},
      totalDependencies: 0,
      noExitRuntime: 1
    };

    if (!self.Module) {
      self.Module = Module;
      loadScript();
    } else {
      self.Module["calledRun"] = false;
      self.Module["postRun"] = Module.postRun;
      self.Module["preRun"] = Module.preRun;
      self.Module.callMain();
    }
  };
  xhr.send();
}

self.addEventListener('message', function({data:e}) {
  if (e.target !== 'wasm'){
    return;
  }
  _GSPS2PDF(e.data, ({pdfData, filename}) => 
    self.postMessage({ pdfData, filename }), 
    e.data.quality || 'ebook'
  );
});

console.log("Worker ready");