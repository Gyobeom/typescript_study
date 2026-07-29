// Day 2 — 추상 클래스 = 계약 + 부분 구현 (템플릿 메서드 패턴)
//
// interface는 "무엇을" 지켜야 하는지만 말하고 구현은 하나도 못 담는다.
// 추상 클래스는 "공통 흐름(부분 구현)"은 자기가 갖고, "달라지는 세부"만 하위 클래스에
// 위임할 수 있다. 이게 바로 "계약 + 부분 구현"이다.
//
// 아래 ReportGenerator는 리포트를 만드는 전체 흐름(generate)을 이미 갖고 있다.
// 이 흐름은 하위 클래스가 건드리지 못한다(= 템플릿). 대신 형식마다 달라지는
// header/row/footer 세 조각만 abstract로 비워두어 하위 클래스가 채우게 한다.

export interface ReportRow {
  label: string;
  value: number;
}

/**
 * [계약 + 부분 구현] 추상 리포트 생성기.
 * generate()가 "템플릿 메서드"다 — 흐름은 고정, 세부는 하위 클래스가 채운다.
 * 이 추상 클래스 자체는 제공된다. 여러분은 이걸 상속한 두 하위 클래스를 완성한다.
 */
export abstract class ReportGenerator {
  /** 템플릿 메서드: 전체 흐름은 여기서 고정된다 (오버라이드하지 말 것) */
  generate(title: string, rows: ReportRow[]): string {
    const parts: string[] = [];
    parts.push(this.formatHeader(title));
    for (const row of rows) {
      parts.push(this.formatRow(row));
    }
    parts.push(this.formatFooter(rows));
    return parts.join('\n');
  }

  /** 합계는 모든 형식이 공통으로 쓰므로 부모가 제공한다 (부분 구현) */
  protected total(rows: ReportRow[]): number {
    return rows.reduce((sum, r) => sum + r.value, 0);
  }

  // 아래 셋은 형식마다 다르므로 계약(abstract)으로만 두고 하위 클래스에 위임한다.
  protected abstract formatHeader(title: string): string;
  protected abstract formatRow(row: ReportRow): string;
  protected abstract formatFooter(rows: ReportRow[]): string;
}

/**
 * CSV 형식 리포트.
 * header: `title,{title}` (한 줄로 제목 표시)
 *   그리고 그 다음 헤더 행은 만들지 않는다 — 아래 예시 참고.
 * row:    `{label},{value}`
 * footer: `total,{합계}`
 *
 * 예) title='매출', rows=[{label:'1월',value:100},{label:'2월',value:200}]
 * 결과:
 *   title,매출
 *   1월,100
 *   2월,200
 *   total,300
 */
export class CsvReportGenerator extends ReportGenerator {
  protected formatHeader(title: string): string {
    // 힌트: `title,${title}` 반환.
    throw new Error('TODO: CsvReportGenerator.formatHeader 를 구현하라');
  }

  protected formatRow(row: ReportRow): string {
    // 힌트: `${row.label},${row.value}` 반환.
    throw new Error('TODO: CsvReportGenerator.formatRow 를 구현하라');
  }

  protected formatFooter(rows: ReportRow[]): string {
    // 힌트: 부모의 this.total(rows)로 합계를 구해 `total,${합계}` 반환.
    throw new Error('TODO: CsvReportGenerator.formatFooter 를 구현하라');
  }
}

/**
 * Markdown 형식 리포트.
 * header: `# {title}` 한 줄, 그 다음 표 헤더 두 줄 `| 항목 | 값 |` 와 `| --- | --- |`.
 *   즉 formatHeader는 세 줄을 개행(\n)으로 이어 반환한다.
 * row:    `| {label} | {value} |`
 * footer: `| 합계 | {합계} |`
 *
 * 예) title='매출', rows=[{label:'1월',value:100}]
 * 결과:
 *   # 매출
 *   | 항목 | 값 |
 *   | --- | --- |
 *   | 1월 | 100 |
 *   | 합계 | 100 |
 */
export class MarkdownReportGenerator extends ReportGenerator {
  protected formatHeader(title: string): string {
    // 힌트: `# ${title}\n| 항목 | 값 |\n| --- | --- |` 반환.
    throw new Error('TODO: MarkdownReportGenerator.formatHeader 를 구현하라');
  }

  protected formatRow(row: ReportRow): string {
    // 힌트: `| ${row.label} | ${row.value} |` 반환.
    throw new Error('TODO: MarkdownReportGenerator.formatRow 를 구현하라');
  }

  protected formatFooter(rows: ReportRow[]): string {
    // 힌트: `| 합계 | ${this.total(rows)} |` 반환.
    throw new Error('TODO: MarkdownReportGenerator.formatFooter 를 구현하라');
  }
}
