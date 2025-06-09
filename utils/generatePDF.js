const jsPDF = require('jspdf');
const html2canvas = require('html2canvas');

const generatePDF = async (user) => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const imgWidth = 210;
  const maxHeight = 297;

  // Page 1: Candidate Details
  const page1 = document.createElement('div');
  page1.style.width = '210mm';
  page1.style.padding = '10mm';
  page1.style.fontFamily = 'Times New Roman, Times, serif';
  page1.style.fontSize = '10pt';
  page1.innerHTML = `
    <div style="text-align: center; color: #254d79;">
      <h1 style="font-size: 12pt; font-weight: bold;">${user.union === 'Tirhut Union' ? 'Application Form for Recruitment to Various Posts' : 'Recruitment to Various Posts'}</h1>
      <p style="font-size: 10pt; font-weight: medium;">For</p>
      <p style="font-size: 12pt; font-weight: bold; text-transform: uppercase;">Various Vegetable Cooperative Societies</p>
      <p style="font-size: 8pt;">(Registered Under Bihar Cooperative Society Act 1935)</p>
      <p style="font-size: 10pt;">2nd Floor, Vikas Bhawan, New Secretariat, Patna-800015</p>
      ${user.union !== 'Tirhut Union' ? `
        <p style="font-size: 10pt;">By</p>
        <p style="font-size: 12pt; font-weight: bold; text-transform: uppercase;">Isha Protectional Security Guard Pvt Ltd</p>
      ` : ''}
      <div style="display: flex; justify-content: center; gap: 20px;">
        <span><strong>Website:</strong> ${user.union === 'Tirhut Union' ? 'https://www.sivagroups.com' : 'https://www.ishaprotectional.com'}</span>
        <span><strong>Email:</strong> ${user.union === 'Tirhut Union' ? 'info@sivagroups.com' : 'ipsguard@yahoo.com'}</span>
      </div>
    </div>
    <div style="background-color: #f0f0f0; padding: 10px; border-bottom: 1px solid #000; margin-bottom: 10px;">
      <div style="display: flex; justify-content: space-between;">
        <div>
          <p>CBT Roll No.: ${user.applicationNumber}</p>
          <p>Admit Card for: ${user.union}</p>
        </div>
        <div>
          <p>Aadhaar No.: ${user.aadhaarNumber}</p>
        </div>
      </div>
    </div>
    <div style="text-align: center; margin-bottom: 10px;">
      <h2 style="font-size: 12pt; font-weight: bold;">Admit Card for Computer Based Test (CBT): June 2025</h2>
    </div>
    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 10px;">
      <div>
        <p><strong>Centre of CBT Exam:</strong> ${user.examCenter}</p>
        <p><strong>Shift & Date of CBT Exam:</strong> ${user.examShift}</p>
        <p><strong>Time of Gate-Entry:</strong> 30 minutes before shift start time</p>
        <p><strong>Candidate's Name:</strong> ${user.name}</p>
        <p><strong>Date of Birth:</strong> ${new Date(user.dob).toLocaleDateString('en-GB')}</p>
        <p><strong>Gender:</strong> ${user.gender.toUpperCase()}</p>
        <p><strong>Father's/Husband's Name:</strong> ${user.fatherName}</p>
        <p><strong>Mother's Name:</strong> ${user.motherName}</p>
        <p><strong>Posts Applied For:</strong></p>
        <ul style="list-style-type: disc; padding-left: 20px;">
          ${user.selectedPosts.map(post => `<li>${post}</li>`).join('')}
        </ul>
        <p><strong>District Preferences:</strong> ${user.districtPreferences.join(', ')}</p>
      </div>
      <div style="text-align: center;">
        <img src="${user.photo}" style="width: 80mm; height: 100mm; object-fit: contain; border: 1px solid #000; margin-bottom: 5px;" />
        <img src="${user.signature}" style="width: 80mm; height: 20mm; object-fit: contain; border: 1px solid #000;" />
        <p style="font-size: 8pt;">Signature of the Candidate</p>
      </div>
    </div>
    <div style="display: flex; justify-content: space-between; margin-top: 10px;">
      <div>
        <div style="width: 100mm; height: 20mm; border-bottom: 1px solid #000;">
          <img src="${user.signature}" style="width: 100%; height: 100%; object-fit: contain;" />
        </div>
        <p style="font-size: 10pt;">Signature of the Candidate</p>
      </div>
      <div>
        <div style="width: 100mm; height: 20mm; border-bottom: 1px solid #000;"></div>
        <p style="font-size: 10pt;">(To be signed in presence of the Invigilator)</p>
      </div>
    </div>
  `;
  document.body.appendChild(page1);
  const canvas1 = await html2canvas(page1, { scale: 2, useCORS: true });
  document.body.removeChild(page1);
  const imgData1 = canvas1.toDataURL('image/png');
  const imgHeight1 = (canvas1.height * imgWidth) / canvas1.width;
  pdf.addImage(imgData1, 'PNG', 0, 0, imgWidth, Math.min(imgHeight1, maxHeight));

  // Page 2: Instructions
  pdf.addPage();
  const page2 = document.createElement('div');
  page2.style.width = '210mm';
  page2.style.padding = '10mm';
  page2.style.fontFamily = 'Times New Roman, Times, serif';
  page2.style.fontSize = '10pt';
  page2.innerHTML = `
    <div style="text-align: center; margin-bottom: 10px;">
      <h2 style="font-size: 12pt; font-weight: bold;">Admit Card for Computer Based Test (CBT): June 2025</h2>
    </div>
    <h3 style="font-size: 12pt; font-weight: bold; text-transform: uppercase; margin-bottom: 10px;">Important Instructions for Candidates</h3>
    <ol style="list-style-type: decimal; padding-left: 20px;">
      <li>
        Please check on the website <a href="http://www.naukriworld.co.in">www.naukriworld.co.in</a> for updates related to the exact exam date and exam center name by Wednesday 12th June 2025, 11PM on Notice page.
      </li>
      <li>
        Candidates should bring the following documents, in addition to their Admit Card:
        <ul style="list-style-type: lower-alpha; padding-left: 20px;">
          <li>Two copies of their latest colored photo (3 cm x 3.5 cm)</li>
          <li>At least one photo identity proof in ORIGINAL with clear photograph (e.g. AADHAR Card, Driving License, University/College ID, Voter ID Card, PAN Card, etc)</li>
          <li>Photocopy of identity proof mentioned at (b) above.</li>
        </ul>
        If a candidate fails to bring the above documents, he/she would not be admitted in the examination venue and his/her candidature could be cancelled.
      </li>
      <li>The Admit Card is provisional, subject to verification of particulars during document verification.</li>
      <li>Candidates are advised to reach the CBT 2025 exam center at least 1 hour before the exam starts, to avoid any unexpected delays.</li>
      <li>Candidates should report directly to the examination hall/room, as per details mentioned on the Admit Card.</li>
      <li>
        The entry of the Candidates inside the venue will ONLY be allowed:
        <ul style="list-style-type: lower-roman; padding-left: 20px;">
          <li>Between 8.00 AM - 8.30 AM for the first session,</li>
          <li>Between 11.00 AM - 11.30 AM for the second session, and</li>
          <li>Between 2.00 PM - 2.30 PM for the third session.</li>
        </ul>
        Note: Candidates reaching the venue after entry closing time shall not be allowed to enter the examination venue.
      </li>
      <li>No candidate will be allowed to carry any electronic devices including mobile phones, Bluetooth devices, portable music players, calculators etc. inside the examination hall.</li>
      <li>Candidates are not allowed to carry any personal belongings or prohibited items inside the examination hall. We will not be responsible for safe keeping of candidate's personal belongings.</li>
      <li>
        For any query or clarification please email at <a href="mailto:writetogsgspl@gmail.com">writetogsgspl@gmail.com</a> or Call/WhatsApp at 01169270767.
      </li>
    </ol>
  `;
  document.body.appendChild(page2);
  const canvas2 = await html2canvas(page2, { scale: 2, useCORS: true });
  document.body.removeChild(page2);
  const imgData2 = canvas2.toDataURL('image/png');
  const imgHeight2 = (canvas2.height * imgWidth) / canvas2.width;
  pdf.addImage(imgData2, 'PNG', 0, 0, imgWidth, Math.min(imgHeight2, maxHeight));

  return pdf.output('arraybuffer');
};

module.exports = { generatePDF };