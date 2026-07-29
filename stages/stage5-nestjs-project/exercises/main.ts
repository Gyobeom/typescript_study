// 부트스트랩 — NestJS 애플리케이션을 실제 HTTP 서버로 띄운다.
//
// reflect-metadata: 데코레이터 메타데이터를 읽기 위해 앱 진입점 최상단에서 import.
// NestFactory.create(AppModule): 모듈 그래프를 조립하고 DI 컨테이너를 구성한다.
// listen(3000): 3000 포트로 요청을 받는다.

import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  // 힌트: NestFactory.create(AppModule) 로 앱을 만들고, app.listen(3000) 으로 띄운다.
  //       부팅 성공 로그를 출력한다.
  throw new Error('TODO: NestFactory로 앱을 만들고 3000 포트로 listen 하라');
}

bootstrap();
