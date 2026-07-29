// Day 2 테스트
import {
  CsvReportGenerator,
  MarkdownReportGenerator,
  ReportGenerator,
  ReportRow,
} from '@stage2/day2-report-generator';

const rows: ReportRow[] = [
  { label: '1월', value: 100 },
  { label: '2월', value: 200 },
];

describe('Day2: 추상 클래스 템플릿 메서드', () => {
  test('CsvReportGenerator는 흐름은 부모에게 맡기고 CSV 세부만 채운다', () => {
    const csv = new CsvReportGenerator().generate('매출', rows);
    expect(csv).toBe(['title,매출', '1월,100', '2월,200', 'total,300'].join('\n'));
  });

  test('MarkdownReportGenerator는 같은 흐름, 다른 형식으로 출력한다', () => {
    const md = new MarkdownReportGenerator().generate('매출', rows);
    expect(md).toBe(
      [
        '# 매출',
        '| 항목 | 값 |',
        '| --- | --- |',
        '| 1월 | 100 |',
        '| 2월 | 200 |',
        '| 합계 | 300 |',
      ].join('\n'),
    );
  });

  test('빈 rows여도 헤더와 footer(합계 0)는 나온다', () => {
    const csv = new CsvReportGenerator().generate('빈리포트', []);
    expect(csv).toBe(['title,빈리포트', 'total,0'].join('\n'));
  });

  test('두 생성기는 같은 ReportGenerator 계약에 대입 가능하다 (LSP)', () => {
    const generators: ReportGenerator[] = [
      new CsvReportGenerator(),
      new MarkdownReportGenerator(),
    ];
    // 호출부는 어떤 생성기인지 몰라도 generate 하나로 동작한다
    for (const g of generators) {
      const out = g.generate('X', [{ label: 'a', value: 5 }]);
      expect(out).toContain('5');
    }
  });
});
