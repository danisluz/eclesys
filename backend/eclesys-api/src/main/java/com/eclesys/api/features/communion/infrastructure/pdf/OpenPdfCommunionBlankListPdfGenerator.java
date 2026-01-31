package com.eclesys.api.features.communion.infrastructure.pdf;

import com.eclesys.api.features.communion.application.CommunionBlankListPdfData;
import com.eclesys.api.features.communion.application.CommunionBlankListPdfData.CommunionMemberPdfRow;
import com.eclesys.api.features.communion.application.port.CommunionBlankListPdfGenerator;
import com.lowagie.text.Chunk;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.Image;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.BaseFont;
import com.lowagie.text.pdf.ColumnText;
import com.lowagie.text.pdf.PdfContentByte;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfPageEventHelper;
import com.lowagie.text.pdf.PdfTemplate;
import com.lowagie.text.pdf.PdfWriter;
import com.lowagie.text.pdf.draw.LineSeparator;
import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.text.Collator;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Component;

@Component
public class OpenPdfCommunionBlankListPdfGenerator implements CommunionBlankListPdfGenerator {

  private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

  // Margens exigidas (mm -> pt). A área útil horizontal fica em 180mm.
  private static final float MARGIN_TOP = mmToPoints(20);
  private static final float MARGIN_BOTTOM = mmToPoints(15);
  private static final float MARGIN_LEFT = mmToPoints(15);
  private static final float MARGIN_RIGHT = mmToPoints(15);

  // Larguras fixas das colunas (somatório = 180mm conforme requisito).
  // Matrícula (20) + Nome (85) + F (8) + P (8) + J (8) + Obs. (51) = 180mm.
  private static final float COL_MATRICULA = mmToPoints(20);
  private static final float COL_NOME = mmToPoints(85);
  private static final float COL_FALTA = mmToPoints(8);
  private static final float COL_PRESENTE = mmToPoints(8);
  private static final float COL_JUSTIFICADO = mmToPoints(8);
  private static final float COL_OBS = mmToPoints(51);
  private static final float TABLE_WIDTH =
      COL_MATRICULA + COL_NOME + COL_FALTA + COL_PRESENTE + COL_JUSTIFICADO + COL_OBS;

  // Espessuras de linhas (pt) conforme requisito.
  private static final float BORDER_OUTER = 0.6f;
  private static final float BORDER_VERTICAL = 0.3f;
  private static final float BORDER_HORIZONTAL = 0.25f;

  // Altura de linha (~6.5mm) para alta densidade.
  private static final float ROW_HEIGHT = mmToPoints(6.5f);

  @Override
  public byte[] generate(CommunionBlankListPdfData data) {
    try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
      Document document = new Document(PageSize.A4, MARGIN_LEFT, MARGIN_RIGHT, MARGIN_TOP, MARGIN_BOTTOM);
      PdfWriter writer = PdfWriter.getInstance(document, outputStream);
      writer.setPageEvent(new FooterEvent());

      document.open();
      addHeader(document, data);
      addMembersTable(document, data);
      document.close();

      return outputStream.toByteArray();
    } catch (Exception ex) {
      throw new IllegalStateException("Falha ao gerar PDF de lista em branco", ex);
    }
  }

  private void addHeader(Document document, CommunionBlankListPdfData data) throws Exception {
    // Fonte moderna: tenta Inter/Roboto/OpenSans via classpath, com fallback em Helvetica.
    BaseFont titleBase = loadBaseFont("Inter-Bold.ttf", "Roboto-Bold.ttf", "OpenSans-Bold.ttf");
    BaseFont bodyBase = loadBaseFont("Inter-Regular.ttf", "Roboto-Regular.ttf", "OpenSans-Regular.ttf");
    BaseFont metaBase = loadBaseFont("Inter-SemiBold.ttf", "Roboto-Medium.ttf", "OpenSans-SemiBold.ttf");

    Font titleFont = new Font(titleBase, 14f, Font.NORMAL);
    Font subtitleFont = new Font(bodyBase, 10.5f, Font.NORMAL);
    Font metaTitleFont = new Font(metaBase, 10.5f, Font.NORMAL);
    Font metaDateFont = new Font(bodyBase, 10.5f, Font.NORMAL);

    Image logo = loadLogo(data.churchLogo());
    boolean hasLogo = logo != null;

    PdfPTable header = new PdfPTable(hasLogo ? 3 : 2);
    header.setTotalWidth(TABLE_WIDTH);
    header.setLockedWidth(true);
    header.setHorizontalAlignment(Element.ALIGN_LEFT);
    if (hasLogo) {
      // Logo (25mm) + texto (95mm) + meta (60mm) = 180mm
      header.setWidths(new float[] {mmToPoints(25), mmToPoints(95), mmToPoints(60)});
    } else {
      // Texto (120mm) + meta (60mm) = 180mm
      header.setWidths(new float[] {mmToPoints(120), mmToPoints(60)});
    }
    header.getDefaultCell().setBorder(Rectangle.NO_BORDER);

    if (hasLogo) {
      PdfPCell logoCell = new PdfPCell();
      logoCell.setBorder(Rectangle.NO_BORDER);
      logoCell.setVerticalAlignment(Element.ALIGN_TOP);
      logoCell.setPaddingTop(-4f);
      logoCell.setPaddingBottom(2f);
      logo.scaleToFit(110, 55);
      logo.setAlignment(Image.LEFT);
      logoCell.addElement(logo);
      header.addCell(logoCell);
    }

    PdfPCell titleCell = new PdfPCell();
    titleCell.setBorder(Rectangle.NO_BORDER);
    titleCell.setPadding(0f);

    Paragraph churchName = new Paragraph(data.churchName(), titleFont);
    churchName.setLeading(0f, 1.1f);
    titleCell.addElement(churchName);

    String sectorLabel = defaultIfBlank(data.sectorLabel(), "Setor");
    String congregationLabel = defaultIfBlank(data.congregationLabel(), "Congregação");

    Paragraph sectorLine = new Paragraph(sectorLabel + ": " + data.sectorName(), subtitleFont);
    sectorLine.setLeading(0f, 1.1f);
    sectorLine.setSpacingBefore(2f);
    titleCell.addElement(sectorLine);

    Paragraph congregation = new Paragraph(congregationLabel + ": " + data.congregationName(), subtitleFont);
    congregation.setLeading(0f, 1.1f);
    congregation.setSpacingBefore(2f);
    titleCell.addElement(congregation);

    header.addCell(titleCell);

    PdfPCell metaCell = new PdfPCell();
    metaCell.setBorder(Rectangle.NO_BORDER);
    metaCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
    metaCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
    metaCell.setPadding(0f);

    Paragraph metaTitle = new Paragraph("Santa Ceia", metaTitleFont);
    metaTitle.setAlignment(Element.ALIGN_RIGHT);
    metaTitle.setLeading(0f, 1.1f);
    metaCell.addElement(metaTitle);

    Paragraph metaDate = new Paragraph(DATE_FORMAT.format(data.eventDate()), metaDateFont);
    metaDate.setAlignment(Element.ALIGN_RIGHT);
    metaDate.setLeading(0f, 1.1f);
    metaDate.setSpacingBefore(2f);
    metaCell.addElement(metaDate);

    header.addCell(metaCell);

    document.add(header);

    // Linha separadora fina (0.5pt) para marcar o início da tabela.
    LineSeparator separator = new LineSeparator();
    separator.setLineColor(new Color(210, 210, 210));
    separator.setLineWidth(0.4f);
    separator.setPercentage(100);
    separator.setOffset(6f);
    document.add(separator);
    document.add(Chunk.NEWLINE);
  }

  private void addMembersTable(Document document, CommunionBlankListPdfData data) throws DocumentException {
    BaseFont regular = loadBaseFont("Inter-Regular.ttf", "Roboto-Regular.ttf", "OpenSans-Regular.ttf");
    BaseFont bold = loadBaseFont("Inter-Bold.ttf", "Roboto-Bold.ttf", "OpenSans-Bold.ttf");

    Font headerFont = new Font(bold, 9.5f, Font.NORMAL);
    Font rowFont = new Font(regular, 9.5f, Font.NORMAL);

    PdfPTable table = new PdfPTable(6);
    table.setTotalWidth(TABLE_WIDTH);
    table.setLockedWidth(true);
    table.setWidths(new float[] {
        COL_MATRICULA,
        COL_NOME,
        COL_FALTA,
        COL_PRESENTE,
        COL_JUSTIFICADO,
        COL_OBS
    });
    table.setHorizontalAlignment(Element.ALIGN_LEFT);
    table.setHeaderRows(1);

    // Header com fundo cinza leve (≈5%) e fonte semibold (usamos bold como aproximação).
    table.addCell(headerCell("Matrícula", headerFont, 0, true));
    table.addCell(headerCell("Nome", headerFont, 1, true));
    table.addCell(headerCell("F", headerFont, 2, true));
    table.addCell(headerCell("P", headerFont, 3, true));
    table.addCell(headerCell("J", headerFont, 4, true));
    table.addCell(headerCell("Obs.", headerFont, 5, true));

    List<CommunionMemberPdfRow> members = new ArrayList<>(data.members());
    Collator collator = Collator.getInstance(new Locale("pt", "BR"));
    collator.setStrength(Collator.PRIMARY);
    members.sort((a, b) -> {
      int byName = collator.compare(a.fullName(), b.fullName());
      if (byName != 0) return byName;
      if (a.registrationNumber() == null) return 1;
      if (b.registrationNumber() == null) return -1;
      return a.registrationNumber().compareToIgnoreCase(b.registrationNumber());
    });
    int totalRows = members.size();

    for (int i = 0; i < totalRows; i++) {
      CommunionMemberPdfRow member = members.get(i);
      boolean lastRow = i == totalRows - 1;

      table.addCell(bodyCell(member.registrationNumber(), rowFont, 0, lastRow));
      table.addCell(bodyCell(member.fullName(), rowFont, 1, lastRow));
      table.addCell(bodyCell(" ", rowFont, 2, lastRow));
      table.addCell(bodyCell(" ", rowFont, 3, lastRow));
      table.addCell(bodyCell(" ", rowFont, 4, lastRow));
      table.addCell(bodyCell(" ", rowFont, 5, lastRow));
    }

    document.add(table);
  }

  private PdfPCell headerCell(String text, Font font, int columnIndex, boolean firstRow) {
    PdfPCell cell = baseCell(text, font, columnIndex, true, firstRow, false);
    cell.setBackgroundColor(new Color(245, 245, 245)); // ~4–6% de cinza
    cell.setFixedHeight(ROW_HEIGHT);
    cell.setHorizontalAlignment(Element.ALIGN_CENTER);
    if (columnIndex < 2 || columnIndex == 5) {
      cell.setHorizontalAlignment(Element.ALIGN_LEFT);
    }
    return cell;
  }

  private PdfPCell bodyCell(String text, Font font, int columnIndex, boolean lastRow) {
    PdfPCell cell = baseCell(text, font, columnIndex, false, false, lastRow);
    cell.setFixedHeight(ROW_HEIGHT);
    if (columnIndex < 2 || columnIndex == 5) {
      cell.setHorizontalAlignment(Element.ALIGN_LEFT);
    } else {
      cell.setHorizontalAlignment(Element.ALIGN_CENTER);
    }
    return cell;
  }

  private PdfPCell baseCell(
      String text,
      Font font,
      int columnIndex,
      boolean isHeader,
      boolean isFirstRow,
      boolean isLastRow
  ) {
    PdfPCell cell = new PdfPCell(new Paragraph(text, font));
    cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
    cell.setPaddingTop(1.5f);
    cell.setPaddingBottom(1.5f);
    cell.setPaddingLeft(3f);
    cell.setPaddingRight(3f);

    // Bordas: externa 0.6pt e internas verticais 0.3pt / horizontais 0.25pt.
    float left = columnIndex == 0 ? BORDER_OUTER : BORDER_VERTICAL;
    float right = columnIndex == 5 ? BORDER_OUTER : BORDER_VERTICAL;
    float top = isFirstRow ? BORDER_OUTER : BORDER_HORIZONTAL;
    float bottom = isLastRow ? BORDER_OUTER : BORDER_HORIZONTAL;

    cell.setBorderWidthLeft(left);
    cell.setBorderWidthRight(right);
    cell.setBorderWidthTop(top);
    cell.setBorderWidthBottom(bottom);
    cell.setBorderColor(new Color(210, 210, 210));

    if (isHeader) {
      // Header sempre com topo externo e linha inferior fina.
      cell.setBorderWidthTop(BORDER_OUTER);
      cell.setBorderWidthBottom(BORDER_HORIZONTAL);
    }

    return cell;
  }

  private Image loadLogo(byte[] logoBytes) {
    if (logoBytes == null || logoBytes.length == 0) {
      return null;
    }
    try {
      return Image.getInstance(logoBytes);
    } catch (Exception ex) {
      return null;
    }
  }

  private String defaultIfBlank(String value, String fallback) {
    if (value == null || value.isBlank()) {
      return fallback;
    }
    return value;
  }

  private BaseFont loadBaseFont(String... candidates) {
    for (String candidate : candidates) {
      BaseFont loaded = loadFontFromClasspath("fonts/" + candidate);
      if (loaded != null) return loaded;
    }
    try {
      return BaseFont.createFont(BaseFont.HELVETICA, BaseFont.WINANSI, BaseFont.NOT_EMBEDDED);
    } catch (Exception ex) {
      throw new IllegalStateException("Falha ao carregar fonte padrão", ex);
    }
  }

  private BaseFont loadFontFromClasspath(String path) {
    try (InputStream inputStream = getClass().getClassLoader().getResourceAsStream(path)) {
      if (inputStream == null) {
        return null;
      }
      byte[] bytes = inputStream.readAllBytes();
      return BaseFont.createFont(path, BaseFont.IDENTITY_H, BaseFont.EMBEDDED, true, bytes, null);
    } catch (Exception ex) {
      return null;
    }
  }

  private static float mmToPoints(float mm) {
    return (mm / 25.4f) * 72f;
  }

  private static class FooterEvent extends PdfPageEventHelper {
    private final Font footerFont;
    private PdfTemplate totalPagesTemplate;

    private FooterEvent() {
      BaseFont baseFont;
      try {
        baseFont = BaseFont.createFont(BaseFont.HELVETICA, BaseFont.WINANSI, BaseFont.NOT_EMBEDDED);
      } catch (Exception ex) {
        baseFont = null;
      }
      footerFont = baseFont != null ? new Font(baseFont, 8f) : new Font(Font.HELVETICA, 8f);
    }

    @Override
    public void onOpenDocument(PdfWriter writer, Document document) {
      totalPagesTemplate = writer.getDirectContent().createTemplate(20, 12);
    }

    @Override
    public void onEndPage(PdfWriter writer, Document document) {
      PdfContentByte canvas = writer.getDirectContent();
      String text = "Gerado pelo ECLESYS • " + DATE_FORMAT.format(LocalDate.now());
      float y = document.bottom() - 8f;
      String pageText = writer.getPageNumber() + "/";
      float pageTextWidth = footerFont.getBaseFont().getWidthPoint(pageText, footerFont.getSize());

      canvas.beginText();
      canvas.setFontAndSize(footerFont.getBaseFont(), footerFont.getSize());
      canvas.setTextMatrix(document.left(), y);
      canvas.showText(pageText);
      canvas.endText();
      canvas.addTemplate(totalPagesTemplate, document.left() + pageTextWidth, y);

      ColumnText.showTextAligned(canvas, Element.ALIGN_RIGHT, new Paragraph(text, footerFont), document.right(), y, 0);
    }

    @Override
    public void onCloseDocument(PdfWriter writer, Document document) {
      if (totalPagesTemplate == null || footerFont.getBaseFont() == null) {
        return;
      }
      totalPagesTemplate.beginText();
      totalPagesTemplate.setFontAndSize(footerFont.getBaseFont(), footerFont.getSize());
      totalPagesTemplate.setTextMatrix(0, 0);
      totalPagesTemplate.showText(String.valueOf(writer.getPageNumber() - 1));
      totalPagesTemplate.endText();
    }
  }
}
