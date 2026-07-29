// DTO(Data Transfer Object) — 계층 간에 오가는 데이터의 형태를 정의한다.
// NestJS는 보통 class-validator/class-transformer로 검증하지만,
// 이 스테이지는 의존성을 최소화하기 위해 "수동 검증"으로 원리를 익힌다.

// Todo 도메인 엔티티. 저장소(repository)에 실제로 담기는 형태.
export interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

// 생성 요청 바디. id/completed는 서버가 정하므로 클라이언트는 title만 보낸다.
export class CreateTodoDto {
  title!: string;
}

// 수정 요청 바디. 둘 다 선택적(부분 수정 허용).
export class UpdateTodoDto {
  title?: string;
  completed?: boolean;
}

// CreateTodoDto 수동 검증. 유효하면 정규화된 값 { title }을 반환하고,
// 아니면 문자열 메시지 배열을 throw 한다(컨트롤러가 잡아 400으로 변환).
export function validateCreateTodoDto(body: unknown): { title: string } {
  // 힌트: body가 객체가 아니면 ['body must be an object'] 를 throw.
  // 힌트: b.title이 string이 아니면 'title must be a string',
  //       빈 문자열(trim 후 길이 0)이면 'title must not be empty' 를 errors 배열에 push.
  // 힌트: errors가 하나라도 있으면 throw errors; 아니면 { title: title.trim() } 반환.
  throw new Error('TODO: CreateTodoDto 수동 검증을 구현하라');
}
