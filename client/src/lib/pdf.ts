import * as pdfjs from "pdfjs-dist";

// Set up PDF.js worker with a static configuration
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;

export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    console.log("Starting PDF extraction for:", file.name);
    const arrayBuffer = await file.arrayBuffer();

    // Load the PDF document
    console.log("Loading PDF document...");
    const pdf = await pdfjs.getDocument({
      data: arrayBuffer,
      verbosity: 0,
      cMapUrl: `https://unpkg.com/pdfjs-dist@3.11.174/cmaps/`,
      cMapPacked: true,
    }).promise;

    console.log(`PDF loaded successfully. Total pages: ${pdf.numPages}`);

    let text = "";

    // Extract text from each page
    for (let i = 1; i <= pdf.numPages; i++) {
      console.log(`Processing page ${i} of ${pdf.numPages}`);
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => item.str)
        .join(" ");
      text += pageText + "\n";
    }

    console.log("PDF extraction completed successfully");
    return text.trim();
  } catch (error: unknown) {
    console.error("PDF extraction failed:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to extract text from PDF: ${errorMessage}`);
  }
}