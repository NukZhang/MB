# 角色扮演生存小游戏 - 架构说明

## 架构概述
本项目采用面向对象设计，使用纯前端技术栈（HTML5 Canvas + JavaScript）实现。遵循数据驱动设计，所有游戏参数可通过配置文件调整。

## 目录结构
```
MB/
├── index.html              # 游戏入口页面
├── css/
│   └── style.css          # 样式文件
├── js/
│   ├── main.js            # 游戏主循环和入口
│   ├── config/
│   │   └── ConfigManager.js    # 配置管理器
│   ├── core/
│   │   ├── Game.js             # 游戏核心类
│   │   ├── Scene.js            # 场景管理
│   │   ├── Camera.js           # 摄像机系统
│   │   └── Input.js            # 输入管理（摇杆+键盘）
│   ├── entity/
│   │   ├── Entity.js           # 实体基类
│   │   ├── Character.js        # 角色基类
│   │   ├── Player.js           # 玩家角色
│   │   ├── Enemy.js            # 敌人基类
│   │   ├── Arrow.js            # 箭矢实体
│   │   ├── Infantry.js         # 步兵
│   │   ├── Cavalry.js          # 骑兵
│   │   └── Archer.js           # 弓兵
│   ├── weapon/
│   │   ├── Weapon.js           # 武器基类
│   │   ├── Sword.js            # 剑
│   │   ├── Bow.js              # 弓
│   │   ├── Lance.js            # 骑枪
│   │   └── Arrow.js            # 箭矢
│   ├── component/
│   │   ├── Transform.js        # 变换组件（位置、旋转、缩放）
│   │   ├── Physics.js          # 物理组件（速度、加速度、质量）
│   │   ├── Collider.js         # 碰撞器组件
│   │   ├── Renderer.js         # 渲染组件
│   │   ├── Mount.js            # 骑乘组件
│   │   └── AI.js               # AI组件
│   ├── system/
│   │   ├── CollisionSystem.js  # 碰撞系统
│   │   ├── CombatSystem.js     # 战斗判定系统
│   │   ├── RenderSystem.js     # 渲染系统
│   │   ├── PhysicsSystem.js    # 物理系统
│   │   └── AISystem.js         # AI系统
│   ├── ui/
│   │   ├── Joystick.js         # 虚拟摇杆
│   │   ├── HUD.js              # 抬头显示
│   │   └── UpgradePanel.js     # 升级面板
│   ├── map/
│   │   ├── BattleMap.js        # 战斗地图
│   │   └── Building.js         # 建筑物
│   └── util/
│       ├── Vector2.js          # 二维向量工具
│       └── MathUtil.js         # 数学工具函数
├── config/
│   ├── game.json              # 游戏基础配置
│   ├── character.json         # 角色配置
│   ├── weapon.json            # 武器配置
│   └── map.json               # 地图配置
├── res/                       # 美术资源
└── SPEC/                      # 设计文档
```

## 核心模块说明

### 1. 配置系统 (ConfigManager)
**职责**: 统一管理所有配置文件的加载和访问
**接口**:
- `loadConfig(configName)`: 加载指定配置文件
- `getConfig(path)`: 获取配置项，支持路径访问如 "character.player.size"

### 2. 游戏核心 (Game)
**职责**: 游戏主循环、状态管理、系统协调
**接口**:
- `init()`: 初始化游戏
- `update(deltaTime)`: 更新游戏逻辑
- `render()`: 渲染游戏画面
- `start()`: 启动游戏循环
- `pause()`: 暂停游戏
- `resume()`: 恢复游戏

### 3. 场景管理 (Scene)
**职责**: 管理场景中的所有实体
**接口**:
- `addEntity(entity)`: 添加实体到场景
- `removeEntity(entity)`: 从场景移除实体
- `getEntitiesByType(type)`: 按类型获取实体
- `update(deltaTime)`: 更新所有实体
- `render(camera)`: 渲染所有实体

### 4. 摄像机系统 (Camera)
**职责**: 管理视图变换，跟随玩家
**接口**:
- `follow(target)`: 设置跟随目标
- `update(deltaTime)`: 更新摄像机位置
- `worldToScreen(worldPos)`: 世界坐标转屏幕坐标
- `screenToWorld(screenPos)`: 屏幕坐标转世界坐标
- `getViewBounds()`: 获取可视范围

### 5. 输入管理 (Input)
**职责**: 处理摇杆和键盘输入
**接口**:
- `getDirection()`: 获取输入方向向量（归一化）
- `isPressed(key)`: 检查按键是否按下
- `getJoystickPosition()`: 获取摇杆位置
- `update()`: 更新输入状态

### 6. 实体系统 (Entity/Character)
**职责**: 所有游戏对象的基类，使用组件模式
**Entity 接口**:
- `addComponent(component)`: 添加组件
- `getComponent(type)`: 获取组件
- `update(deltaTime)`: 更新实体
- `render(context, camera)`: 渲染实体

**Character 接口** (继承 Entity):
- `takeDamage(damage, knockback)`: 受到伤害和击退
- `die()`: 死亡处理
- `move(acceleration)`: 施加移动加速度
- `attack()`: 触发攻击

**死亡机制**:
- 角色死亡后进入1.5秒的死亡过程
- 死亡过程中失去碰撞（collider.enabled = false）
- 死亡过程中失去摩擦力（friction = 1.0，不衰减速度）
- 保持物理更新，形成自然的击飞效果
- 死亡时根据击退方向产生旋转效果：
  - 击退向量y分量为正（向上击飞）→逆时针旋转
  - 击退向量y分量为负（向下击飞）→顺时针旋转
  - 旋转速度基于击退力度：(knockbackSpeed + 2.5) 弧度/秒
- 渲染时逐渐透明（线性淡出）
- 死亡计时结束后彻底移除（active = false）

### 7. 物理系统 (PhysicsSystem)
**职责**: 处理速度、加速度、惯性
**接口**:
- `update(entities, deltaTime)`: 更新所有物理实体
- `applyForce(entity, force)`: 对实体施加力
- `applyImpulse(entity, impulse)`: 对实体施加冲量

### 8. 碰撞系统 (CollisionSystem)
**职责**: 圆形碰撞检测和推挤处理
**接口**:
- `update(entities)`: 更新碰撞检测
- `checkCollision(entity1, entity2)`: 检测两实体碰撞
- `resolveCollision(entity1, entity2)`: 处理碰撞响应（推挤）

### 9. 战斗系统 (CombatSystem)
**职责**: 攻击框和受击框的碰撞判定
**接口**:
- `createHitbox(weapon, attackData)`: 创建攻击框
- `update(hitboxes, entities)`: 更新攻击判定
- `applyDamage(attacker, target, attackData)`: 应用伤害效果

**攻击数据结构**:
```javascript
{
  damage: number,        // 伤害值
  knockback: Vector2,    // 击退向量
  maxTargets: number     // 最大攻击目标数
}
```

### 10. 渲染系统 (RenderSystem)
**职责**: 管理渲染顺序和层级
**渲染层级** (从后到前):
1. 地图背景
2. 网格
3. 武器（在角色后面的）
4. 坐骑
5. 角色身体
6. 角色头部
7. 武器（在角色前面的）
8. 特效（拖尾、箭矢）
9. UI层

**接口**:
- `render(scene, camera, context)`: 渲染整个场景
- `renderEntity(entity, context, camera)`: 渲染单个实体

### 11. AI系统 (AISystem)
**职责**: 管理NPC行为逻辑
**接口**:
- `addEntity(entity)`: 添加AI实体
- `removeEntity(entity)`: 移除AI实体
- `update(allEntities, deltaTime)`: 更新所有AI实体

**AI组件** (AI):
- `findTarget(owner, entities)`: 查找目标
- `updateBehavior(owner, deltaTime)`: 更新行为状态
- `meleeeBehavior()`: 近战行为（步兵）
- `rangedBehavior()`: 远程行为（弓兵）
- `cavalryBehavior()`: 骑兵行为（冲锋）

**AI行为状态**:
- IDLE: 待机
- MOVE_TO_TARGET: 移动到目标
- KEEP_DISTANCE: 保持距离（弓兵）
- ATTACK: 攻击
- CHARGE_APPROACH: 冲锋接近（骑兵 - 全速向目标冲锋）
- CHARGE_CONTINUE: 冲锋穿透（骑兵 - 保持方向穿过敌阵）
- CHARGE_COOLDOWN: 冲锋冷却（骑兵 - 远离后转向准备再冲）

**行为类型**:
- melee（近战）: 靠近并攻击最近的敌人
- ranged（远程）: 保持距离并攻击
- cavalry（骑兵）: 来回冲锋攻击

**兵种实现**:
- **Infantry（步兵）**:
  - 行为类型: melee
  - 目标刷新间隔: 3秒
  - 攻击范围: 2米
  - 追击距离: 30米
  - 装备: 剑
  - 颜色: 红色系
  
- **Archer（弓兵）**:
  - 行为类型: ranged
  - 目标刷新间隔: 8秒
  - 攻击范围: 弓的最大射程
  - 保持距离: 最大射程的80%
  - 追击距离: 最大射程+5米
  - 装备: 弓
  - 颜色: 蓝色系
  
- **Cavalry（骑兵）**:
  - 行为类型: cavalry
  - 目标刷新间隔: 15秒
  - 攻击范围: 2.5米
  - 追击距离: 40米
  - 冲锋冷却: 3秒
  - 保持距离: 10米（冷却时）
  - 装备: 骑枪
  - 特性: 始终骑马
  - 颜色: 紫色系
  - **移动特性**: 加速度8（较低），最大速度10，灵活度差，体现重骑兵笨拙感
  - **冲锋循环行为**（"冲过去→继续向前→继续冲"）：
    1. APPROACH（接近冲锋）: 全速向目标冲锋，加速到最大速度时自动触发骑枪冲刺攻击
    2. CONTINUE（穿透前进）: 冲刺结束后保持方向继续前进3秒，充分穿过目标和敌阵
    3. COOLDOWN（冷却调整）: 
       - 未远离目标（<10米）: 继续向前移动远离
       - 已远离目标（>=10米）: 缓慢转向目标方向，等待冷却（3秒）
       - 冷却结束后立即开始下一轮接近冲锋
  - **行为特点**：
    - 骑枪冲刺完全由角色速度触发，AI只负责移动控制
    - 穿透阶段不追踪目标，保持直线前进模拟冲过敌阵（3秒）
    - **宽松的远离判定**（10米即可转向），使骑兵更快进入下一轮冲锋
    - 冷却时先拉开距离再转向，形成"来回冲锋"的连贯循环
    - 整个过程流畅自然，符合真实骑兵战术

### 12. 武器系统
所有武器继承 Weapon 基类

**Weapon 基类接口**:
- `constructor(config, owner)`: 构造函数
- `type`: 武器类型标识（'sword'/'bow'/'lance'）
- `update(deltaTime)`: 更新武器状态
- `render(context, camera)`: 渲染武器
- `attack()`: 触发攻击
- `canAttack()`: 是否可以攻击（冷却检查）

**Sword (剑)**:
- **类型标识**: 'sword'
- **攻击状态**: IDLE, RAISE, SLASH, RECOVER
- **动画时长**: 举起0.2s, 劈下0.1s, 后摇0.2s, 冷却1.5s
- **攻击特效**: 旋转+缩放+位移，拖尾特效
- **伤害参数**: 50伤害, 2击退, 最多3个目标
- **攻击范围**: 2.5米扇形区域
- **攻击频率**: 2秒一次

**Bow (弓)**:
- **类型标识**: 'bow'
- **瞄准机制**: 始终指向最近目标，平滑旋转避免跳变
- **发射机制**: 发射箭矢实体(Arrow)
- **拉弓动画**: 蓄力0-1，影响弓形状
- **伤害参数**: 30伤害, 1击退, 单目标
- **射程**: 20米
- **攻击频率**: 2秒一次
- **箭矢**: 独立实体，带碰撞检测，命中后消失

**Lance (骑枪)**:
- **类型标识**: 'lance'
- **激活条件**: 仅在骑乘时可用
- **状态机**: IDLE(竖直), READY(准备), CHARGING(冲刺), COOLDOWN(冷却)
- **冲刺触发**: 角色速度达到最大值时自动放平进入冲刺
- **冲刺检测**: 检测前方扇形区域内的敌人
- **冲刺结束**: 击中目标后0.3秒 或 速度降至70%以下 或 达到最大目标数
- **伤害参数**: 150伤害, 8击退, 最多5个目标
- **击中效果**: 
  - 对敌人: 强力击退（方向+向上）
  - 对自己: 速度降至20%，清除加速度（模拟冲撞反作用力）
- **视觉特效**: 冲刺状态带发光效果
- **冷却时间**: 1秒

### 13. 组件系统

**Transform (变换组件)**:
- `position: Vector2`: 世界坐标位置
- `rotation: number`: 旋转角度（弧度）
- `scale: Vector2`: 缩放
- `translate(x, y)`: 平移

**Physics (物理组件)**:
- `velocity: Vector2`: 速度向量
- `acceleration: Vector2`: 加速度向量
- `maxSpeed: number`: 最大速度
- `friction: number`: 摩擦系数
- `mass: number`: 质量
- `applyAcceleration(acc)`: 施加加速度
- `applyImpulse(impulse)`: 施加冲量
- `update(deltaTime)`: 更新物理状态

**Collider (碰撞器组件)**:
- `radius: number`: 碰撞圆半径
- `enabled: boolean`: 是否启用碰撞
- `mass: number`: 质量（用于碰撞响应）

**Mount (骑乘组件)**:
- `mounted: boolean`: 是否骑乘状态
- `maxSpeed: number`: 骑乘时最大速度
- `acceleration: number`: 骑乘时加速度
- `friction: number`: 骑乘时摩擦力
- `update(deltaTime, physics)`: 更新骑乘状态
- `render(context, camera, transform, facing, animTime)`: 渲染马头

**AI (AI组件)**:
- `enabled: boolean`: 是否启用AI
- `state: string`: 当前行为状态
- `target: Entity`: 当前目标
- `behaviorType: string`: 行为类型（melee/ranged/cavalry）
- `targetRefreshInterval: number`: 刷新目标间隔
- `attackRange: number`: 攻击范围
- `keepDistance: number`: 保持距离（弓兵）
- `chaseDistance: number`: 追击距离

### 14. 地图系统 (BattleMap)
**职责**: 管理战斗地图渲染和边界
**接口**:
- `render(context, camera)`: 渲染地图背景和网格
- `clampPosition(position)`: 限制位置在地图范围内
- `isInBounds(position)`: 检查位置是否在范围内

**地图参数**:
- 可移动区域: 150米宽 × 30米高
- 网格绘制: 10米一格
- 背景色: 浅色
- 边界处理: 硬边界，实体无法超出

### 15. UI系统

**Joystick (虚拟摇杆)**:
- `onTouchStart(position)`: 在触摸位置显示摇杆
- `onTouchMove(position)`: 更新摇杆方向
- `onTouchEnd()`: 隐藏摇杆
- `getDirection()`: 获取方向向量
- `render(context)`: 渲染摇杆UI

**未实现但已规划的UI**:
- HUD: 显示金币、生命值
- UpgradePanel: 升级选择面板

### 16. 工具类

**Vector2**:
- `add(v)`: 向量加法
- `subtract(v)`: 向量减法
- `multiply(scalar)`: 标量乘法
- `normalize()`: 归一化
- `length()`: 长度
- `distance(v)`: 到另一向量的距离
- `dot(v)`: 点积
- `clone()`: 克隆

**MathUtil**:
- `lerp(a, b, t)`: 线性插值
- `clamp(value, min, max)`: 限制范围
- `randomRange(min, max)`: 随机数

## 数据流

### 游戏循环
```
Game.gameLoop()
  ├── Game.update(deltaTime)
  │     ├── Input.update()                    // 更新输入状态
  │     ├── Input.getDirection()              // 获取移动方向
  │     ├── Player.move(direction)            // 玩家移动
  │     ├── Entity.update(deltaTime)          // 更新所有实体
  │     │     ├── Weapon.update()             // 更新武器
  │     │     ├── Mount.update()              // 更新坐骑
  │     │     └── Physics.update()            // 更新物理
  │     ├── CollisionSystem.update()          // 碰撞检测与推挤
  │     ├── CombatSystem.update()             // 战斗判定
  │     ├── AISystem.update()                 // AI行为更新
  │     └── Camera.update(deltaTime)          // 更新摄像机
  └── Game.render()
        ├── Map.render()                      // 渲染地图
        ├── Entity.render()                   // 渲染实体
        │     ├── Weapon.render()             // 渲染武器
        │     ├── Mount.render()              // 渲染坐骑
        │     └── Character.render()          // 渲染角色
        ├── CombatSystem.renderDebug()        // 调试信息
        └── Input.render()                    // 渲染摇杆
```

### 移动控制流程
```
Input (摇杆/键盘) 
  → getDirection() 返回归一化方向向量
  → Player.move(direction) 
  → Physics.applyAcceleration(direction * config.acceleration) 
  → Physics.update(deltaTime) 计算速度和位置
  → Transform.translate(velocity * deltaTime)
  → Map.clampPosition() 限制在地图范围内
```

### 攻击判定流程
```
Weapon.attack() 
  → CombatSystem.createHitbox(attackData)
      attackData = { position, radius, damage, knockback, owner, maxTargets }
  → CombatSystem.update() 
      ├── 检测hitbox与entities的碰撞
      ├── 过滤同队实体
      └── 对每个命中目标调用:
            Character.takeDamage(damage, knockback)
              ├── health -= damage
              ├── Physics.applyImpulse(knockback)
              └── if (health <= 0) die(knockback)
```

### AI行为流程
```
AISystem.update(allEntities, deltaTime)
  → AI.update(owner, allEntities, deltaTime)
      ├── 定期刷新目标: findTarget()
      │     └── 查找最近的敌对目标（在追击距离内）
      ├── updateBehavior()
      │     ├── melee: 靠近→攻击
      │     ├── ranged: 保持距离→攻击
      │     └── cavalry: 冲锋→攻击
      └── 调用owner.move()和owner.attack()
```

### 骑枪冲刺流程
```
Lance.update(deltaTime)
  ├── 检查骑乘状态
  ├── 检查角色速度
  │     └── if (speedRatio >= 1.0 && state == READY)
  │           → state = CHARGING
  ├── CHARGING状态
  │     ├── 检测前方扇形区域敌人
  │     ├── performChargeHit(target)
  │     │     ├── target.takeDamage(150, knockback)
  │     │     └── owner减速至20%并清除加速度
  │     └── 检查结束条件
  │           ├── 速度 < 70%
  │           ├── 击中0.3秒后
  │           └── 达到最大目标数
  └── 冷却结束后 → state = IDLE/READY
```

## 坐标系统
- **世界坐标**: 以米为单位，原点在地图左上角
- **屏幕坐标**: 以像素为单位，原点在canvas左上角
- **转换比例**: 30像素 = 1米 (pixelsPerMeter)
- **地图尺寸**: 150米宽 × 30米高 = 4500像素 × 900像素
- **画布尺寸**: 1334像素宽 × 750像素高（手机横屏）
- **坐标转换**: Camera.worldToScreen() 和 Camera.screenToWorld()

## 配置文件详解

### game.json
```json
{
  "canvas": {
    "width": 1334,     // 画布宽度（像素）
    "height": 750      // 画布高度（像素）
  },
  "world": {
    "pixelsPerMeter": 30,  // 像素-米转换比例
    "mapWidth": 150,       // 地图宽度（米）
    "mapHeight": 30        // 地图高度（米）
  }
}
```

### character.json
```json
{
  "player": {
    "size": 2.0,           // 角色尺寸（直径，米）
    "maxSpeed": 8.64,      // 最大速度（米/秒）
    "acceleration": 60,    // 加速度（米/秒²）
    "mass": 80,            // 质量（影响碰撞推挤）
    "health": 100          // 生命值
  },
  "infantry": {
    "size": 1.5,
    "maxSpeed": 3,
    "acceleration": 15,
    "mass": 70,
    "health": 80
  },
  "cavalry": {
    "size": 1.5,
    "maxSpeed": 10,
    "acceleration": 8,       // 降低加速度，使骑兵更笨拙
    "mass": 150,
    "health": 100
  },
  "archer": {
    "size": 1.5,
    "maxSpeed": 2.5,
    "acceleration": 18,
    "mass": 60,
    "health": 60
  }
}
```

### weapon.json
```json
{
  "sword": {
    "damage": 50,            // 伤害值
    "knockback": 2,          // 击退力度
    "cooldown": 2.0,         // 冷却时间（秒）
    "attackDuration": 0.5,   // 攻击持续时间（秒）
    "maxTargets": 3,         // 最多击中目标数
    "attackRange": 2.5,      // 攻击范围（米）
    "imagePath": "res/sword.png"
  },
  "bow": {
    "damage": 30,
    "cooldown": 2.0,
    "arrowSpeed": 15,        // 箭矢速度（米/秒）
    "range": 20,             // 最大射程（米）
    "knockback": 1,
    "maxTargets": 1,
    "imagePath": "res/bow.png"
  },
  "lance": {
    "damage": 150,
    "knockback": 8,
    "cooldown": 1.0,
    "speedThreshold": 0.7,   // 速度阈值（退出冲刺）
    "maxTargets": 5,
    "selfSlowdown": 0.6,     // 自身减速系数（未使用，直接降至20%）
    "imagePath": "res/lance.png"
  }
}
```

### mount.json
```json
{
  "defaultHorse": {
    "maxSpeed": 12.96,       // 骑乘最大速度（米/秒）
    "acceleration": 30,      // 骑乘加速度（米/秒²）- 降低以体现重骑兵笨拙感
    "friction": 0.88,        // 摩擦系数（骑乘时）
    "imagePath": "res/horseHead.png",
    "offsetX": 0.4,          // 渲染偏移X（米）
    "offsetY": 0.3,          // 渲染偏移Y（米）
    "renderWidth": 1.2,      // 渲染宽度（米）
    "renderHeight": 1.2,     // 渲染高度（米）
    "bobSpeed": 8,           // 上下浮动速度
    "bobAmount": 0.15        // 上下浮动幅度
  }
}
```

## 技术约束与实现细节

### 1. 模块加载顺序
由于不使用ES6模块，所有脚本通过`<script>`标签按顺序加载：
1. 工具类（Vector2, MathUtil）
2. 配置管理器
3. 组件（Transform, Physics, Collider, Mount, AI）
4. 系统（CollisionSystem, CombatSystem, AISystem）
5. 武器（Weapon基类, Sword, Bow, Lance）
6. 实体（Entity基类, Arrow, Player, Enemy, Infantry, Cavalry, Archer）
7. UI（Joystick）
8. 核心（Input, Camera, Game）
9. 地图（BattleMap）
10. 主入口（main.js）

### 2. 资源加载
- 配置文件通过`ConfigManager`异步加载（fetch API）
- 图片资源在武器/坐骑构造时通过`new Image()`加载
- 游戏初始化等待所有配置加载完成

### 3. 碰撞检测优化
- 使用简单的O(n²)检测（当前实体数量少）
- 通过`collider.enabled`标记死亡实体不参与碰撞
- 推挤力度基于重叠深度和质量

### 4. 物理更新
- 速度限制：`velocity.length() <= maxSpeed`
- 摩擦力应用：`velocity *= friction`（每帧）
- 死亡时摩擦力=1.0（不衰减），保持击飞效果

### 5. 渲染优化
- 暂未实现视锥剔除（地图较小）
- 实体按类型分层渲染
- 使用`context.save()/restore()`保护变换状态

## 性能考虑

### 当前实现
1. **实体管理**: 简单数组遍历，通过`active`标记过滤
2. **碰撞检测**: O(n²)全量检测，适用于小规模战斗
3. **AI更新**: 每个AI独立计算目标，有定期刷新机制减少开销
4. **渲染**: 全量渲染所有active实体

### 未来优化方向
1. **对象池**: 箭矢、攻击框等频繁创建销毁的对象
2. **空间分区**: 网格划分减少碰撞检测次数
3. **视锥剔除**: 只渲染摄像机可见实体
4. **定时器优化**: AI目标刷新使用不同的随机延迟避免同帧计算

## 开发规范

### 命名约定
- **类名**: 大驼峰（PascalCase）- `Player`, `AISystem`
- **方法/属性**: 小驼峰（camelCase）- `update()`, `maxSpeed`
- **常量**: 大写+下划线 - `IDLE`, `ATTACKING`
- **私有成员**: 下划线前缀 - `_internalState`（非强制）

### 注释规范
- 类前添加职责说明
- 复杂逻辑添加注释
- 配置参数添加单位说明（米、秒等）

### 代码组织
- 一个文件一个类
- 组件模式：职责单一，可组合
- 系统模式：无状态，操作实体集合
- 配置驱动：避免硬编码数值

## 已完成功能清单

### ✅ 核心系统
- [x] 配置管理系统
- [x] 游戏主循环
- [x] 摄像机跟随
- [x] 输入系统（摇杆+键盘）
- [x] 物理系统（速度、加速度、惯性）
- [x] 碰撞系统（圆形碰撞+推挤）
- [x] 战斗系统（攻击框判定）
- [x] AI系统（三种行为模式）

### ✅ 角色系统
- [x] 玩家角色（带动画）
- [x] 敌人基类（带动画）
- [x] 步兵（近战AI）
- [x] 弓兵（远程AI）
- [x] 骑兵（冲锋AI）
- [x] 死亡击飞效果（旋转+透明+物理）

### ✅ 武器系统
- [x] 剑（旋转挥舞+拖尾）
- [x] 弓（瞄准+箭矢）
- [x] 骑枪（冲刺+高伤害）

### ✅ 其他系统
- [x] 骑乘系统
- [x] 地图系统
- [x] 虚拟摇杆

### ⏳ 待实现功能（按迭代顺序）
- [ ] 迭代10: 建筑物和自动出兵
- [ ] 迭代11: 金币掉落和升级系统
  - [ ] 敌人死亡掉落金币
  - [ ] 金币拾取动画
  - [ ] 金币计数UI
  - [ ] 升级弹窗
  - [ ] 武器解锁（弓/骑枪）

## 常见问题与解决方案

### Q: 为什么不使用ES6模块？
A: 为了简化部署，避免需要打包工具，直接用浏览器打开即可运行。

### Q: 碰撞推挤如何实现？
A: 检测重叠深度，基于质量比例分配推挤位移，质量大的推动小的。

### Q: AI如何避免所有敌人同时刷新目标？
A: 使用不同的刷新间隔（3s/8s/15s），且每个AI独立计时。

### Q: 骑枪冲刺为什么会立即结束？
A: 设计如此。击中敌人后主角速度降至20%，必然低于70%阈值，模拟冲撞的强烈反作用力。

### Q: 死亡旋转方向如何确定？
A: 根据击退向量y分量：向上击飞（y>0）逆时针，向下击飞（y<0）顺时针，符合物理直觉。
