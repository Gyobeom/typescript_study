// Module — NestJS 애플리케이션의 조립 단위.
//
// @Module 메타데이터로 "이 모듈이 무엇을 갖는가"를 선언한다:
//   - controllers: 라우팅을 담당할 컨트롤러들
//   - providers:   DI 컨테이너에 등록할(주입 가능한) 서비스/저장소들
//
// 커스텀 프로바이더: 인터페이스(TodoRepository)는 런타임 타입이 없으므로
// { provide: 토큰, useClass: 구현체 } 형태로 "토큰 → 구현" 바인딩을 등록한다.
// 이렇게 하면 서비스가 @Inject(TODO_REPOSITORY)로 구현을 받아온다.

import { Module } from '@nestjs/common';
import { TodosController } from './todos.controller';
import { TodosService } from './todos.service';
import {
  TODO_REPOSITORY,
  InMemoryTodoRepository,
} from './todos.repository';

@Module({
  controllers: [TodosController],
  providers: [
    TodosService,
    // 인젝션 토큰 → 인메모리 구현 바인딩(useClass)
    { provide: TODO_REPOSITORY, useClass: InMemoryTodoRepository },
  ],
})
export class AppModule {}
