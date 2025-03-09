import { createWorker } from "tesseract.js";

/**
 * Extract text from a PDF file using OCR
 * This implementation doesn't rely on PDF.js worker
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    console.log("Starting PDF extraction for:", file.name);
    
    // Create a FileReader to read the file
    const reader = new FileReader();
    
    // Convert the file to a data URL to display in an image
    const dataUrl = await new Promise<string>((resolve, reject) => {
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
    
    // Initialize Tesseract worker for OCR
    console.log("Initializing OCR worker...");
    const worker = await createWorker('eng');
    
    // Create an image element to hold the PDF first page
    const img = document.createElement('img');
    img.src = dataUrl;
    
    // Wait for the image to load
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load image'));
    });
    
    // Create a canvas to draw the image for OCR processing
    console.log("Processing PDF with OCR...");
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not create canvas context');
    
    // Draw image to canvas
    ctx.drawImage(img, 0, 0);
    
    // Perform OCR on the image
    const { data: { text } } = await worker.recognize(canvas);
    
    // Clean up worker
    await worker.terminate();
    
    // If no text was found, throw an error
    if (!text.trim()) {
      throw new Error('No text could be extracted from the PDF.');
    }
    
    console.log("PDF extraction completed successfully");
    return text.trim();
  } catch (error: unknown) {
    console.error("PDF extraction failed:", error);
    // Provide more detailed error information
    let errorMessage = 'Unknown error occurred';
    if (error instanceof Error) {
      errorMessage = error.message;
      console.log("Error details:", error.name, error.message, (error as any).details || '');
    }
    
    // Provide friendly error messages based on the error type
    if (errorMessage.includes('Failed to load image')) {
      throw new Error('The file could not be processed as an image. Please make sure it\'s a valid PDF.');
    } else if (errorMessage.includes('Failed to read file')) {
      throw new Error('Failed to read the uploaded file. Please try again with a different file.');
    }
    
    throw new Error(`Failed to extract text from PDF: ${errorMessage}`);
  }
}