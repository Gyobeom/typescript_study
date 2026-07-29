// Day 1 — 모범 답안
// 클래스 선언 / 생성자 / 프로퍼티 / 메서드의 기본형.

export class Point {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  distanceFromOrigin(): number {
    return Math.sqrt(this.x ** 2 + this.y ** 2);
  }

  distanceTo(other: Point): number {
    return Math.sqrt((this.x - other.x) ** 2 + (this.y - other.y) ** 2);
  }

  translate(dx: number, dy: number): Point {
    return new Point(this.x + dx, this.y + dy);
  }

  toString(): string {
    return `(${this.x}, ${this.y})`;
  }
}
