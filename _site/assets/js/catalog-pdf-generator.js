/**
 * Catalog PDF Generator
 * Generates a comprehensive PDF catalog containing all products and packs
 */

class CatalogPDFGenerator {
  constructor() {
    this.products = [];
    this.packs = [];
    this.manifests = {};
    this.isGenerating = false;
  }

  /**
   * Initialize the PDF generator
   */
  async init() {
    try {
      await this.loadData();
      this.bindEvents();
    } catch (error) {
      console.error('Failed to initialize PDF generator:', error);
    }
  }

  /**
   * Load all necessary data
   */
  async loadData() {
    try {
      // Load products data
      const productsResponse = await fetch('/products.json');
      const productsData = await productsResponse.json();
      this.products = productsData.products || [];

      // Load packs data
      const packsResponse = await fetch('/data/packs.json');
      const packsData = await packsResponse.json();
      this.packs = packsData.packs || [];

      // Load manifests data
      const manifestsResponse = await fetch('/data/manifests.json');
      const manifestsData = await manifestsResponse.json();
      this.manifests = manifestsData.manifests || {};

      console.log('Data loaded:', {
        products: this.products.length,
        packs: this.packs.length,
        manifests: Object.keys(this.manifests).length
      });
    } catch (error) {
      console.error('Error loading data:', error);
      throw error;
    }
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Find the download catalog button
    const downloadBtn = document.querySelector('a[href="/api/catalogs/hero"]');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.generateCatalogPDF();
      });
    }
  }

  /**
   * Generate the complete catalog PDF
   */
  async generateCatalogPDF() {
    if (this.isGenerating) {
      console.log('PDF generation already in progress...');
      return;
    }

    this.isGenerating = true;
    
    try {
      // Show loading state
      this.showLoadingState();

      // Load jsPDF library if not already loaded
      await this.loadJsPDF();

      // Generate the PDF
      const pdf = this.createPDF();
      
      // Download the PDF
      pdf.save('KV_Garage_Complete_Catalog.pdf');
      
      console.log('PDF generated successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      this.showErrorState(error.message);
    } finally {
      this.isGenerating = false;
      this.hideLoadingState();
    }
  }

  /**
   * Load jsPDF library dynamically
   */
  async loadJsPDF() {
    if (window.jsPDF) {
      return;
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      script.onload = () => {
        console.log('jsPDF loaded successfully');
        resolve();
      };
      script.onerror = () => {
        reject(new Error('Failed to load jsPDF library'));
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Create the PDF document
   */
  createPDF() {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    let yPosition = 20;
    const pageHeight = 280;
    const margin = 20;
    const contentWidth = 170;

    // Helper function to add new page if needed
    const checkNewPage = (requiredSpace = 10) => {
      if (yPosition + requiredSpace > pageHeight) {
        pdf.addPage();
        yPosition = 20;
        return true;
      }
      return false;
    };

    // Helper function to add text with word wrapping
    const addWrappedText = (text, x, y, maxWidth, fontSize = 10) => {
      pdf.setFontSize(fontSize);
      const lines = pdf.splitTextToSize(text, maxWidth);
      pdf.text(lines, x, y);
      return y + (lines.length * fontSize * 0.4);
    };

    // Title Page
    pdf.setFontSize(24);
    pdf.setFont(undefined, 'bold');
    pdf.text('KV Garage', margin, yPosition);
    yPosition += 15;

    pdf.setFontSize(18);
    pdf.setFont(undefined, 'normal');
    pdf.text('Complete Product Catalog', margin, yPosition);
    yPosition += 20;

    pdf.setFontSize(12);
    pdf.text('Wholesale Tech Packs & Products for Resellers', margin, yPosition);
    yPosition += 10;
    
    const currentDate = new Date().toLocaleDateString();
    pdf.text(`Generated: ${currentDate}`, margin, yPosition);
    yPosition += 20;

    // Company Info
    pdf.setFontSize(10);
    pdf.text('Phone: (616) 228-2244', margin, yPosition);
    yPosition += 5;
    pdf.text('Email: support@kvgarage.com', margin, yPosition);
    yPosition += 5;
    pdf.text('Website: www.kvgarage.com', margin, yPosition);
    yPosition += 20;

    // Add new page for content
    pdf.addPage();
    yPosition = 20;

    // Wholesale Packs Section
    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    pdf.text('WHOLESALE PACKS', margin, yPosition);
    yPosition += 15;

    this.packs.forEach((pack, index) => {
      checkNewPage(30);

      // Pack header
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'bold');
      pdf.text(`${pack.name}`, margin, yPosition);
      yPosition += 8;

      // Pack details
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      
      const packDetails = [
        `Price: $${pack.price.toFixed(2)}`,
        `Deposit: $${pack.deposit_price.toFixed(2)}`,
        `Units: ${pack.units}`,
        `Resale Estimate: ${pack.resale_estimate}`,
        `Available: ${pack.available_quantity}`,
        `Status: ${pack.status.toUpperCase()}`
      ];

      packDetails.forEach(detail => {
        pdf.text(detail, margin + 5, yPosition);
        yPosition += 5;
      });

      // Pack description
      yPosition = addWrappedText(pack.description, margin + 5, yPosition, contentWidth - 5, 9);
      yPosition += 10;

      // Add manifest if available
      if (this.manifests[pack.id]) {
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'bold');
        pdf.text('Sample Items:', margin + 5, yPosition);
        yPosition += 8;

        const manifestItems = this.manifests[pack.id].slice(0, 5); // Show first 5 items
        manifestItems.forEach(item => {
          checkNewPage(8);
          pdf.setFontSize(9);
          pdf.setFont(undefined, 'normal');
          const itemText = `${item.item_name} (Qty: ${item.quantity}) - $${item.estimated_value.toFixed(2)}`;
          pdf.text(itemText, margin + 10, yPosition);
          yPosition += 5;
        });

        if (this.manifests[pack.id].length > 5) {
          pdf.text(`... and ${this.manifests[pack.id].length - 5} more items`, margin + 10, yPosition);
          yPosition += 5;
        }
        yPosition += 10;
      }

      yPosition += 5;
    });

    // Add new page for individual products
    pdf.addPage();
    yPosition = 20;

    // Individual Products Section
    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    pdf.text('INDIVIDUAL PRODUCTS', margin, yPosition);
    yPosition += 15;

    // Group products by category
    const productsByCategory = this.products.reduce((acc, product) => {
      const category = product.category || 'Other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(product);
      return acc;
    }, {});

    Object.keys(productsByCategory).forEach(category => {
      checkNewPage(20);

      // Category header
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'bold');
      pdf.text(category.toUpperCase(), margin, yPosition);
      yPosition += 10;

      // Products in category
      productsByCategory[category].forEach(product => {
        checkNewPage(15);

        pdf.setFontSize(10);
        pdf.setFont(undefined, 'bold');
        pdf.text(product.title, margin + 5, yPosition);
        yPosition += 6;

        pdf.setFontSize(9);
        pdf.setFont(undefined, 'normal');
        
        const productDetails = [
          `Price: $${product.price.toFixed(2)}`,
          `Status: ${product.status}`,
          `Description: ${product.description}`
        ];

        productDetails.forEach(detail => {
          yPosition = addWrappedText(detail, margin + 10, yPosition, contentWidth - 10, 9);
        });

        yPosition += 8;
      });

      yPosition += 5;
    });

    // Add contact information at the end
    pdf.addPage();
    yPosition = 20;

    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    pdf.text('CONTACT INFORMATION', margin, yPosition);
    yPosition += 20;

    const contactInfo = [
      'KV Garage',
      'Wholesale Tech Packs & Products',
      '',
      'Phone: (616) 228-2244',
      'Email: support@kvgarage.com',
      'Website: www.kvgarage.com',
      '',
      'Business Hours:',
      'Monday - Friday: 9:00 AM - 6:00 PM EST',
      '',
      'We specialize in:',
      '• Liquidation pallets',
      '• Mobile accessories',
      '• Tech products',
      '• Wholesale deals',
      '• Reseller support',
      '',
      'Join thousands of successful resellers who trust KV Garage for their wholesale needs.'
    ];

    contactInfo.forEach(line => {
      checkNewPage(8);
      pdf.setFontSize(10);
      pdf.setFont(undefined, line.startsWith('•') ? 'normal' : (line.includes(':') ? 'bold' : 'normal'));
      pdf.text(line, margin, yPosition);
      yPosition += 6;
    });

    return pdf;
  }

  /**
   * Show loading state
   */
  showLoadingState() {
    const downloadBtn = document.querySelector('a[href="/api/catalogs/hero"]');
    if (downloadBtn) {
      downloadBtn.style.opacity = '0.6';
      downloadBtn.style.pointerEvents = 'none';
      
      const originalText = downloadBtn.innerHTML;
      downloadBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px; animation: spin 1s linear infinite;">
          <path d="M21 12a9 9 0 11-6.219-8.56"></path>
        </svg>
        Generating PDF...
      `;
      
      // Add spin animation
      const style = document.createElement('style');
      style.textContent = `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
      
      // Store original text for restoration
      downloadBtn.dataset.originalText = originalText;
    }
  }

  /**
   * Hide loading state
   */
  hideLoadingState() {
    const downloadBtn = document.querySelector('a[href="/api/catalogs/hero"]');
    if (downloadBtn && downloadBtn.dataset.originalText) {
      downloadBtn.innerHTML = downloadBtn.dataset.originalText;
      downloadBtn.style.opacity = '1';
      downloadBtn.style.pointerEvents = 'auto';
      delete downloadBtn.dataset.originalText;
    }
  }

  /**
   * Show error state
   */
  showErrorState(message) {
    const downloadBtn = document.querySelector('a[href="/api/catalogs/hero"]');
    if (downloadBtn) {
      downloadBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
        Error - Try Again
      `;
      
      // Reset after 3 seconds
      setTimeout(() => {
        this.hideLoadingState();
      }, 3000);
    }
    
    // Show user-friendly error message
    alert('Failed to generate PDF catalog. Please try again or contact support if the issue persists.');
  }
}

// Initialize the PDF generator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const pdfGenerator = new CatalogPDFGenerator();
  pdfGenerator.init();
});
