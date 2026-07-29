// Day 3 — 상속 vs 조합: has-a로 기능을 조립하기
//
// 흔한 실수: "로그를 남기고 싶으니 Logger를 상속하자". 이러면 NotificationService가
// Logger의 모든 것을 물려받아 강하게 묶이고(is-a), 로그 방식을 바꾸려면 부모를
// 갈아야 한다. 게다가 TS/JS는 다중 상속이 없어서 다른 기능도 상속으로 붙이려면 막힌다.
//
// 실무의 답: 조합(has-a). "NotificationService는 Logger를 가진다(주입받는다)".
// Logger를 계약(interface)으로 두고 생성자로 주입하면:
//   - 테스트에서 가짜 Logger(스파이)를 꽂아 검증할 수 있고,
//   - 콘솔/파일/원격 로거로 교체해도 NotificationService는 그대로다.
//
// 이게 stage4의 DI, NestJS의 constructor 주입으로 곧장 이어진다.

/** [계약] 로거 — 무엇을 로깅하는지가 아니라 "어떻게 부르는지"만 규정한다 */
export interface Logger {
  log(message: string): void;
}

/**
 * 조합용 구체 로거: 남긴 로그를 배열에 모아두는 인메모리 로거.
 * (콘솔 대신 이걸 쓰면 테스트에서 로그 내용을 그대로 검증할 수 있다)
 */
export class InMemoryLogger implements Logger {
  // 힌트: 남은 로그를 담을 private 배열 messages를 두어라.
  private messages: string[] = [];

  log(message: string): void {
    // 힌트: messages에 message를 push.
    throw new Error('TODO: InMemoryLogger.log 를 구현하라');
  }

  /** 지금까지 쌓인 로그를 (복사본으로) 반환 */
  getMessages(): string[] {
    // 힌트: 내부 배열을 그대로 넘기지 말고 [...messages]로 복사해 반환.
    throw new Error('TODO: InMemoryLogger.getMessages 를 구현하라');
  }
}

export interface Notification {
  to: string;
  body: string;
}

/**
 * 알림 서비스 — Logger를 "상속"하지 말고 "주입"받는다(조합).
 *
 * 생성자에서 Logger 계약을 받아 필드로 보관하고(has-a),
 * send가 호출될 때마다 그 logger로 기록을 남긴다.
 *
 * send(n) 동작:
 *   1) logger.log(`알림 전송 시도: ${n.to}`)
 *   2) n.to가 빈 문자열이면 logger.log('전송 실패: 수신자 없음') 후 false 반환
 *   3) 정상이면 logger.log(`전송 완료: ${n.to} - ${n.body}`) 후 true 반환
 */
export class NotificationService {
  // 힌트: 파라미터 프로퍼티 축약으로 Logger를 private readonly logger 로 주입받아라.
  //       (구체 클래스 InMemoryLogger가 아니라 Logger 인터페이스 타입으로 받는 게 핵심)
  constructor(private readonly logger: Logger) {}

  send(n: Notification): boolean {
    // 힌트: 위 주석의 1~3 순서대로 this.logger.log(...)를 호출하고 boolean을 반환하라.
    throw new Error('TODO: NotificationService.send 를 구현하라');
  }
}
