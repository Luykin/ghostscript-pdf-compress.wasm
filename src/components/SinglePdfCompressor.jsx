import { useState } from "react";
import { _GSPS2PDF } from "../lib/worker-init.js";

function loadPDFData(response, filename) {
  return new Promise((resolve, reject) => {
    console.log('loadPDFData: Starting with response:', response);
    
    const xhr = new XMLHttpRequest();
    xhr.open("GET", response);
    xhr.responseType = "arraybuffer";
    
    xhr.onload = function () {
      console.log('loadPDFData: Data loaded, size:', xhr.response.byteLength);
      window.URL.revokeObjectURL(response);
      const blob = new Blob([xhr.response], {type: "application/pdf"});
      const pdfURL = window.URL.createObjectURL(blob);
      const size = xhr.response.byteLength;
      resolve({pdfURL, size});
    };
    
    xhr.onerror = function(error) {
      console.error('loadPDFData: XHR error:', error);
      reject(error);
    };
    
    xhr.send();
  });
}

export function SinglePdfCompressor() {
  const [state, setState] = useState("init");
  const [file, setFile] = useState(undefined);
  const [downloadLink, setDownloadLink] = useState(undefined);
  const [error, setError] = useState(null);

  async function compressPDF(pdf, filename) {
    console.log('compressPDF: Starting compression for:', filename);
    try {
      const dataObject = { 
        psDataURL: pdf,
        filename: filename,
        outputFilename: `compressed_${filename}`
      };
      
      console.log('compressPDF: Calling _GSPS2PDF with:', dataObject);
      const element = await _GSPS2PDF(dataObject);
      
      console.log('compressPDF: Got response from _GSPS2PDF:', element);
      const { pdfURL, size: newSize } = await loadPDFData(element, filename);
      
      setDownloadLink(pdfURL);
      setState("toBeDownloaded");
    } catch (err) {
      console.error('compressPDF: Error during compression:', err);
      setError(err.message);
      setState("error");
    }
  }

  const changeHandler = (event) => {
    const file = event.target.files[0];
    console.log('changeHandler: File selected:', file.name);
    const url = window.URL.createObjectURL(file);
    setFile({ filename: file.name, url });
    setState("selected");
    setError(null);
  };

  const onSubmit = (event) => {
    event.preventDefault();
    const { filename, url } = file;
    console.log('onSubmit: Starting compression for file:', filename);
    compressPDF(url, filename);
    setState("loading");
    return false;
  };

  let minFileName = file && file.filename && file.filename.replace(".pdf", "-min.pdf");

  return (
    <>
      <p>
        The best tool I know to compress PDF is{" "}
        <a target="_blank" href="https://ghostscript.com/">
          Ghostscript
        </a>
        .
      </p>
      {state !== "loading" && state !== "toBeDownloaded" && (
        <form onSubmit={onSubmit}>
          <input
            type="file"
            accept="application/pdf"
            name="file"
            onChange={changeHandler}
            id="file"
          />
          <div className="label padded-button">
            <label htmlFor="file">
              {!file || !file.filename
                ? `Choose PDF to compress`
                : file.filename}
            </label>
          </div>
          {state === "selected" && (
            <div className="success-button padded-button padding-top">
              <input
                className="button"
                type="submit"
                value="🚀 Compress this PDF in the browser! 🚀"
              />
            </div>
          )}
        </form>
      )}
      {state === "loading" && "Loading...."}
      {state === "toBeDownloaded" && (
        <>
          <div className="success-button padded-button">
            <a href={downloadLink} download={minFileName}>
              {`📄 Download ${minFileName} 📄`}
            </a>
          </div>
          <div className="blue padded-button padding-top">
            <a href="./">{`🔁 Compress another PDF 🔁`}</a>
          </div>
        </>
      )}
      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}
    </>
  );
}