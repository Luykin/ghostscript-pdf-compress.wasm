import { useState } from "react";
import { processZipFiles } from "../lib/zip-processor";

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

export function ZipCompressor() {
  const [state, setState] = useState("init");
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [compressionMode, setCompressionMode] = useState("ebook");

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && (selectedFile.type === "application/zip" || selectedFile.name.endsWith('.zip'))) {
      setFile(selectedFile);
      setState("selected");
      setError(null);
    } else {
      setError("Please select a ZIP file");
      setFile(null);
      setState("init");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) return;

    setState("processing");
    setProgress(0);
    setError(null);

    try {
      const selectedMode = compressionModes.find(mode => mode.id === compressionMode);
      
      const result = await processZipFiles(
        [file],
        {
          onProgress: (p) => setProgress(Math.round(p * 100)),
          onError: (error) => {
            console.error("Error processing file:", error);
            setError(error.message);
          },
          skipCompression: selectedMode.id === "none",
          compressionMode: selectedMode.setting
        }
      );

      if (result && result[0]) {
        const url = URL.createObjectURL(result[0]);
        setDownloadUrl(url);
        setState("complete");
      }
    } catch (err) {
      setError(err.message);
      setState("error");
    }
  };

  const reset = () => {
    setState("init");
    setFile(null);
    setProgress(0);
    setError(null);
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }
  };

  return (
    <>
      <p>Upload a ZIP file containing PDFs to compress all PDFs inside it.</p>
      
      {state !== "processing" && state !== "complete" && (
        <form onSubmit={handleSubmit}>
          <div className="compression-modes">
            {compressionModes.map(mode => (
              <div key={mode.id} className="compression-mode-option">
                <input
                  type="radio"
                  id={`zip-${mode.id}`}
                  name="zipCompressionMode"
                  value={mode.id}
                  checked={compressionMode === mode.id}
                  onChange={(e) => setCompressionMode(e.target.value)}
                />
                <label htmlFor={`zip-${mode.id}`}>
                  <strong>{mode.label}</strong>
                  <span className="mode-description">{mode.description}</span>
                </label>
              </div>
            ))}
          </div>

          <input
            type="file"
            accept=".zip,application/zip"
            onChange={handleFileChange}
            id="zipFile"
          />
          <div className="label padded-button">
            <label htmlFor="zipFile">
              {!file ? "Choose ZIP file" : file.name}
            </label>
          </div>
          
          {state === "selected" && (
            <div className="success-button padded-button padding-top">
              <input
                type="submit"
                value="🚀 Process ZIP file 🚀"
                className="button"
              />
            </div>
          )}
        </form>
      )}

      {state === "processing" && (
        <div className="processing-status">
          <p>Processing... {progress}%</p>
          <div className="progress-bar">
            <div className="progress" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      )}

      {state === "complete" && downloadUrl && (
        <>
          <div className="success-button padded-button">
            <a
              href={downloadUrl}
              download={`compressed_${file.name}`}
            >
              📦 Download Compressed ZIP 📦
            </a>
          </div>
          <div className="blue padded-button padding-top">
            <button onClick={reset}>🔁 Process Another ZIP 🔁</button>
          </div>
        </>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
    </>
  );
}