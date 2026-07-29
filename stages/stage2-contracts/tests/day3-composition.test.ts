// Day 3 테스트
import {
  InMemoryLogger,
  NotificationService,
  Logger,
} from '@stage2/day3-composition';

describe('Day3: 상속 대신 조합(주입)', () => {
  test('InMemoryLogger는 로그를 쌓고 복사본을 돌려준다', () => {
    const logger = new InMemoryLogger();
    logger.log('a');
    logger.log('b');
    const msgs = logger.getMessages();
    expect(msgs).toEqual(['a', 'b']);
    // 반환값을 변형해도 내부 상태가 오염되지 않아야 한다 (복사본)
    msgs.push('c');
    expect(logger.getMessages()).toEqual(['a', 'b']);
  });

  test('NotificationService는 주입된 Logger로 성공 흐름을 기록한다', () => {
    const logger = new InMemoryLogger();
    const service = new NotificationService(logger);
    const ok = service.send({ to: 'user@test.com', body: '안녕' });
    expect(ok).toBe(true);
    expect(logger.getMessages()).toEqual([
      '알림 전송 시도: user@test.com',
      '전송 완료: user@test.com - 안녕',
    ]);
  });

  test('수신자가 없으면 실패로 기록하고 false를 반환한다', () => {
    const logger = new InMemoryLogger();
    const service = new NotificationService(logger);
    const ok = service.send({ to: '', body: 'x' });
    expect(ok).toBe(false);
    expect(logger.getMessages()).toEqual(['알림 전송 시도: ', '전송 실패: 수신자 없음']);
  });

  test('조합이라 가짜 Logger(스파이)를 꽂아도 그대로 동작한다 (교체 가능성)', () => {
    // NotificationService를 전혀 바꾸지 않고, 계약을 만족하는 다른 Logger를 주입한다
    const captured: string[] = [];
    const spyLogger: Logger = { log: (m) => captured.push(m.toUpperCase()) };
    const service = new NotificationService(spyLogger);
    service.send({ to: 'a', body: 'b' });
    expect(captured).toEqual(['알림 전송 시도: A', '전송 완료: A - B']);
  });
});
