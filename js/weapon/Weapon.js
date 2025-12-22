// 武器基类
class Weapon {
  constructor(config, owner) {
    this.owner = owner;
    this.config = config;
    
    // 武器属性
    this.damage = config.damage || 10;
    this.cooldown = config.cooldown || 1.0;
    this.cooldownTimer = 0;
    
    // 武器状态
    this.attacking = false;
    this.enabled = true;
    
    // 图片
    this.image = null;
    this.imageLoaded = false;
    this.imagePath = config.imagePath;
    
    if (this.imagePath) {
      this.loadImage();
    }
  }

  loadImage() {
    this.image = new Image();
    this.image.onload = () => {
      this.imageLoaded = true;
      console.log(`武器图片加载成功: ${this.imagePath}`);
    };
    this.image.onerror = () => {
      console.error(`武器图片加载失败: ${this.imagePath}`);
    };
    this.image.src = this.imagePath;
  }

  // 检查是否可以攻击
  canAttack() {
    return this.enabled && !this.attacking && this.cooldownTimer <= 0;
  }

  // 触发攻击
  attack(target) {
    // 子类实现
  }

  // 更新
  update(deltaTime) {
    // 更新冷却计时器
    if (this.cooldownTimer > 0) {
      this.cooldownTimer -= deltaTime;
    }
  }

  // 渲染
  render(context, camera) {
    // 子类实现
  }
}
