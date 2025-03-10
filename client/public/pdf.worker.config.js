/**
 * Direct Configuration for PDF.js Worker
 * This file is served statically and helps ensure the worker is properly
 * loaded regardless of bundling issues in the main application.
 */

(function() {
  try {
    if (typeof window !== 'undefined' && window.pdfjsLib) {
      console.log('Setting up PDF.js worker configuration...');
      
      // Set worker source directly to CDN
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
        'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
      
      // Optional: Set font support options
      window.pdfjsLib.GlobalWorkerOptions.StandardFontDataUrl = 
        'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/standard_fonts/';
      
      console.log('PDF.js worker successfully configured via static config script');
    } else {
      console.warn('PDF.js not found - worker config not applied');
    }
  } catch (error) {
    console.error('Error configuring PDF.js worker:', error);
  }
})();