import PDFDocument from "pdfkit";

interface ReportBug {
  severity: string;
  status: string;
}

interface ReportAssignment {
  roleOnProject: string | null;
  developer: { user: { name: string } };
}

interface ReportProject {
  id: string;
  name: string;
  status: string;
  priority: string;
  budget: number | null;
  startDate: Date;
  endDate: Date | null;
  description: string | null;
  client: { name: string };
  assignments: ReportAssignment[];
  bugs: ReportBug[];
}

export function generateProjectReportPdf(project: ReportProject): PDFKit.PDFDocument {
  const doc = new PDFDocument({ margin: 50 });

  doc.fontSize(20).text(project.name, { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(11).fillColor("#444");
  doc.text(`Client: ${project.client.name}`);
  doc.text(`Status: ${project.status}`);
  doc.text(`Priority: ${project.priority}`);
  doc.text(`Budget: ${project.budget != null ? `$${project.budget.toLocaleString()}` : "n/a"}`);
  doc.text(`Start date: ${project.startDate.toDateString()}`);
  doc.text(`End date: ${project.endDate ? project.endDate.toDateString() : "n/a"}`);
  if (project.description) {
    doc.moveDown(0.5);
    doc.fillColor("#000").text(project.description);
  }

  doc.moveDown();
  doc.fillColor("#000").fontSize(14).text("Assigned team");
  doc.fontSize(11).fillColor("#444");
  if (project.assignments.length === 0) {
    doc.text("No developers assigned.");
  } else {
    for (const assignment of project.assignments) {
      doc.text(`${assignment.developer.user.name} — ${assignment.roleOnProject ?? "contributor"}`);
    }
  }

  doc.moveDown();
  doc.fillColor("#000").fontSize(14).text("Bug summary");
  doc.fontSize(11).fillColor("#444");
  const severities = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
  const statuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "WONT_FIX"];
  for (const severity of severities) {
    const counts = statuses
      .map((status) => {
        const count = project.bugs.filter((b) => b.severity === severity && b.status === status).length;
        return `${status}: ${count}`;
      })
      .join("  ");
    doc.text(`${severity} — ${counts}`);
  }
  doc.text(`Total bugs: ${project.bugs.length}`);

  doc.moveDown();
  doc.fontSize(9).fillColor("#888").text(`Generated ${new Date().toISOString()}`);

  doc.end();
  return doc;
}
