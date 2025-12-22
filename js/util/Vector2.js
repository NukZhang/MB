// 二维向量类
class Vector2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  set(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }

  copy(v) {
    this.x = v.x;
    this.y = v.y;
    return this;
  }

  clone() {
    return new Vector2(this.x, this.y);
  }

  add(v) {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  sub(v) {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  multiply(scalar) {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }

  divide(scalar) {
    if (scalar !== 0) {
      this.x /= scalar;
      this.y /= scalar;
    }
    return this;
  }

  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  lengthSq() {
    return this.x * this.x + this.y * this.y;
  }

  normalize() {
    const len = this.length();
    if (len > 0) {
      this.divide(len);
    }
    return this;
  }

  distance(v) {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  distanceSq(v) {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return dx * dx + dy * dy;
  }

  dot(v) {
    return this.x * v.x + this.y * v.y;
  }

  angle() {
    return Math.atan2(this.y, this.x);
  }

  rotate(angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const x = this.x * cos - this.y * sin;
    const y = this.x * sin + this.y * cos;
    this.x = x;
    this.y = y;
    return this;
  }

  limit(max) {
    const lenSq = this.lengthSq();
    if (lenSq > max * max) {
      this.normalize().multiply(max);
    }
    return this;
  }

  static add(v1, v2) {
    return new Vector2(v1.x + v2.x, v1.y + v2.y);
  }

  static sub(v1, v2) {
    return new Vector2(v1.x - v2.x, v1.y - v2.y);
  }

  static multiply(v, scalar) {
    return new Vector2(v.x * scalar, v.y * scalar);
  }

  static distance(v1, v2) {
    return v1.distance(v2);
  }

  static zero() {
    return new Vector2(0, 0);
  }
}
