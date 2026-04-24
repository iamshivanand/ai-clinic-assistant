const html_to_pdf = require('html-pdf-node');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

class PrescriptionService {
  async generatePrescriptionPDF(data) {
    try {
      const { doctorName, patientName, diagnosis, medicines, clinicName, clinicAddress } = data;

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
            .header { border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
            .clinic-name { font-size: 24px; font-bold: true; color: #3b82f6; }
            .doctor-info { margin-top: 10px; font-size: 14px; }
            .patient-section { margin-bottom: 30px; }
            .section-title { font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { text-align: left; padding: 12px; border-bottom: 1px solid #eee; }
            th { background-color: #f9fafb; color: #6b7280; font-size: 12px; text-transform: uppercase; }
            .footer { margin-top: 50px; font-size: 12px; color: #9ca3af; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="clinic-name">${clinicName}</div>
            <div class="doctor-info">
              <strong>${doctorName}</strong><br>
              ${clinicAddress}
            </div>
          </div>

          <div class="patient-section">
            <p><strong>Patient:</strong> ${patientName}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>

          <div class="section-title">DIAGNOSIS</div>
          <p>${diagnosis}</p>

          <div class="section-title">PRESCRIPTION (Rx)</div>
          <table>
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Dosage</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              ${medicines.map(m => `
                <tr>
                  <td>${m.name}</td>
                  <td>${m.dosage}</td>
                  <td>${m.duration}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            This is an electronically generated prescription.
          </div>
        </body>
        </html>
      `;

      const options = { format: 'A4' };
      const file = { content: html };

      const pdfBuffer = await html_to_pdf.generatePdf(file, options);
      
      // Save to a temporary file or upload to a bucket
      const fileName = `prescription_${Date.now()}.pdf`;
      const filePath = path.join(__dirname, '../public/prescriptions', fileName);
      
      // Ensure directory exists
      if (!fs.existsSync(path.dirname(filePath))) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
      }

      fs.writeFileSync(filePath, pdfBuffer);
      
      return fileName;
    } catch (error) {
      logger.error('Failed to generate PDF:', error);
      throw error;
    }
  }
}

module.exports = new PrescriptionService();
