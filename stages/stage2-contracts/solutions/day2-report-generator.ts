// Day 2 — 모범 답안: 추상 클래스 템플릿 메서드

export interface ReportRow {
  label: string;
  value: number;
}

export abstract class ReportGenerator {
  generate(title: string, rows: ReportRow[]): string {
    const parts: string[] = [];
    parts.push(this.formatHeader(title));
    for (const row of rows) {
      parts.push(this.formatRow(row));
    }
    parts.push(this.formatFooter(rows));
    return parts.join('\n');
  }

  protected total(rows: ReportRow[]): number {
    return rows.reduce((sum, r) => sum + r.value, 0);
  }

  protected abstract formatHeader(title: string): string;
  protected abstract formatRow(row: ReportRow): string;
  protected abstract formatFooter(rows: ReportRow[]): string;
}

export class CsvReportGenerator extends ReportGenerator {
  protected formatHeader(title: string): string {
    return `title,${title}`;
  }

  protected formatRow(row: ReportRow): string {
    return `${row.label},${row.value}`;
  }

  protected formatFooter(rows: ReportRow[]): string {
    return `total,${this.total(rows)}`;
  }
}

export class MarkdownReportGenerator extends ReportGenerator {
  protected formatHeader(title: string): string {
    return `# ${title}\n| 항목 | 값 |\n| --- | --- |`;
  }

  protected formatRow(row: ReportRow): string {
    return `| ${row.label} | ${row.value} |`;
  }

  protected formatFooter(rows: ReportRow[]): string {
    return `| 합계 | ${this.total(rows)} |`;
  }
}
