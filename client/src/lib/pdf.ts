/**
 * PDF.js functionality
 * 
 * Note: PDF.js is loaded from CDN in index.html (version 3.11.174)
 * Worker configuration is handled by /pdf.worker.config.js
 * This approach reduces module loading and bundling issues in Replit environment
 */

// Import types only - we don't want to load the npm package at runtime
import type * as pdfjsTypes from 'pdfjs-dist';

// Use window.pdfjsLib for actual operations to avoid module conflicts
// This ensures we use the version loaded from CDN (3.11.174)
declare global {
  interface Window {
    pdfjsLib: typeof pdfjsTypes;
  }
}

// Log PDF.js configuration status
console.log('PDF.js module imported. Using global instance from CDN when available.');

/**
 * Verify that PDF.js is configured correctly and log diagnostic information
 * This enhanced version provides more detailed checks for debugging
 */
function checkPdfJsConfiguration(): boolean {
  try {
    // Check browser environment first
    if (typeof window === 'undefined') {
      console.warn('PDF.js check: Running in non-browser environment');
      return false;
    }
    
    // Enhanced checks for PDF.js availability
    const checks = {
      globalPdfjsLib: typeof window.pdfjsLib !== 'undefined',
      globalGetDocument: false,
      pdfjsVersion: 'unknown',
      workerConfigured: false
    };
    
    // Check global instance (from CDN)
    if (checks.globalPdfjsLib) {
      checks.globalGetDocument = typeof window.pdfjsLib.getDocument === 'function';
      checks.pdfjsVersion = window.pdfjsLib.version || 'unknown';
      checks.workerConfigured = Boolean(window.pdfjsLib.GlobalWorkerOptions?.workerSrc);
      console.log(`PDF.js global instance: version ${checks.pdfjsVersion}, worker configured: ${checks.workerConfigured}`);
    }
    
    // Determine overall status
    const isConfigured = checks.globalPdfjsLib && checks.globalGetDocument;
    
    if (isConfigured) {
      console.log('PDF.js is properly configured');
    } else {
      console.warn('PDF.js configuration issues detected:', checks);
      // Try to give specific guidance on what's missing
      if (!checks.globalPdfjsLib) {
        console.error('PDF.js is not available at all. Check script loading in HTML.');
      } else if (!checks.globalGetDocument) {
        console.error('PDF.js is missing critical methods. Check for version mismatch.');
      }
      if (checks.globalPdfjsLib && !checks.workerConfigured) {
        console.warn('PDF.js worker is not configured. PDF processing may fail.');
      }
    }
    
    return isConfigured;
  } catch (error) {
    console.error('PDF.js configuration check failed with error:', error);
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
      
      // Enhanced PDF.js initialization with better error handling and fallbacks
      let pdfjsLib;
      
      // First, try to use the global object (from CDN)
      if (typeof window.pdfjsLib !== 'undefined') {
        console.log("Using global pdfjsLib from CDN");
        pdfjsLib = window.pdfjsLib;
      }
      // Last resort: try to dynamically load it
      else {
        console.error("PDF.js not available - attempting to load dynamically");
        throw new Error('PDF.js library could not be loaded. Please try reloading the page or using a different browser.');
      }
      
      // Log the PDF.js version to help with debugging
      console.log("PDF.js version:", pdfjsLib.version || "unknown");
      
      // Enhanced options for PDF.js to improve reliability
      const loadingTask = pdfjsLib.getDocument({ 
        data: arrayBuffer,
        disableRange: true,     // Disable range requests
        disableStream: true,    // Disable streaming
        disableAutoFetch: true, // Disable auto fetch
        // Use CDNs for better font handling in Replit environment
        cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
        cMapPacked: true,
        // Additional options to improve reliability
        useSystemFonts: false,  // Don't rely on system fonts
        isEvalSupported: false  // Avoid potential security restrictions
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
      
      // Enhanced validation of extracted text
      const trimmedText = fullText.trim();
      
      if (trimmedText.length > 0) {
        // Check for meaningful content (not just numbers, punctuation, or garbage)
        if (trimmedText.length < 20) {
          console.warn("PDF text extraction resulted in very little content:", trimmedText);
          throw new Error('The PDF contains too little text content to analyze. It may be mostly images or scanned.');
        }
        
        // Check if the text has word-like chunks
        const wordPattern = /[a-zA-Z]{3,}/;
        if (!wordPattern.test(trimmedText)) {
          console.warn("PDF text extraction did not find recognizable words");
          throw new Error('The PDF does not contain recognizable text. It may be scanned or contain only images.');
        }
        
        console.log(`PDF text extraction successful. Extracted ${trimmedText.length} characters.`);
        activeExtractions.delete(extractionId);
        return trimmedText;
      } else {
        console.warn("PDF.js extracted empty text content");
        throw new Error('No text content found in the PDF. It may be scanned or contain only images.');
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
        
        // Create a new loading task with different options and parameters
        console.log("Setting up alternative PDF.js loading method");
        
        // Try to use the global object (from CDN)
        let pdfLib;
        if (typeof window.pdfjsLib !== 'undefined') {
          console.log("Alternative method: Using global pdfjsLib");
          pdfLib = window.pdfjsLib;
        } else {
          console.error("PDF.js not available for alternative method");
          throw new Error('PDF.js library is not available. Please try refreshing the page or using a different browser.');
        }
        
        // Use simpler load parameters for maximum compatibility
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
        
        // Last resort: try one more approach for difficult PDFs with minimum options
        try {
          console.log("Attempting minimal configuration PDF loading method...");
          
          // Try to use the global object (from CDN)
          let pdfLib;
          if (typeof window.pdfjsLib !== 'undefined') {
            pdfLib = window.pdfjsLib;
          } else {
            throw new Error('PDF.js library is not available for minimal method');
          }
          
          // Use absolute minimum configuration
          const minimalLoadingTask = pdfLib.getDocument(arrayBuffer);
          const minPdf = await minimalLoadingTask.promise;
          
          if (isCancelled) throw new Error('Extraction cancelled');
          
          let minFullText = '';
          
          // Extract text with minimal processing
          for (let i = 1; i <= minPdf.numPages; i++) {
            if (isCancelled) throw new Error('Extraction cancelled');
            
            const page = await minPdf.getPage(i);
            const textContent = await page.getTextContent();
            
            const pageText = Array.isArray(textContent.items)
              ? textContent.items
                  .filter((item: any) => item && typeof item.str === 'string')
                  .map((item: any) => item.str)
                  .join(' ')
              : '';
            
            minFullText += pageText + '\n\n';
          }
          
          const trimmedMinText = minFullText.trim();
          if (trimmedMinText.length > 0) {
            console.log("Minimal PDF.js extraction method succeeded with", trimmedMinText.length, "characters");
            activeExtractions.delete(extractionId);
            return trimmedMinText;
          }
          
          throw new Error('Failed to extract text with minimal method');
        } catch (minError) {
          console.warn("Minimal PDF.js extraction failed:", minError);
          
          // Check file signature as a last resort
          try {
            // PDF signature check
            // PDF files should start with "%PDF-" 
            // and end with "%%EOF" (may be preceded by whitespace)
            const headerBytes = new Uint8Array(arrayBuffer, 0, Math.min(10, arrayBuffer.byteLength));
            const headerText = String.fromCharCode.apply(null, Array.from(headerBytes));
            
            if (!headerText.startsWith('%PDF-')) {
              throw new Error('The file does not have a valid PDF signature (%PDF-). It may not be a PDF file.');
            }
            
            // If we reach here, it's probably a PDF but we just can't extract text from it
            throw new Error('This PDF appears to be valid but might be scanned or contain only images. No text could be extracted.');
          } catch (sigError) {
            // If we reach here, no method worked
            console.error("Signature check failed:", sigError);
            throw new Error('The file could not be processed. Please make sure it\'s a valid PDF.');
          }
        }
      }
    }
  } catch (error: unknown) {
    // Clean up extraction record
    activeExtractions.delete(extractionId);
    
    console.error("PDF extraction failed:", error);
    
    // Handle cancellation specifically
    if (isCancelled) {
      throw new Error('PDF extraction was cancelled');
    }
    
    // Format error message for display
    let errorMessage = 'Unknown error occurred';
    
    // Properly handle error objects regardless of type
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Check for cancellation message in Error objects
      if (error.message.includes('cancelled')) {
        throw new Error('PDF extraction was cancelled');
      }
      
      console.log("Error details:", error, typeof error);
      
      try {
        console.log("Error details:", JSON.stringify(error));
      } catch {
        // Ignore circular reference errors when stringifying
      }
    } else if (typeof error === 'string') {
      // Handle string errors
      errorMessage = error;
    } else if (error && typeof error === 'object') {
      // Try to get some useful information from the error object
      try {
        errorMessage = JSON.stringify(error);
      } catch {
        // If that fails, just use properties we can safely access
        errorMessage = `Object error: ${Object.prototype.toString.call(error)}`;
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