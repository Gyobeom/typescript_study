// Day 1 — 클래스 선언, 생성자, 프로퍼티, 메서드
//
// 2차원 평면의 점(Point)을 표현하는 클래스를 구현하라.
// 목표: 클래스 선언 → 생성자로 프로퍼티 초기화 → 메서드로 동작 정의, 이 3단계를 손에 익힌다.

export class Point {
  // 힌트: 좌표를 담을 x, y 프로퍼티를 number 타입으로 선언한다.
  //       클래스 필드 선언과 함께 타입을 명시하면 strict 모드에서 초기화 강제 규칙을 만족시켜야 한다.
  x: number;
  y: number;

  constructor(x: number, y: number) {
    // 힌트: 생성자 파라미터 x, y 를 this.x, this.y 에 할당한다.
    this.x = x;
    this.y = y;
  }

  // 원점(0,0)으로부터의 유클리드 거리를 반환한다. sqrt(x^2 + y^2)
  distanceFromOrigin(): number {
    // 힌트: Math.sqrt 와 ** 연산자(또는 Math.pow)를 사용한다.
    return Math.sqrt((this.x - 0) ** 2 + (this.y - 0) ** 2)
  }

  // 다른 점까지의 거리를 반환한다.
  distanceTo(other: Point): number {
    // 힌트: (this.x - other.x), (this.y - other.y) 의 제곱합에 sqrt.
    return Math.sqrt((this.x - other.x) ** 2 + (this.y - other.y) ** 2)
  }

  // 이 점을 dx, dy 만큼 이동한 "새로운" Point 를 반환한다(원본은 불변).
  translate(dx: number, dy: number): Point {
    // 힌트: 기존 좌표에 dx, dy 를 더한 값으로 new Point(...) 를 만들어 반환한다.
    return new Point(this.x + dx, this.y + dy)
  }

  // "(x, y)" 형식의 문자열로 변환한다. 예: new Point(1, 2).toString() === "(1, 2)"
  toString(): string {
    // 힌트: 템플릿 리터럴 `(${...}, ${...})` 를 사용한다.
    return `(${this.x}, ${this.y})`
  }
}
