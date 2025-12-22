// 游戏入口
let game = null;

// 页面加载完成后初始化游戏
window.addEventListener('load', async () => {
  const loadingElement = document.getElementById('loading');
  
  try {
    loadingElement.textContent = '正在加载配置...';
    
    // 创建游戏实例
    game = new Game();
    
    // 初始化游戏
    await game.init();
    
    // 隐藏加载提示
    loadingElement.classList.add('hidden');
    
    // 启动游戏
    game.start();
    
  } catch (error) {
    console.error('游戏启动失败:', error);
    loadingElement.textContent = '游戏加载失败: ' + error.message;
    loadingElement.style.color = '#ff4444';
  }
});

// 页面失去焦点时暂停
window.addEventListener('blur', () => {
  if (game && game.running) {
    game.pause();
  }
});

// 页面获得焦点时恢复
window.addEventListener('focus', () => {
  if (game && game.running && game.paused) {
    game.resume();
  }
});
