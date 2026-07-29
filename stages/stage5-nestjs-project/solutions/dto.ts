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

// CreateTodoDto 수동 검증. 유효하면 정규화된 값을 반환하고, 아니면 메시지 배열을 던진다.
// (컨트롤러에서 잡아 BadRequestException으로 변환한다.)
export function validateCreateTodoDto(body: unknown): { title: string } {
  const errors: string[] = [];
  const b = body as Record<string, unknown> | null | undefined;

  if (!b || typeof b !== 'object') {
    throw ['body must be an object'];
  }

  const title = b.title;
  if (typeof title !== 'string') {
    errors.push('title must be a string');
  } else if (title.trim().length === 0) {
    errors.push('title must not be empty');
  }

  if (errors.length > 0) {
    throw errors;
  }

  return { title: (title as string).trim() };
}
