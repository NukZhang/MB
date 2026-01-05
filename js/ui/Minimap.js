// 小地图
class Minimap {
  constructor(canvas, game) {
    this.canvas = canvas;
    this.game = game;
    
    // 小地图尺寸和位置
    this.width = 200;  // 小地图宽度
    this.height = 100; // 小地图高度（根据地图宽高比调整）
    this.padding = 20; // 距离屏幕边缘的距离
    
    // 小地图位置（右上角）
    this.x = canvas.width - this.width - this.padding;
    this.y = this.padding;
    
    // 地图信息
    this.mapWidth = game.map.width;
    this.mapHeight = game.map.height;
    
    // 计算缩放比例
    this.scaleX = this.width / this.mapWidth;
    this.scaleY = this.height / this.mapHeight;
    
    // 样式
    this.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    this.borderColor = 'rgba(255, 255, 255, 0.8)';
    this.borderWidth = 2;
    
    // 实体颜色
    this.playerColor = '#3498db';
    this.enemyColor = '#e74c3c';
    this.playerBuildingColor = '#2980b9';
    this.enemyBuildingColor = '#c0392b';
    this.viewportColor = 'rgba(255, 255, 255, 0.3)';
  }
  
  // 渲染小地图
  render(context) {
    // 保存当前状态
    context.save();
    
    // 绘制背景
    context.fillStyle = this.backgroundColor;
    context.fillRect(this.x, this.y, this.width, this.height);
    
    // 绘制边框
    context.strokeStyle = this.borderColor;
    context.lineWidth = this.borderWidth;
    context.strokeRect(this.x, this.y, this.width, this.height);
    
    // 绘制建筑物
    this.renderBuildings(context);
    
    // 绘制实体
    this.renderEntities(context);
    
    // 绘制玩家
    this.renderPlayer(context);
    
    // 绘制视口
    this.renderViewport(context);
    
    // 恢复状态
    context.restore();
  }
  
  // 渲染建筑物
  renderBuildings(context) {
    this.game.buildings.forEach(building => {
      const color = building.type === 'player' ? this.playerBuildingColor : this.enemyBuildingColor;
      const x = this.x + building.position.x * this.scaleX;
      const y = this.y + building.position.y * this.scaleY;
      const width = building.width * this.scaleX;
      const height = building.height * this.scaleY;
      
      context.fillStyle = color;
      context.fillRect(x - width / 2, y - height / 2, width, height);
    });
  }
  
  // 渲染实体
  renderEntities(context) {
    this.game.entities.forEach(entity => {
      if (entity === this.game.player) return; // 玩家单独渲染
      
      const color = entity.team === 'player' ? this.playerColor : this.enemyColor;
      const x = this.x + entity.transform.position.x * this.scaleX;
      const y = this.y + entity.transform.position.y * this.scaleY;
      
      context.fillStyle = color;
      context.beginPath();
      context.arc(x, y, 2, 0, Math.PI * 2);
      context.fill();
    });
  }
  
  // 渲染玩家
  renderPlayer(context) {
    if (!this.game.player || !this.game.player.alive) return;
    
    const x = this.x + this.game.player.transform.position.x * this.scaleX;
    const y = this.y + this.game.player.transform.position.y * this.scaleY;
    
    // 玩家用更大的圆点表示
    context.fillStyle = this.playerColor;
    context.beginPath();
    context.arc(x, y, 4, 0, Math.PI * 2);
    context.fill();
    
    // 玩家边框
    context.strokeStyle = 'white';
    context.lineWidth = 1;
    context.beginPath();
    context.arc(x, y, 4, 0, Math.PI * 2);
    context.stroke();
  }
  
  // 渲染视口
  renderViewport(context) {
    const camera = this.game.camera;
    
    // 获取视口在世界坐标中的范围
    const viewBounds = camera.getViewBounds();
    
    // 转换为小地图坐标
    const left = this.x + viewBounds.left * this.scaleX;
    const right = this.x + viewBounds.right * this.scaleX;
    const top = this.y + viewBounds.top * this.scaleY;
    const bottom = this.y + viewBounds.bottom * this.scaleY;
    
    // 绘制视口矩形
    context.strokeStyle = this.viewportColor;
    context.lineWidth = 1;
    context.strokeRect(left, top, right - left, bottom - top);
  }
  
  // 处理点击事件
  handleClick(clientX, clientY) {
    // 检查点击是否在小地图范围内
    if (clientX < this.x || clientX > this.x + this.width ||
        clientY < this.y || clientY > this.y + this.height) {
      return false; // 点击不在小地图内
    }
    
    // 转换点击位置到世界坐标
    const worldX = (clientX - this.x) / this.scaleX;
    const worldY = (clientY - this.y) / this.scaleY;
    
    // 移动摄像机到该位置
    this.game.camera.setPosition(worldX, worldY);
    
    return true; // 点击已处理
  }
  
  // 更新（用于处理尺寸变化等）
  update() {
    // 如果画布尺寸改变，更新小地图位置
    if (this.x !== this.canvas.width - this.width - this.padding) {
      this.x = this.canvas.width - this.width - this.padding;
    }
  }
}