const startDateField = document.getElementById("startDate");
const endDateField = document.getElementById("endDate");
const submitButton = document.getElementById("reportButton");
const errorMsg = document.getElementById("reportErrorMsg");

function validateForm() {
  errorMsg.innerHTML = "";

  const startValue = startDateField.value;
  const endValue = endDateField.value;

  if (!startValue || !endValue) {
    submitButton.disabled = true;
    return;
  }

  const startDate = new Date(startValue);
  const endDate = new Date(endValue);

  if (startDate > endDate) {
    submitButton.disabled = true;
    const errorText = "Das Startdatum muss vor dem Enddatum liegen.";
    errorMsg.innerHTML =
      '<div class="alert alert-danger" role="alert">' + errorText + "</div>";
  } else {
    submitButton.disabled = false;
  }
}

startDateField.addEventListener("change", validateForm);
endDateField.addEventListener("change", validateForm);

document.getElementById("reportForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const startValue = startDateField.value;
  const endValue = endDateField.value;

  const reportResponse = await generateReport(startValue, endValue);
  if (!reportResponse) return;

  const data = await reportResponse.json();
  generatePDFFromJSON(data);
});

async function generateAndDownloadReport(startDate, endDate) {
  try {
    const response = await generateReport(startDate, endDate);
    if (!response) return;

    const data = await response.json();
    generatePDFFromJSON(data);
  } catch (error) {
    console.error("Error generating report PDF:", error);
  }
}
function generatePDFFromJSON(data) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  if (!data || data.length === 0) {
    alert("Keine Daten vorhanden, um ein PDF zu generieren.");
    return;
  }

  const groups = data.reduce((acc, row) => {
    const vehicleKey = row.licensePlate || "Kennzeichen unbekannt";
    if (!acc[vehicleKey]) {
      acc[vehicleKey] = [];
    }
    if (!row.id && row._id) {
      row.id = row._id.toString();
    }
    acc[vehicleKey].push(row);
    return acc;
  }, {});

  const columns = [
    { header: "ID", dataKey: "id" },
    { header: "Datum", dataKey: "date" },
    { header: "Anfangs-\nkilometerstand", dataKey: "startMileage" },
    { header: "End-\nkilometerstand", dataKey: "endMileage" },
    { header: "Km", dataKey: "kilometers" },
    { header: "Start- und Zieladresse", dataKey: "address" },
    { header: "Geschäfts-\npartner/Firma", dataKey: "businessPartner" },
    { header: "Kategorie", dataKey: "category" },
    { header: "Anlass", dataKey: "purpose" },
    { header: "Bemerkung", dataKey: "notes" },
  ];

  const today = new Date().toLocaleDateString("de-DE");

  const overallTotals = { all: 0, privat: 0, arbeitsweg: 0, dienstlich: 0 };

  const vehicleKeys = Object.keys(groups);
  vehicleKeys.forEach((vehicleKey, index) => {
    if (index > 0) {
      doc.addPage();
    }
    let startY = 15;

    const groupData = groups[vehicleKey].map((row) => {
      const address = [row.startLocation, row.endLocation]
        .filter(Boolean)
        .join("\n");

      const categoryMap = {
        private: "privat",
        commute: "arbeitsweg",
        business: "dienstlich",
      };

      const businessPartner = [row.clientCompany, row.client]
        .filter(Boolean)
        .join("\n");

      const tripNotes = Array.isArray(row.tripNotes)
        ? row.tripNotes.filter(Boolean).join("\n")
        : row.tripNotes || "";
      const detourNotes = Array.isArray(row.detourNote)
        ? row.detourNote.filter(Boolean).join("\n")
        : row.detourNote || "";
      const notesCombined = [tripNotes, detourNotes].filter(Boolean).join("\n");

      return {
        id: row.id || "",
        date: row.Date || "",
        startMileage: row.startMileage ?? "",
        endMileage: row.endMileage ?? "",
        kilometers: row.kilometers ?? 0,
        address: address,
        businessPartner: businessPartner,
        category: categoryMap[row.tripCategory] || row.tripCategory,
        purpose: row.tripPurpose || "",
        notes: notesCombined,
        markAsDeleted: row.markAsDeleted, // für das Durchstreichen
      };
    });

    const dateObjects = groupData
      .filter((row) => row.date)
      .map((row) => {
        const parts = row.date.split(".");
        if (parts.length === 3) {
          const [d, m, y] = parts;
          return new Date(+y, m - 1, +d);
        }
        return null;
      })
      .filter((d) => d !== null);
    let firstDateString = "";
    let lastDateString = "";
    if (dateObjects.length > 0) {
      const firstDateObj = new Date(Math.min(...dateObjects));
      const lastDateObj = new Date(Math.max(...dateObjects));
      firstDateString = firstDateObj.toLocaleDateString("de-DE");
      lastDateString = lastDateObj.toLocaleDateString("de-DE");
    }

    doc.setFontSize(12);
    const headerLines = [
      `Novacorp - Fahrtenbuch vom ${today}`,
      `Fahrzeug: ${vehicleKey}`,
      `Fahrten vom ${firstDateString} bis zum ${lastDateString}`,
    ];
    headerLines.forEach((line, i) => {
      doc.text(line, 14, startY + i * 7);
    });
    startY += headerLines.length * 7 + 5;

    doc.autoTable({
      startY: startY,
      columns: columns,
      body: groupData,
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 2,
        halign: "center",
        valign: "middle",
      },
      headerStyles: {
        fillColor: [22, 160, 133],
        textColor: 255,
        fontStyle: "bold",
      },
      columnStyles: {
        id: { halign: "center" },
        date: { halign: "center" },
        startMileage: { cellWidth: 20, halign: "center" },
        endMileage: { cellWidth: 20, halign: "center" },
        kilometers: { halign: "center" },
        address: { halign: "center", cellWidth: 50 },
        businessPartner: { halign: "center" },
        category: { halign: "center" },
        purpose: { halign: "center" },
        notes: { halign: "left" },
      },
      didParseCell: (data) => {
        if (data.section === "head") {
          data.cell.styles.valign = "top";
          data.cell.styles.overflow = "linebreak";
        }
        if (data.column.dataKey === "kilometers" && data.cell.raw) {
          data.cell.raw = Number(data.cell.raw).toLocaleString("de-DE");
        }
      },
      didDrawCell: (data) => {
        if (data.section === "body" && data.row.raw.markAsDeleted === true) {
          const strikeColumns = [
            "date",
            "startMileage",
            "endMileage",
            "kilometers",
            "address",
            "businessPartner",
            "category",
            "purpose",
          ];
          if (strikeColumns.includes(data.column.dataKey)) {
            const cell = data.cell;
            const centerY = cell.y + cell.height / 2;
            doc.setDrawColor(0);
            doc.setLineWidth(0.5);
            doc.line(cell.x, centerY, cell.x + cell.width, centerY);
          }
        }
      },
      tableWidth: "auto",
    });

    let vehicleTotals = { all: 0, privat: 0, arbeitsweg: 0, dienstlich: 0 };
    groupData.forEach((row) => {
      if (row.markAsDeleted === true) return;
      const km = Number(row.kilometers) || 0;
      vehicleTotals.all += km;
      if (row.category === "privat") {
        vehicleTotals.privat += km;
      } else if (row.category === "arbeitsweg") {
        vehicleTotals.arbeitsweg += km;
      } else if (row.category === "dienstlich") {
        vehicleTotals.dienstlich += km;
      }
    });

    overallTotals.all += vehicleTotals.all;
    overallTotals.privat += vehicleTotals.privat;
    overallTotals.arbeitsweg += vehicleTotals.arbeitsweg;
    overallTotals.dienstlich += vehicleTotals.dienstlich;

    let totalsY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.text(
      `Fahrzeug Gesamtkilometer: ${vehicleTotals.all.toLocaleString(
        "de-DE"
      )} km`,
      14,
      totalsY
    );
    totalsY += 7;
    doc.text(
      `Davon: privat: ${vehicleTotals.privat.toLocaleString(
        "de-DE"
      )} km, Arbeitsweg: ${vehicleTotals.arbeitsweg.toLocaleString(
        "de-DE"
      )} km, Dienstlich: ${vehicleTotals.dienstlich.toLocaleString(
        "de-DE"
      )} km`,
      14,
      totalsY
    );
  });

  doc.addPage();
  doc.setFontSize(12);
  doc.text("Gesamte Fahrten aller Fahrzeuge", 14, 15);
  doc.setFontSize(10);
  doc.text(
    `Gesamtkilometer: ${overallTotals.all.toLocaleString("de-DE")} km`,
    14,
    25
  );
  doc.text(
    `Davon: privat: ${overallTotals.privat.toLocaleString(
      "de-DE"
    )} km, Arbeitsweg: ${overallTotals.arbeitsweg.toLocaleString(
      "de-DE"
    )} km, Dienstlich: ${overallTotals.dienstlich.toLocaleString("de-DE")} km`,
    14,
    35
  );

  const now = new Date();
  const day = now.getDate().toString().padStart(2, "0");
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const year = now.getFullYear();
  const fileName = `Fahrtenbericht_${day}_${month}_${year}.pdf`;
  doc.save(fileName);
}
