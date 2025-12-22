// 变换组件 - 位置、旋转、缩放
class Transform {
  constructor(x = 0, y = 0) {
    this.position = new Vector2(x, y);
    this.rotation = 0; // 弧度
    this.scale = new Vector2(1, 1);
  }

  // 设置位置
  setPosition(x, y) {
    this.position.set(x, y);
  }

  // 移动
  translate(dx, dy) {
    this.position.x += dx;
    this.position.y += dy;
  }

  // 设置旋转（弧度）
  setRotation(angle) {
    this.rotation = angle;
  }

  // 旋转
  rotate(angle) {
    this.rotation += angle;
  }

  // 设置缩放
  setScale(sx, sy) {
    this.scale.set(sx, sy);
  }
}
