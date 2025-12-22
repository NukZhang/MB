// 摄像机系统
class Camera {
  constructor(canvasWidth, canvasHeight, worldWidth, worldHeight, pixelsPerMeter) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    this.pixelsPerMeter = pixelsPerMeter;

    // 摄像机在世界中的位置（米）
    this.position = new Vector2(worldWidth / 2, worldHeight / 2);
    this.target = null;
    this.followSpeed = 5; // 跟随平滑度
  }

  // 设置跟随目标
  follow(target) {
    this.target = target;
  }

  // 更新摄像机位置
  update(deltaTime) {
    if (this.target && this.target.transform) {
      const targetPos = this.target.transform.position;
      
      // 平滑跟随
      const dx = targetPos.x - this.position.x;
      const dy = targetPos.y - this.position.y;
      
      this.position.x += dx * this.followSpeed * deltaTime;
      this.position.y += dy * this.followSpeed * deltaTime;

      // 限制摄像机在地图范围内
      const halfViewWidth = (this.canvasWidth / this.pixelsPerMeter) / 2;
      const halfViewHeight = (this.canvasHeight / this.pixelsPerMeter) / 2;

      this.position.x = MathUtil.clamp(this.position.x, halfViewWidth, this.worldWidth - halfViewWidth);
      this.position.y = MathUtil.clamp(this.position.y, halfViewHeight, this.worldHeight - halfViewHeight);
    }
  }

  // 世界坐标转屏幕坐标
  worldToScreen(worldPos) {
    const screenX = (worldPos.x - this.position.x) * this.pixelsPerMeter + this.canvasWidth / 2;
    const screenY = (worldPos.y - this.position.y) * this.pixelsPerMeter + this.canvasHeight / 2;
    return new Vector2(screenX, screenY);
  }

  // 屏幕坐标转世界坐标
  screenToWorld(screenPos) {
    const worldX = (screenPos.x - this.canvasWidth / 2) / this.pixelsPerMeter + this.position.x;
    const worldY = (screenPos.y - this.canvasHeight / 2) / this.pixelsPerMeter + this.position.y;
    return new Vector2(worldX, worldY);
  }

  // 获取可视范围（世界坐标）
  getViewBounds() {
    const halfWidth = (this.canvasWidth / this.pixelsPerMeter) / 2;
    const halfHeight = (this.canvasHeight / this.pixelsPerMeter) / 2;

    return {
      left: this.position.x - halfWidth,
      right: this.position.x + halfWidth,
      top: this.position.y - halfHeight,
      bottom: this.position.y + halfHeight
    };
  }

  // 世界距离转屏幕距离
  worldToScreenDistance(worldDistance) {
    return worldDistance * this.pixelsPerMeter;
  }

  // 屏幕距离转世界距离
  screenToWorldDistance(screenDistance) {
    return screenDistance / this.pixelsPerMeter;
  }
}
