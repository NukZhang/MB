// 步兵（近战AI）
class Infantry extends Enemy {
  constructor(x, y, team, config, swordConfig) {
    super(x, y, config, team);
    
    // 步兵特定颜色
    this.bodyColor = team === 'player' ? '#3498db' : '#e74c3c';
    this.headColor = team === 'player' ? '#2980b9' : '#c0392b';
    
    // 添加AI组件
    this.ai = this.addComponent('ai', new AI({
      behaviorType: 'melee',
      targetRefreshInterval: 3,
      attackRange: 2,
      chaseDistance: 30
    }));
    
    // 装备剑
    this.sword = new Sword(swordConfig, this);
    this.weapons = [this.sword];
  }
  
  update(deltaTime) {
    // 调用父类更新（处理物理、动画、死亡）
    super.update(deltaTime);
    
    // 如果死亡，不更新武器和AI
    if (this.dying || !this.alive) return;
    
    // 更新武器
    for (const weapon of this.weapons) {
      weapon.update(deltaTime);
    }
  }
  
  render(context, camera) {
    // 调用父类渲染
    super.render(context, camera);
    
    // 渲染武器
    if (this.alive || this.dying) {
      for (const weapon of this.weapons) {
        weapon.render(context, camera);
      }
    }
  }
}
