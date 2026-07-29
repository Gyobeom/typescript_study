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
  // 생성자 주입: TodosService는 @Injectable이므로 토큰 없이 타입으로 주입된다.
  constructor(private readonly todosService: TodosService) {}

  @Get()
  findAll(): Todo[] {
    return this.todosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Todo {
    // ParseIntPipe: 경로 파라미터 문자열을 number로 변환/검증한다.
    return this.todosService.findOne(id);
  }

  @Post()
  @HttpCode(201)
  create(@Body() body: CreateTodoDto): Todo {
    // 수동 검증: 실패하면 메시지 배열이 throw 되므로 400으로 변환한다.
    let validated: { title: string };
    try {
      validated = validateCreateTodoDto(body);
    } catch (errors) {
      throw new BadRequestException(errors as string[]);
    }
    return this.todosService.create(validated.title);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateTodoDto,
  ): Todo {
    return this.todosService.update(id, {
      title: body.title,
      completed: body.completed,
    });
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number): void {
    this.todosService.remove(id);
  }
}
