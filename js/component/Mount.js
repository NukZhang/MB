// 骑乘组件
class Mount {
  constructor(config, owner) {
    this.owner = owner;
    this.config = config;
    this.mounted = false;
    
    // 马匹属性
    this.maxSpeed = config.maxSpeed || 10;
    this.acceleration = config.acceleration || 12;
    this.friction = config.friction || 0.88;
    
    // 马头图片
    this.image = null;
    this.imageLoaded = false;
    this.imagePath = config.imagePath;
    
    // 渲染参数
    this.offsetX = config.offsetX || 0.3; // 相对于角色的偏移（米）
    this.offsetY = config.offsetY || 0.4;
    this.renderWidth = config.renderWidth || 1.0; // 渲染宽度（米）
    this.renderHeight = config.renderHeight || 1.0; // 渲染高度（米）
    
    // 动画参数
    this.bobSpeed = config.bobSpeed || 8;
    this.bobAmount = config.bobAmount || 0.15; // 上下摆动幅度（米）
    this.animationTime = 0;
    
    // 加载图片
    this.loadImage();
  }

  loadImage() {
    if (this.imagePath) {
      this.image = new Image();
      this.image.onload = () => {
        this.imageLoaded = true;
        console.log('马头图片加载成功');
      };
      this.image.onerror = () => {
        console.error('马头图片加载失败:', this.imagePath);
      };
      this.image.src = this.imagePath;
    }
  }

  // 上马
  mount() {
    if (!this.mounted && this.owner.physics) {
      this.mounted = true;
      
      // 保存原始移动参数
      this.originalMaxSpeed = this.owner.physics.maxSpeed;
      this.originalAcceleration = this.owner.physics.accelerationForce;
      this.originalFriction = this.owner.physics.friction;
      
      // 应用骑乘参数
      this.owner.physics.maxSpeed = this.maxSpeed;
      this.owner.physics.accelerationForce = this.acceleration;
      this.owner.physics.friction = this.friction;
      
      console.log('上马');
    }
  }

  // 下马
  dismount() {
    if (this.mounted && this.owner.physics) {
      this.mounted = false;
      
      // 恢复原始参数
      this.owner.physics.maxSpeed = this.originalMaxSpeed;
      this.owner.physics.accelerationForce = this.originalAcceleration;
      this.owner.physics.friction = this.originalFriction;
      
      console.log('下马');
    }
  }

  // 更新
  update(deltaTime) {
    if (!this.mounted) return;
    
    // 更新动画时间
    if (this.owner.isMoving) {
      this.animationTime += deltaTime * this.bobSpeed;
    }
  }

  // 渲染马头（应该在角色之前渲染）
  render(context, camera) {
    if (!this.mounted || !this.imageLoaded) return;

    const ownerPos = this.owner.transform.position;
    const facingDir = this.owner.facingDirection;
    
    // 计算马头位置
    const horseX = ownerPos.x + facingDir * this.offsetX;
    const horseY = ownerPos.y + this.offsetY;
    
    // 上下摆动（跑动时）
    let bobOffset = 0;
    if (this.owner.isMoving) {
      bobOffset = Math.sin(this.animationTime) * this.bobAmount;
    }
    
    const horseWorldPos = new Vector2(horseX, horseY + bobOffset);
    const screenPos = camera.worldToScreen(horseWorldPos);
    
    // 计算渲染尺寸（基于世界单位转屏幕像素，并根据角色尺寸比例缩放）
    // 玩家尺寸2.0米为基准，其他角色按比例缩放
    const sizeRatio = this.owner.radius / 1.0; // 1.0是玩家半径的一半
    const screenWidth = camera.worldToScreenDistance(this.renderWidth * sizeRatio);
    const screenHeight = camera.worldToScreenDistance(this.renderHeight * sizeRatio);
    
    context.save();
    context.translate(screenPos.x, screenPos.y);
    
    // 根据面向方向翻转
    if (facingDir < 0) {
      context.scale(-1, 1);
    }
    
    // 绘制马头
    context.drawImage(
      this.image,
      -screenWidth / 2,
      -screenHeight / 2,
      screenWidth,
      screenHeight
    );
    
    context.restore();
  }
}
