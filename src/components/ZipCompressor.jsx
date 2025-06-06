import { useState } from "react";
import { processZipFiles } from "../lib/zip-processor";

export function ZipCompressor() {
  const [state, setState] = useState("init");
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);

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
      const result = await processZipFiles(
        [file],
        {
          quality: "ebook",
          onProgress: (p) => setProgress(Math.round(p * 100)),
          onError: (error) => {
            console.error("Error processing file:", error);
            setError(error.message);
          },
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