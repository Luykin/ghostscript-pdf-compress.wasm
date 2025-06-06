import { useState } from "react";
import "./App.css";
import { SinglePdfCompressor } from "./components/SinglePdfCompressor";
import { ZipCompressor } from "./components/ZipCompressor";

function App() {
  const [mode, setMode] = useState("single"); // "single" or "zip"

  return (
    <>
      <h1>Free Browser-side PDF Compressor</h1>
      <div className="mode-selector">
        <button 
          className={`mode-button ${mode === "single" ? "active" : ""}`}
          onClick={() => setMode("single")}
        >
          Single PDF
        </button>
        <button 
          className={`mode-button ${mode === "zip" ? "active" : ""}`}
          onClick={() => setMode("zip")}
        >
          ZIP with PDFs
        </button>
      </div>
      
      {mode === "single" ? (
        <SinglePdfCompressor />
      ) : (
        <ZipCompressor />
      )}
      
      <p>
        <i>
          Secure and private by design: the data never leaves your computer.
        </i>
      </p>
      <p>
        Everything is open-source and you can contribute{" "}
        <a
          href="https://github.com/laurentmmeyer/ghostscript-pdf-compress.wasm"
          target="_blank"
        >
          here
        </a>
        .
      </p>
      <br/>
      <p>
        <i>This website uses no tracking, no cookies, no adtech.</i>
      </p>
      <p>
        <a target="_blank" href="https://meyer-laurent.com">
          About me
        </a>
      </p>
    </>
  );
}

export default App;