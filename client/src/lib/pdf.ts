/**
 * PDF.js functionality
 * 
 * Note: PDF.js is loaded from CDN in index.html
 * Worker configuration is handled by /pdf.worker.config.js
 * This approach reduces module loading and bundling issues in Replit environment
 */

// Import PDF.js using static import as a type reference
import * as pdfjsLib from 'pdfjs-dist';

// Use window.pdfjsLib for actual operations to avoid module conflicts
// This ensures we use the version loaded from CDN
declare global {
  interface Window {
    pdfjsLib: typeof pdfjsLib;
  }
}

// Log PDF.js configuration status
console.log('PDF.js module imported. Using global instance from CDN when available.');

// Verify that PDF.js is configured correctly
function checkPdfJsConfiguration(): boolean {
  try {
    if (typeof window !== 'undefined' && window.pdfjsLib) {
      console.log('PDF.js available as global object');
      return true;
    } else if (pdfjsLib) {
      console.log('PDF.js available from import');
      return true;  
    }
    return false;
  } catch (error) {
    console.error('PDF.js configuration check failed:', error);
    return false;
  }
}

// Run configuration check when module loads
checkPdfJsConfiguration();

// Define interfaces for PDF.js text content
interface TextItem {
  str: string;
  dir?: string;
  width?: number;
  height?: number;
  transform?: number[];
  fontName?: string;
  hasEOL?: boolean;
  [key: string]: any;
}

interface TextMarkedContent {
  type: string;
  items?: (TextItem | TextMarkedContent)[];
  [key: string]: any;
}

// Define PDF.js interfaces for better typing
interface PDFPageProxy {
  getTextContent(): Promise<{ items: (TextItem | TextMarkedContent)[] }>;
}

interface PDFDocumentProxy {
  numPages: number;
  getPage(pageIndex: number): Promise<PDFPageProxy>;
}

// Store active extraction operations for cancellation capability
const activeExtractions = new Map<string, { cancel: () => void }>();

/**
 * Cancels an ongoing PDF extraction process
 * @param extractionId The ID of the extraction process to cancel
 */
export function cancelExtraction(extractionId: string): boolean {
  if (activeExtractions.has(extractionId)) {
    const extraction = activeExtractions.get(extractionId);
    if (extraction) {
      extraction.cancel();
      activeExtractions.delete(extractionId);
      console.log(`Extraction ${extractionId} cancelled`);
      return true;
    }
  }
  return false;
}

/**
 * Extract text from a PDF file using PDF.js with simplified fallback
 * @param file The PDF file to extract text from
 * @param extractionId Optional ID for the extraction process (for cancellation)
 */
export async function extractTextFromPDF(file: File, extractionId: string = `pdf-${Date.now()}`): Promise<string> {
  // Create a cancellation controller
  let isCancelled = false;
  const cancel = () => {
    isCancelled = true;
    console.log(`Extraction ${extractionId} marked for cancellation`);
  };
  
  // Register this extraction for potential cancellation
  activeExtractions.set(extractionId, { cancel });
  
  try {
    console.log(`Starting PDF extraction for: ${file.name} (${file.size} bytes, ID: ${extractionId})`);
    
    // Basic validation of the file type
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      throw new Error('The selected file does not appear to be a PDF document');
    }
    
    // Create a FileReader and convert to ArrayBuffer
    const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read file as ArrayBuffer'));
        }
      };
      reader.onerror = () => reject(reader.error || new Error('File reading failed'));
      reader.readAsArrayBuffer(file);
    });
    
    if (isCancelled) throw new Error('Extraction cancelled');
    
    // Verify the file signature/magic number for PDF
    // PDF files start with "%PDF-" (hex: 25 50 44 46 2D)
    if (arrayBuffer.byteLength < 5) {
      throw new Error('The file is too small to be a valid PDF document');
    }
    
    const fileHeader = new Uint8Array(arrayBuffer, 0, 5);
    const isPDF = fileHeader[0] === 0x25 && // %
                 fileHeader[1] === 0x50 && // P
                 fileHeader[2] === 0x44 && // D
                 fileHeader[3] === 0x46 && // F
                 fileHeader[4] === 0x2D;   // -
    
    if (!isPDF) {
      throw new Error('The file does not appear to be a valid PDF document');
    }
    
    let fullText = '';
    
    try {
      console.log("Loading PDF document with PDF.js...");
      
      // Enhanced options for PDF.js to improve reliability
      // Use window.pdfjsLib when available (from CDN) or fall back to import
      const pdfLib = (window.pdfjsLib || pdfjsLib);
      const loadingTask = pdfLib.getDocument({ 
        data: arrayBuffer,
        disableRange: true,    // Disable range requests
        disableStream: true,   // Disable streaming
        disableAutoFetch: true, // Disable auto fetch
        // Use CDNs for better font handling in Replit environment
        cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
        cMapPacked: true
      });
      
      // Add a timeout for the loading task
      const pdfLoadPromise = Promise.race([
        loadingTask.promise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('PDF loading timed out after 15 seconds')), 15000)
        )
      ]);
      
      // Wait for the PDF to load
      const pdf = await pdfLoadPromise as PDFDocumentProxy;
      
      if (isCancelled) throw new Error('Extraction cancelled');
      
      console.log(`PDF loaded successfully. Number of pages: ${pdf.numPages}`);
      
      // Extract text from each page
      for (let i = 1; i <= pdf.numPages; i++) {
        if (isCancelled) throw new Error('Extraction cancelled');
        
        console.log(`Processing page ${i}/${pdf.numPages}`);
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // Extract text items and join them with spaces
        const pageText = textContent.items
          .map((item: TextItem | TextMarkedContent) => {
            if ('str' in item) {
              return item.str;
            }
            return '';
          })
          .join(' ');
        
        fullText += pageText + '\n\n';
      }
      
      if (fullText.trim().length > 0) {
        console.log(`PDF text extraction successful. Extracted ${fullText.length} characters.`);
        activeExtractions.delete(extractionId);
        return fullText.trim();
      } else {
        console.warn("PDF.js extracted empty text content");
        throw new Error('No text content found in the PDF');
      }
    } catch (error) {
      console.error("PDF.js extraction failed:", error);
      
      // Handle empty text content case
      if (error instanceof Error && error.message.includes('No text content')) {
        throw new Error('The PDF does not contain extractable text content. It may be scanned or contain only images.');
      }
      
      // Try alternative approach with PDF.js document loading
      try {
        console.log("Attempting alternative PDF loading method...");
        
        // Create a new loading task with different options
        // Use window.pdfjsLib when available (from CDN) or fall back to import
        const pdfLib = (window.pdfjsLib || pdfjsLib);
        const alternativeLoadingTask = pdfLib.getDocument({
          data: arrayBuffer,
          disableRange: true,
          disableStream: true,
          disableAutoFetch: true,
          isEvalSupported: false, // Disable potentially problematic eval
          useSystemFonts: false // Don't rely on system fonts
        });
        
        const altPdf = await alternativeLoadingTask.promise;
        
        if (isCancelled) throw new Error('Extraction cancelled');
        
        let altFullText = '';
        
        // Extract text from each page with the alternative method
        for (let i = 1; i <= altPdf.numPages; i++) {
          if (isCancelled) throw new Error('Extraction cancelled');
          
          const page = await altPdf.getPage(i);
          const textContent = await page.getTextContent();
          
          const pageText = textContent.items
            .filter((item: any) => typeof item.str === 'string')
            .map((item: any) => item.str)
            .join(' ');
          
          altFullText += pageText + '\n\n';
        }
        
        if (altFullText.trim().length > 0) {
          console.log("Alternative PDF.js extraction method succeeded");
          activeExtractions.delete(extractionId);
          return altFullText.trim();
        }
        
        throw new Error('Failed to extract text with alternative method');
      } catch (altError) {
        console.warn("Alternative PDF.js extraction failed:", altError);
        
        // If we reach here, neither method worked
        // Return an error that suggests what might be wrong
        throw new Error('The file could not be processed. Please make sure it\'s a valid PDF.');
      }
    }
  } catch (error: unknown) {
    // Clean up extraction record
    activeExtractions.delete(extractionId);
    
    console.error("PDF extraction failed:", error);
    
    // Handle cancellation specifically
    if (isCancelled || (error instanceof Error && error.message.includes('cancelled'))) {
      throw new Error('PDF extraction was cancelled');
    }
    
    // Format error message for display
    let errorMessage = 'Unknown error occurred';
    if (error instanceof Error) {
      errorMessage = error.message;
      console.log("Error details:", error, typeof error);
      
      try {
        console.log("Error details:", JSON.stringify(error));
      } catch {
        // Ignore circular reference errors when stringifying
      }
    }
    
    // Provide friendly error messages based on error patterns
    if (
      errorMessage.includes('Failed to load image') || 
      errorMessage.includes('Image load timeout') ||
      errorMessage.includes('valid PDF') ||
      errorMessage.includes('could not be processed')
    ) {
      throw new Error('Error Processing PDF: The file could not be processed. Please make sure it\'s a valid PDF.');
    } else if (errorMessage.includes('Failed to read file')) {
      throw new Error('Error Processing PDF: Failed to read the uploaded file. Please try again with a different file.');
    } else if (
      errorMessage.includes('not well-formed') || 
      errorMessage.includes('Invalid PDF') ||
      errorMessage.includes('corrupted')
    ) {
      throw new Error('Error Processing PDF: The file appears to be corrupted or is not a valid PDF. Please try another file.');
    } else if (
      errorMessage.includes('empty text') || 
      errorMessage.includes('No text content')
    ) {
      throw new Error('Error Processing PDF: No text was found in the PDF. It may be scanned or contain only images.');
    } else if (
      errorMessage.includes('worker') || 
      errorMessage.includes('Worker') || 
      errorMessage.includes('timed out') ||
      errorMessage.includes('timeout')
    ) {
      throw new Error('Error Processing PDF: Processing timed out. Please try again with a smaller file or a different PDF.');
    }
    
    // Default error message if no specific pattern matches
    throw new Error('Error Processing PDF: ' + errorMessage);
  }
}