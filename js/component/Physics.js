// 物理组件 - 速度、加速度、质量
class Physics {
  constructor(config) {
    this.velocity = new Vector2(0, 0);
    this.acceleration = new Vector2(0, 0);
    
    this.maxSpeed = config.maxSpeed || 5;
    this.accelerationForce = config.acceleration || 10;
    this.mass = config.mass || 1;
    this.friction = 0.95; // 摩擦系数 (原0.9，每帧衰减10%；现0.95，每帧衰减5%)
  }

  // 施加加速度（基于输入方向）
  applyAcceleration(direction) {
    // direction 应该是归一化的方向向量
    if (direction.length() > 0) {
      const force = Vector2.multiply(direction, this.accelerationForce);
      this.acceleration.add(force);
    }
  }

  // 施加力
  applyForce(force) {
    // F = ma, a = F/m
    const acc = Vector2.multiply(force, 1 / this.mass);
    this.acceleration.add(acc);
  }

  // 施加冲量（瞬时改变速度）
  applyImpulse(impulse) {
    this.velocity.add(impulse);
  }

  // 更新物理状态
  update(deltaTime) {
    // 判断是否有加速度输入
    const hasInput = this.acceleration.length() > 0.01;
    
    // 更新速度
    this.velocity.add(Vector2.multiply(this.acceleration, deltaTime));

    // 只在没有输入时应用摩擦
    if (!hasInput) {
      this.velocity.multiply(this.friction);
    }

    // 限制最大速度
    this.velocity.limit(this.maxSpeed);

    // 重置加速度
    this.acceleration.set(0, 0);

    // 速度很小时停止
    if (this.velocity.length() < 0.01) {
      this.velocity.set(0, 0);
    }

    return this.velocity.clone();
  }

  // 获取速度比例（相对于最大速度）
  getSpeedRatio() {
    return this.velocity.length() / this.maxSpeed;
  }
}
