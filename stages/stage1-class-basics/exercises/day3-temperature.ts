// Day 3 — 파라미터 프로퍼티 축약, getter/setter
//
// 온도(Temperature)를 표현하는 클래스를 구현하라.
// 내부 저장은 섭씨(celsius) 기준. 화씨는 getter/setter 로 변환해 노출한다.
//
// 두 가지를 연습한다:
//   1) constructor(private ...) 파라미터 프로퍼티 축약
//   2) get/set 접근자

export class Temperature {
  // 힌트: 파라미터 프로퍼티 축약을 쓴다.
  //       constructor(private celsius: number) 처럼 접근제어자를 파라미터 앞에 붙이면
  //       필드 선언 + this 할당이 자동으로 이루어진다.
  //       단, 생성 시 절대영도(-273.15℃) 미만이면 Error 를 던져야 하므로 본문에 검증이 필요하다.
  constructor(private celsius: number) {
    // 힌트: this.celsius < -273.15 이면 throw. (파라미터 프로퍼티라 이미 할당은 되어 있다)
    throw new Error('TODO: 절대영도 미만 온도를 거부하라');
  }

  // 섭씨 값을 읽는다.
  get c(): number {
    // 힌트: this.celsius 반환
    throw new Error('TODO: 섭씨 getter');
  }

  // 섭씨 값을 쓴다. 절대영도 미만이면 Error.
  set c(value: number) {
    // 힌트: 검증 후 this.celsius 에 대입
    throw new Error('TODO: 섭씨 setter (검증 포함)');
  }

  // 화씨 값을 읽는다. F = C * 9/5 + 32
  get f(): number {
    // 힌트: 섭씨→화씨 변환식
    throw new Error('TODO: 화씨 getter');
  }

  // 화씨 값을 쓴다. 내부 celsius 로 변환해 저장한다. C = (F - 32) * 5/9
  set f(value: number) {
    // 힌트: 화씨→섭씨 변환 후, 절대영도 검증(음수 온도 가능성)까지 거쳐 this.celsius 에 저장.
    throw new Error('TODO: 화씨 setter (변환 + 검증)');
  }
}
