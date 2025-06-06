import { useState } from "react";
import { _GSPS2PDF } from "../lib/worker-init.js";

const compressionModes = [
  {
    id: "screen",
    label: "Screen (72 DPI)",
    description: "最低质量，最小文件体积，适合屏幕显示（网页、演示）",
    setting: "/screen"
  },
  {
    id: "ebook",
    label: "eBook (150 DPI)",
    description: "中等质量，兼顾清晰度和文件大小，适合电子书",
    setting: "/ebook"
  },
  {
    id: "printer",
    label: "Print (300 DPI)",
    description: "打印标准质量，图像清晰，适合普通打印输出",
    setting: "/printer"
  },
  {
    id: "prepress",
    label: "Prepress (300~400+ DPI)",
    description: "高质量印刷输出，保留编辑信息，适合专业出版",
    setting: "/prepress"
  },
  {
    id: "none",
    label: "No Compression",
    description: "保持原始质量，不进行压缩",
    setting: null
  }
];

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
  const [compressionMode, setCompressionMode] = useState("ebook");

  async function compressPDF(pdf, filename) {
    console.log('compressPDF: Starting compression for:', filename);
    try {
      const selectedMode = compressionModes.find(mode => mode.id === compressionMode);
      
      if (selectedMode.id === "none") {
        const blob = await fetch(pdf).then(r => r.blob());
        const pdfURL = URL.createObjectURL(blob);
        setDownloadLink(pdfURL);
        setState("toBeDownloaded");
        return;
      }

      const dataObject = { 
        psDataURL: pdf,
        filename: filename,
        outputFilename: `compressed_${filename}`,
        compressionMode: selectedMode.setting
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
          <div className="compression-modes">
            {compressionModes.map(mode => (
              <div key={mode.id} className="compression-mode-option">
                <input
                  type="radio"
                  id={mode.id}
                  name="compressionMode"
                  value={mode.id}
                  checked={compressionMode === mode.id}
                  onChange={(e) => setCompressionMode(e.target.value)}
                />
                <label htmlFor={mode.id}>
                  <strong>{mode.label}</strong>
                  <span className="mode-description">{mode.description}</span>
                </label>
              </div>
            ))}
          </div>

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