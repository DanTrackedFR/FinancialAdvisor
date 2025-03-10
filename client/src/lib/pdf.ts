import * as pdfjs from 'pdfjs-dist';
import { createWorker } from "tesseract.js";

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

// Configure PDF.js worker to use our local worker file
// This is the most reliable approach for Replit
if (typeof window !== 'undefined') {
  // Use the local worker file in the public folder
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
  console.log('Using local PDF.js worker file:', pdfjs.GlobalWorkerOptions.workerSrc);
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
 * Extract text from a PDF file using PDF.js with OCR fallback
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
    console.log(`Starting PDF extraction for: ${file.name} (ID: ${extractionId})`);
    
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
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
    
    if (isCancelled) throw new Error('Extraction cancelled');
    
    let fullText = '';
    let usedPDFJS = false;
    
    try {
      // Try to load the PDF document using PDF.js
      console.log("Loading PDF document with PDF.js...");
      
      // Set a timeout to catch worker loading issues
      const workerLoadTimeout = setTimeout(() => {
        throw new Error('PDF.js worker loading timed out');
      }, 10000);
      
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      
      // Add a timeout for the loading task
      const pdfLoadPromise = Promise.race<pdfjs.PDFDocumentProxy>([
        loadingTask.promise,
        new Promise<pdfjs.PDFDocumentProxy>((_, reject) => 
          setTimeout(() => reject(new Error('PDF loading timed out')), 15000)
        )
      ]);
      
      // This is now properly typed due to the generic
      const pdf = await pdfLoadPromise;
      clearTimeout(workerLoadTimeout);
      
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
          .map((item: TextItem | TextMarkedContent) => 
            'str' in item ? item.str : ''
          )
          .join(' ');
        
        fullText += pageText + '\n\n';
      }
      
      // If we got text successfully, mark that we used PDF.js
      if (fullText.trim().length > 0) {
        usedPDFJS = true;
        console.log("PDF text extraction completed successfully with PDF.js");
      }
    } catch (pdfJsError) {
      console.warn("PDF.js extraction failed, will try OCR fallback:", pdfJsError);
    }
    
    // If we already have text from PDF.js, return it
    if (usedPDFJS && fullText.trim().length > 0) {
      activeExtractions.delete(extractionId);
      return fullText.trim();
    }
    
    // If no text was found with PDF.js or PDF.js failed, try OCR as fallback
    console.log("Falling back to OCR for text extraction...");
    
    // Create a data URL for OCR processing
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read file as data URL'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
    
    if (isCancelled) throw new Error('Extraction cancelled');
    
    // Initialize Tesseract worker for OCR
    console.log("Initializing OCR worker...");
    const worker = await createWorker('eng');
    
    // Create an image element for the first page
    const img = document.createElement('img');
    img.src = dataUrl;
    
    // Wait for the image to load
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load image'));
      // Set a timeout to avoid hanging
      setTimeout(() => reject(new Error('Image load timeout')), 10000);
    });
    
    if (isCancelled) {
      await worker.terminate();
      throw new Error('Extraction cancelled');
    }
    
    // Create a canvas to draw the image for OCR processing
    console.log("Processing PDF with OCR...");
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      await worker.terminate();
      throw new Error('Could not create canvas context');
    }
    
    // Draw image to canvas
    ctx.drawImage(img, 0, 0);
    
    // Perform OCR on the image
    const { data: { text } } = await worker.recognize(canvas);
    
    // Clean up worker
    await worker.terminate();
    
    // Check if OCR found any text
    if (!text.trim()) {
      throw new Error('No text could be extracted from the PDF.');
    }
    
    console.log("PDF extraction completed successfully with OCR");
    activeExtractions.delete(extractionId);
    return text.trim();
  } catch (error: unknown) {
    // Clean up extraction record
    activeExtractions.delete(extractionId);
    
    console.error("PDF extraction failed:", error);
    
    // Handle cancellation specifically
    if (isCancelled || (error instanceof Error && error.message === 'Extraction cancelled')) {
      throw new Error('PDF extraction was cancelled');
    }
    
    // Provide more detailed error information
    let errorMessage = 'Unknown error occurred';
    if (error instanceof Error) {
      errorMessage = error.message;
      console.log("Error details:", error.name, error.message, (error as any).details || '');
    }
    
    // Provide friendly error messages based on the error type
    if (errorMessage.includes('Failed to load image') || errorMessage.includes('Image load timeout')) {
      throw new Error('The file could not be processed. Please make sure it\'s a valid PDF.');
    } else if (errorMessage.includes('Failed to read file')) {
      throw new Error('Failed to read the uploaded file. Please try again with a different file.');
    } else if (errorMessage.includes('not well-formed') || errorMessage.includes('Invalid PDF')) {
      throw new Error('The file appears to be corrupted or is not a valid PDF. Please try another file.');
    } else if (
      errorMessage.includes('worker') || 
      errorMessage.includes('Worker') || 
      errorMessage.includes('timed out') ||
      errorMessage.includes('timeout')
    ) { 
      // Handle worker-related errors and timeouts
      console.error('PDF.js worker error detected:', errorMessage);
      throw new Error('PDF processing failed due to technical issues. Please try again or use a different file.');
    } else if (
      errorMessage.includes('fetch') || 
      errorMessage.includes('dynamically imported') ||
      errorMessage.includes('network') ||
      errorMessage.includes('CORS')
    ) {
      // Handle fetch and network-related failures
      console.error('Network-related PDF error detected:', errorMessage);
      throw new Error('PDF processing failed due to network issues. Please try again in a moment.');
    }
    
    throw new Error(`Failed to extract text from PDF: ${errorMessage}`);
  }
}