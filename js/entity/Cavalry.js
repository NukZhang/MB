// 骑兵（冲锋AI）
class Cavalry extends Enemy {
  constructor(x, y, team, config, mountConfig, lanceConfig) {
    super(x, y, config, team);
    
    // 骑兵特定颜色
    this.bodyColor = team === 'player' ? '#9b59b6' : '#e91e63';
    this.headColor = team === 'player' ? '#8e44ad' : '#c2185b';
    
    // 添加骑乘组件
    this.mount = this.addComponent('mount', new Mount(mountConfig, this));
    this.mount.mount(); // 骑兵始终骑马
    
    // 装备骑枪
    this.lance = new Lance(lanceConfig, this);
    this.weapons = [this.lance];
    
    // 添加AI组件 - 来回冲锋AI
    this.ai = this.addComponent('ai', new AI({
      behaviorType: 'cavalry',
      targetRefreshInterval: 15,
      attackRange: 2.5,
      chaseDistance: 40,
      chargeCooldown: 3,
      retreatDistance: 10  // 后退距离参数（实际代码中会使用更宽松的判定）
    }));
  }
  
  update(deltaTime) {
    // 调用父类更新（处理物理、动画、死亡）
    super.update(deltaTime);
    
    // 如果死亡，不更新武器、骑乘和AI
    if (this.dying || !this.alive) return;
    
    // 更新骑乘
    if (this.mount) {
      this.mount.update(deltaTime);
    }
    
    // 更新武器
    for (const weapon of this.weapons) {
      weapon.update(deltaTime);
    }
  }
  
  render(context, camera) {
    // 调用父类渲染
    super.render(context, camera);
    
    // 渲染马
    if ((this.alive || this.dying) && this.mount) {
      this.mount.render(context, camera);
    }
    
    // 渲染武器
    if (this.alive || this.dying) {
      for (const weapon of this.weapons) {
        weapon.render(context, camera);
      }
    }
  }
}
