// 단위 테스트 — DTO 수동 검증
import 'reflect-metadata';
import { validateCreateTodoDto } from '@stage5/dto';

describe('Day 3 — validateCreateTodoDto', () => {
  it('유효한 title 은 trim 되어 통과한다', () => {
    expect(validateCreateTodoDto({ title: '  hello  ' })).toEqual({
      title: 'hello',
    });
  });

  it('title 이 없거나 문자열이 아니면 throw', () => {
    expect(() => validateCreateTodoDto({})).toThrow();
    expect(() => validateCreateTodoDto({ title: 123 })).toThrow();
  });

  it('빈 title 은 throw', () => {
    expect(() => validateCreateTodoDto({ title: '   ' })).toThrow();
  });

  it('body 가 객체가 아니면 throw', () => {
    expect(() => validateCreateTodoDto(null)).toThrow();
    expect(() => validateCreateTodoDto('nope')).toThrow();
  });
});
