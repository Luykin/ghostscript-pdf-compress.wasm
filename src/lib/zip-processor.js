import JSZip from 'jszip';
import { _GSPS2PDF } from './worker-init.js';

function sanitizePath(path) {
  const normalized = path.replace(/\\/g, '/').replace(/\/+/g, '/');
  const parts = normalized.split('/');
  const resolved = [];

  for (const part of parts) {
    if (part === '..') {
      if (resolved.length > 0) {
        resolved.pop();
      } else {
        return null;
      }
    } else if (part === '.') {
      continue;
    } else {
      resolved.push(part);
    }
  }

  return resolved.join('/');
}

function isPdf(buffer) {
  const bytes = new Uint8Array(buffer, 0, 4);
  const magicNumber = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
  return magicNumber === '%PDF';
}

async function compressPdfWithGs(pdfBuffer, filename, compressionMode = '/ebook') {
  const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  
  try {
    const compressedPdfUrl = await _GSPS2PDF({
      psDataURL: url,
      filename,
      outputFilename: `compressed_${filename}`,
      compressionMode
    });

    const response = await fetch(compressedPdfUrl);
    const compressedBuffer = await response.arrayBuffer();
    
    // Clean up URLs
    URL.revokeObjectURL(url);
    URL.revokeObjectURL(compressedPdfUrl);
    
    return new Uint8Array(compressedBuffer);
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

export async function processZipFiles(
  files,
  options = {},
  signal
) {
  const { 
    onProgress, 
    skipCompression = false,
    compressionMode = '/ebook',
    onError,
    onComplete 
  } = options;

  const result = [];
  const zipFiles = files.filter(
    file => file.type === 'application/zip' || file.name.endsWith('.zip')
  );

  const nonZipFiles = files.filter(file => !zipFiles.includes(file));
  if (nonZipFiles.length > 0) {
    result.push(...nonZipFiles);
    if (onProgress) {
      onProgress(0.05); // Start with 5% progress
    }
  }

  const totalZips = zipFiles.length;
  let processedZips = 0;

  for (const file of zipFiles) {
    if (signal?.aborted) {
      console.warn('Task aborted');
      break;
    }

    try {
      // Loading ZIP - 10% of progress
      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);
      if (onProgress) onProgress(0.1);
      
      const invalidFiles = [];

      // Validate filenames - 5% of progress
      const validateFilenames = async (folder, path = '') => {
        for (const [name, item] of Object.entries(folder)) {
          const currentPath = path ? `${path}/${name}` : name;
          const safePath = sanitizePath(currentPath);

          if (!safePath) continue;

          if (item.dir) {
            await validateFilenames(item._data, safePath);
          } else if (name.length > 200) {
            invalidFiles.push(safePath);
            break;
          }
        }
      };

      await validateFilenames(zip.files);
      if (onProgress) onProgress(0.15);

      if (invalidFiles.length > 0) {
        const errorMsg = `Files with names longer than 200 characters detected:\n${invalidFiles.join('\n')}`;
        const error = new Error(errorMsg);
        onError?.(error, file);
        continue;
      }

      if (skipCompression) {
        result.push(file);
        processedZips++;
        onProgress?.(processedZips / totalZips);
        continue;
      }

      const outputZip = new JSZip();
      let pdfCount = 0;
      let processedPdfs = 0;

      // Count PDFs - 5% of progress
      for (const [path, zipEntry] of Object.entries(zip.files)) {
        if (!zipEntry.dir && path.toLowerCase().endsWith('.pdf')) {
          pdfCount++;
        }
      }
      if (onProgress) onProgress(0.2);

      // Process PDFs - 60% of progress
      for (const [path, zipEntry] of Object.entries(zip.files)) {
        if (signal?.aborted) break;

        if (!zipEntry.dir) {
          if (path.toLowerCase().endsWith('.pdf')) {
            const pdfBuffer = await zipEntry.async('arraybuffer');
            if (isPdf(pdfBuffer)) {
              try {
                const compressedPdf = await compressPdfWithGs(
                  pdfBuffer,
                  path.split('/').pop(),
                  compressionMode
                );
                outputZip.file(path, compressedPdf);
              } catch (error) {
                console.error('PDF compression failed:', error);
                outputZip.file(path, pdfBuffer);
              }
              processedPdfs++;
              // Calculate progress between 20% and 80%
              if (onProgress) {
                const pdfProgress = processedPdfs / pdfCount;
                onProgress(0.2 + (pdfProgress * 0.6));
              }
            }
          } else {
            const content = await zipEntry.async('uint8array');
            outputZip.file(path, content);
          }
        }
      }

      // Generate final ZIP - remaining 20% of progress
      if (onProgress) onProgress(0.8);
      
      const outputBlob = await outputZip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 9 }
      });
      
      if (onProgress) onProgress(0.9);

      result.push(new File([outputBlob], `compressed_${file.name}`, { type: 'application/zip' }));
      if (onProgress) onProgress(1.0);

    } catch (error) {
      if (!signal?.aborted) {
        console.error('ZIP processing failed:', error);
        onError?.(error instanceof Error ? error : new Error(String(error)), file);
        result.push(file);
      }
    } finally {
      processedZips++;
    }
  }

  onComplete?.(result);
  return result;
}