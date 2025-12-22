// 虚拟摇杆
class Joystick {
  constructor(canvas) {
    this.canvas = canvas;
    this.active = false;
    this.basePosition = new Vector2(0, 0);
    this.stickPosition = new Vector2(0, 0);
    this.maxDistance = 50; // 摇杆最大偏移距离（像素）
    
    this.direction = new Vector2(0, 0);
    
    // 样式
    this.baseRadius = 60;
    this.stickRadius = 30;
    this.baseColor = 'rgba(255, 255, 255, 0.3)';
    this.stickColor = 'rgba(255, 255, 255, 0.6)';
    
    this.touchId = null;
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    // 触摸事件
    this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e));
    this.canvas.addEventListener('touchmove', (e) => this.onTouchMove(e));
    this.canvas.addEventListener('touchend', (e) => this.onTouchEnd(e));
    this.canvas.addEventListener('touchcancel', (e) => this.onTouchEnd(e));

    // 鼠标事件（用于PC调试）
    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
    this.canvas.addEventListener('mouseleave', (e) => this.onMouseUp(e));
  }

  // 触摸开始
  onTouchStart(e) {
    e.preventDefault();
    if (this.touchId === null && e.touches.length > 0) {
      const touch = e.touches[0];
      this.touchId = touch.identifier;
      this.activate(touch.clientX, touch.clientY);
    }
  }

  // 触摸移动
  onTouchMove(e) {
    e.preventDefault();
    if (this.touchId !== null) {
      for (let touch of e.touches) {
        if (touch.identifier === this.touchId) {
          this.updateStick(touch.clientX, touch.clientY);
          break;
        }
      }
    }
  }

  // 触摸结束
  onTouchEnd(e) {
    e.preventDefault();
    if (this.touchId !== null) {
      let touchEnded = true;
      for (let touch of e.touches) {
        if (touch.identifier === this.touchId) {
          touchEnded = false;
          break;
        }
      }
      if (touchEnded) {
        this.deactivate();
      }
    }
  }

  // 鼠标按下
  onMouseDown(e) {
    if (this.touchId === null) {
      this.touchId = 'mouse';
      this.activate(e.clientX, e.clientY);
    }
  }

  // 鼠标移动
  onMouseMove(e) {
    if (this.touchId === 'mouse') {
      this.updateStick(e.clientX, e.clientY);
    }
  }

  // 鼠标抬起
  onMouseUp(e) {
    if (this.touchId === 'mouse') {
      this.deactivate();
    }
  }

  // 激活摇杆
  activate(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    this.basePosition.set(clientX - rect.left, clientY - rect.top);
    this.stickPosition.copy(this.basePosition);
    this.active = true;
  }

  // 更新摇杆位置
  updateStick(clientX, clientY) {
    if (!this.active) return;

    const rect = this.canvas.getBoundingClientRect();
    const touchPos = new Vector2(clientX - rect.left, clientY - rect.top);
    
    // 计算偏移
    const offset = Vector2.sub(touchPos, this.basePosition);
    const distance = offset.length();

    if (distance > this.maxDistance) {
      offset.normalize().multiply(this.maxDistance);
    }

    this.stickPosition = Vector2.add(this.basePosition, offset);

    // 更新方向（归一化）
    this.direction = offset.clone().normalize();
  }

  // 取消激活
  deactivate() {
    this.active = false;
    this.touchId = null;
    this.direction.set(0, 0);
  }

  // 获取方向向量
  getDirection() {
    return this.direction.clone();
  }

  // 渲染摇杆
  render(context) {
    if (!this.active) return;

    // 绘制底座
    context.fillStyle = this.baseColor;
    context.beginPath();
    context.arc(this.basePosition.x, this.basePosition.y, this.baseRadius, 0, Math.PI * 2);
    context.fill();

    // 绘制底座边框
    context.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    context.lineWidth = 2;
    context.beginPath();
    context.arc(this.basePosition.x, this.basePosition.y, this.baseRadius, 0, Math.PI * 2);
    context.stroke();

    // 绘制摇杆
    context.fillStyle = this.stickColor;
    context.beginPath();
    context.arc(this.stickPosition.x, this.stickPosition.y, this.stickRadius, 0, Math.PI * 2);
    context.fill();

    // 绘制摇杆边框
    context.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    context.lineWidth = 2;
    context.beginPath();
    context.arc(this.stickPosition.x, this.stickPosition.y, this.stickRadius, 0, Math.PI * 2);
    context.stroke();
  }
}
