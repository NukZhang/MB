// 战斗地图
class BattleMap {
  constructor(config) {
    this.width = config.world.mapWidth;
    this.height = config.world.mapHeight;
    this.pixelsPerMeter = config.world.pixelsPerMeter;
    this.backgroundColor = config.map.battleArea.backgroundColor;
    
    // 网格配置
    this.gridEnabled = config.game.grid.enabled;
    this.gridCellSize = config.game.grid.cellSize;
    this.gridColor = config.game.grid.color;
    this.gridLineWidth = config.game.grid.lineWidth;
  }

  // 渲染地图
  render(context, camera) {
    const bounds = camera.getViewBounds();
    
    // 绘制背景
    context.fillStyle = this.backgroundColor;
    context.fillRect(0, 0, camera.canvasWidth, camera.canvasHeight);

    // 绘制网格
    if (this.gridEnabled) {
      this.renderGrid(context, camera, bounds);
    }
  }

  // 渲染网格
  renderGrid(context, camera, bounds) {
    context.strokeStyle = this.gridColor;
    context.lineWidth = this.gridLineWidth;
    context.beginPath();

    // 计算网格范围
    const startX = Math.floor(bounds.left / this.gridCellSize) * this.gridCellSize;
    const endX = Math.ceil(bounds.right / this.gridCellSize) * this.gridCellSize;
    const startY = Math.floor(bounds.top / this.gridCellSize) * this.gridCellSize;
    const endY = Math.ceil(bounds.bottom / this.gridCellSize) * this.gridCellSize;

    // 绘制垂直线
    for (let x = startX; x <= endX; x += this.gridCellSize) {
      if (x < 0 || x > this.width) continue;
      
      const screenStart = camera.worldToScreen(new Vector2(x, Math.max(0, startY)));
      const screenEnd = camera.worldToScreen(new Vector2(x, Math.min(this.height, endY)));
      
      context.moveTo(screenStart.x, screenStart.y);
      context.lineTo(screenEnd.x, screenEnd.y);
    }

    // 绘制水平线
    for (let y = startY; y <= endY; y += this.gridCellSize) {
      if (y < 0 || y > this.height) continue;
      
      const screenStart = camera.worldToScreen(new Vector2(Math.max(0, startX), y));
      const screenEnd = camera.worldToScreen(new Vector2(Math.min(this.width, endX), y));
      
      context.moveTo(screenStart.x, screenStart.y);
      context.lineTo(screenEnd.x, screenEnd.y);
    }

    context.stroke();

    // 绘制地图边界（高亮）
    context.strokeStyle = '#666666';
    context.lineWidth = 2;
    context.beginPath();

    const topLeft = camera.worldToScreen(new Vector2(0, 0));
    const topRight = camera.worldToScreen(new Vector2(this.width, 0));
    const bottomLeft = camera.worldToScreen(new Vector2(0, this.height));
    const bottomRight = camera.worldToScreen(new Vector2(this.width, this.height));

    context.moveTo(topLeft.x, topLeft.y);
    context.lineTo(topRight.x, topRight.y);
    context.lineTo(bottomRight.x, bottomRight.y);
    context.lineTo(bottomLeft.x, bottomLeft.y);
    context.closePath();
    context.stroke();
  }

  // 检查位置是否在地图内
  isInBounds(x, y) {
    return x >= 0 && x <= this.width && y >= 0 && y <= this.height;
  }

  // 限制位置在地图范围内
  clampPosition(position) {
    position.x = MathUtil.clamp(position.x, 0, this.width);
    position.y = MathUtil.clamp(position.y, 0, this.height);
    return position;
  }
}
