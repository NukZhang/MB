// 配置管理器
class ConfigManager {
  constructor() {
    this.configs = {};
    this.loaded = false;
  }

  // 加载所有配置文件
  async loadAll() {
    const configFiles = [
      'game',
      'character',
      'weapon',
      'map',
      'mount',
      'hero'
    ];

    try {
      const promises = configFiles.map(name => this.loadConfig(name));
      await Promise.all(promises);
      this.loaded = true;
      console.log('所有配置加载完成');
      return true;
    } catch (error) {
      console.error('配置加载失败:', error);
      return false;
    }
  }

  // 加载单个配置文件
  async loadConfig(name) {
    try {
      // 添加时间戳参数防止浏览器缓存
      const timestamp = new Date().getTime();
      const response = await fetch(`config/${name}.json?t=${timestamp}`);
      if (!response.ok) {
        throw new Error(`加载配置失败: ${name}`);
      }
      const data = await response.json();
      this.configs[name] = data;
      return data;
    } catch (error) {
      console.error(`配置加载错误 (${name}):`, error);
      // 对于hero配置，即使加载失败也继续执行，避免影响游戏启动
      if (name === 'hero') {
        this.configs[name] = { heroes: [] };
        return this.configs[name];
      }
      throw error;
    }
  }

  // 获取配置项，支持路径访问 例如: "game.canvas.width" 或 "character.player.size"
  get(path) {
    const parts = path.split('.');
    let current = this.configs;

    for (const part of parts) {
      if (current === undefined || current === null) {
        console.warn(`配置路径不存在: ${path}`);
        return undefined;
      }
      current = current[part];
    }

    return current;
  }

  // 获取整个配置对象
  getConfig(name) {
    return this.configs[name];
  }

  // 检查是否已加载
  isLoaded() {
    return this.loaded;
  }
}
