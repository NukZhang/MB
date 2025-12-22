// 输入管理 - 键盘和摇杆
class Input {
  constructor(canvas) {
    this.keys = {};
    this.joystick = new Joystick(canvas);
    
    this.setupKeyboardListeners();
  }

  setupKeyboardListeners() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });
  }

  // 检查按键是否按下
  isKeyPressed(key) {
    return this.keys[key.toLowerCase()] || false;
  }

  // 获取输入方向（合并键盘和摇杆）
  getDirection() {
    const direction = new Vector2(0, 0);

    // 键盘输入（WASD）
    if (this.isKeyPressed('w')) direction.y -= 1;
    if (this.isKeyPressed('s')) direction.y += 1;
    if (this.isKeyPressed('a')) direction.x -= 1;
    if (this.isKeyPressed('d')) direction.x += 1;

    // 如果有键盘输入，使用键盘
    if (direction.length() > 0) {
      direction.normalize();
      return direction;
    }

    // 否则使用摇杆
    return this.joystick.getDirection();
  }

  // 渲染摇杆
  render(context) {
    this.joystick.render(context);
  }

  // 更新
  update() {
    // 预留，用于处理输入缓冲等
  }
}
