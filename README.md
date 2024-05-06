# 介绍

Context Cat 是一款提供聚合功能的 obsidian 插件。它可以根据你设定好的标题进行指定范围的抓取内容，并聚合到当前你输入指令的页面。

# 安装和使用

## 使用

### 聚合标题

打开一个空白页面，在页面上以一级标题的形式写下你想要聚合的二级标题，（当你没有输入一级标题的时候，会以你当前文件的文件名作为一级标题）例如：
![image](https://github.com/yiyang-fairy/obsidian-context/assets/51814167/2b99be8c-42ee-49d8-909d-c6340af21a3c)
接下来，有两个方法聚合标题

#### 方法一：

点击左侧猫猫头图标即可聚合你想要的二级标题

![image](https://github.com/yiyang-fairy/obsidian-context/assets/51814167/ed44faad-280c-4e79-a61e-33a223a972c1)

#### 方法二：

按 `Ctrl+P`（或 `Cmd+P` 在 macOS 上）打开命令面板，并输入 `Context Cat` 按下回车即可
![image](https://github.com/yiyang-fairy/obsidian-context/assets/51814167/1e213a32-844b-489e-be99-7fe442291c85)

然后你就能看到所有你想要聚合标题和内容了：
![image](https://github.com/yiyang-fairy/obsidian-context/assets/51814167/10701f28-31ca-49bf-bc10-cca7d0f5b218)
在这里还展示了对应的文章标题，方便你回到原文查看

### 聚合 Tag

首先在当前页面顶部输入 `---` 调出文档属性，

在属性栏添加 `key` 为 _catTags_， `value` 为你想要聚合的 tag，如果你想聚合多个 tag，可以将 `catTags` 属性类型设为 _list_ ，也可以设置 `catTags` 属性类型为 _text_， 然后使用 _&_ 连接他们，例如：
![image](https://github.com/yiyang-fairy/obsidian-context/assets/51814167/5b176896-f6e3-4f5b-b784-263deb44eb11)

接下来，同聚合标题的方法一样，点击左侧 _猫猫头_ 或者打开命令面板输入 _Context Cat_ 来进行聚合，结果示例：
![image](https://github.com/yiyang-fairy/obsidian-context/assets/51814167/2c6afdc7-c8a7-49bf-adae-c91e008650c2)

## 注意

聚合标题与聚合 tag 只能二者选其一，并且聚合 tag 的优先级高于聚合标题

# 设置

## 设置文件夹筛选范围

点击 obsidian 的设置，再点击第三方插件下的 _Context Cat_，可以看到：
![image](https://github.com/yiyang-fairy/obsidian-context/assets/51814167/0529426e-1e82-4cf0-bcbf-0c0078807370)

在这里，你可以对文件的筛选范围做限定，并且为你提供了两种筛选文件夹的方式：

### 以文件夹选择的方式

点击下拉框， 可以看到你的所有文件夹，选择你想要筛选的文件夹，之后的筛选范围则只会是你筛选的文件夹

### 以 glob 模式匹配

在右侧输入框中输入 glob 模式的文件路径，例如输入 `/**/!(assets)/**` ，则后续对文件的筛选会跳过 assets 文件夹；输入 `/diaries/\*_/_ 则只在根目录下的 diaries 文件夹中进行筛选

## 文档属性

在页面顶部输入 `---` 调出文档属性，对于我们 `Context Cat` 插件，我们提供了一些特殊的字段来增加额外的功能。
例如上文中用到过的 `catTags` 字段用来聚合 tag，除此之外，还有 `catAutoUpdate` 等字段，接下来一一介绍：

### catTags

`catTags` 可以是 list 类型或者是 text 类型，表示的是你想要聚合的 `tag` 名称，当类型为 list 时，可直接添加多个；当类型为 text 时，可以用 `&` 连接来获取多个 tag

### catAutoUpdate

每次进入页面都需要使用命令或点击猫猫头来实现聚合，这样是否还是不够方便？

只要在文档属性里设置 `catAutoUpdate` 为 `true` 即可*自动更新*

该字段建议将类型设置为 `checkbox` 类型或者 `text` 类型，它的值为 true 或 false，未设置时默认为 false 。表示的是在打开带有 `catAutoUpdate` 文档属性的文件时，是否自动执行聚合功能
