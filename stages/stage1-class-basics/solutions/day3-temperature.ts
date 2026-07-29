// Day 3 — 모범 답안
// 파라미터 프로퍼티 축약 + getter/setter. 내부는 섭씨 하나로 관리하고 화씨는 파생값.

const ABSOLUTE_ZERO_C = -273.15;

export class Temperature {
  constructor(private celsius: number) {
    if (celsius < ABSOLUTE_ZERO_C) {
      throw new Error('절대영도 미만의 온도는 존재할 수 없다');
    }
  }

  get c(): number {
    return this.celsius;
  }

  set c(value: number) {
    if (value < ABSOLUTE_ZERO_C) {
      throw new Error('절대영도 미만의 온도는 존재할 수 없다');
    }
    this.celsius = value;
  }

  get f(): number {
    return this.celsius * 9 / 5 + 32;
  }

  set f(value: number) {
    const asCelsius = (value - 32) * 5 / 9;
    if (asCelsius < ABSOLUTE_ZERO_C) {
      throw new Error('절대영도 미만의 온도는 존재할 수 없다');
    }
    this.celsius = asCelsius;
  }
}
