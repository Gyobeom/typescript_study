// Day 3 — 모범 답안: 상속 대신 조합(주입)

export interface Logger {
  log(message: string): void;
}

export class InMemoryLogger implements Logger {
  private messages: string[] = [];

  log(message: string): void {
    this.messages.push(message);
  }

  getMessages(): string[] {
    return [...this.messages];
  }
}

export interface Notification {
  to: string;
  body: string;
}

export class NotificationService {
  constructor(private readonly logger: Logger) {}

  send(n: Notification): boolean {
    this.logger.log(`알림 전송 시도: ${n.to}`);
    if (n.to === '') {
      this.logger.log('전송 실패: 수신자 없음');
      return false;
    }
    this.logger.log(`전송 완료: ${n.to} - ${n.body}`);
    return true;
  }
}
