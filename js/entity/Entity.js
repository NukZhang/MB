// 实体基类
class Entity {
  constructor(x, y) {
    this.transform = new Transform(x, y);
    this.components = new Map();
    this.active = true;
    this.type = 'entity';
  }

  // 添加组件
  addComponent(name, component) {
    this.components.set(name, component);
    return component;
  }

  // 获取组件
  getComponent(name) {
    return this.components.get(name);
  }

  // 检查是否有组件
  hasComponent(name) {
    return this.components.has(name);
  }

  // 移除组件
  removeComponent(name) {
    this.components.delete(name);
  }

  // 更新实体
  update(deltaTime) {
    // 子类重写
  }

  // 渲染实体
  render(context, camera) {
    // 子类重写
  }

  // 销毁实体
  destroy() {
    this.active = false;
    this.components.clear();
  }
}
