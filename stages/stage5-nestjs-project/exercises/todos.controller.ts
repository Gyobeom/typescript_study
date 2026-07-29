// Controller 계층 — HTTP 요청/응답을 담당한다.
//
// 라우팅 데코레이터(@Get/@Post/@Patch/@Delete)로 경로와 핸들러를 연결하고,
// @Param/@Body 로 요청 데이터를 꺼낸다. 실제 로직은 서비스에 위임한다.
// 컨트롤러는 "얇게(thin)" 유지하는 것이 레이어드 아키텍처의 핵심.

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  BadRequestException,
  HttpCode,
  ParseIntPipe,
} from '@nestjs/common';
import { Todo, CreateTodoDto, UpdateTodoDto, validateCreateTodoDto } from './dto';
import { TodosService } from './todos.service';

@Controller('todos')
export class TodosController {
  // 힌트: TodosService는 @Injectable이므로 토큰 없이 타입으로 주입된다.
  //       private readonly todosService: TodosService
  constructor(private readonly todosService: TodosService) {}

  @Get()
  findAll(): Todo[] {
    // 힌트: todosService.findAll()
    throw new Error('TODO: 전체 목록을 반환하라');
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Todo {
    // 힌트: ParseIntPipe가 id를 number로 변환해준다. todosService.findOne(id)
    throw new Error('TODO: 단건 조회를 구현하라');
  }

  @Post()
  @HttpCode(201)
  create(@Body() body: CreateTodoDto): Todo {
    // 힌트: validateCreateTodoDto(body) 를 try/catch로 감싸,
    //       throw된 메시지 배열을 BadRequestException으로 변환한 뒤
    //       todosService.create(validated.title) 를 호출한다.
    throw new Error('TODO: 검증 후 생성을 구현하라');
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateTodoDto,
  ): Todo {
    // 힌트: todosService.update(id, { title: body.title, completed: body.completed })
    throw new Error('TODO: 수정을 구현하라');
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number): void {
    // 힌트: todosService.remove(id)
    throw new Error('TODO: 삭제를 구현하라');
  }
}
