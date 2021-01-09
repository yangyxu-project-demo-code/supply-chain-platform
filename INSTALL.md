# supply-chain-platform
supply-chain-platform

## Node.js安装
后台和前端都基于Node.js, 所以不管是部署开始开发首选需要安装的是[Node.js](https://nodejs.org/zh-cn/) > v5.0.0, 必须是5.0.0及以上版本。不同的平台有不同的按照方式, 根据具体情况参考下面描述。

### Window平台
windows版本按照比较简单, 直接去下载[链接](https://nodejs.org/zh-cn/)下载最新版本的node.js按照包, 一步一步按照直到结束。安装完成可以测试是否安装成功, 运行`node -v` || `npm -v` 如果有版本显示则说明按照成功, 可以进入下一步。

Tips: 为了更好的兼容性, 安装选项建议选用Linux环境。

### Linux平台
为了方便管理node.js版本, 推荐使用nvm来管理node.

[Linux 通过 nvm 安装 Node](http://www.clarkhan.com/2015/06/05/linux-install-node-with-nvm/) 详细的介绍了如何在Linux平台上通过nvm的方式来按照node.js。安装完成可以测试是否安装成功, 运行`node -v` || `npm -v` 如果有版本显示则说明按照成功, 可以进入下一步。

## 安装zeanium-node

全局安装zeanium-node

`sudo npm install zeanium-node -g`

输入`zn info`测试是否安装成功, 如果打印出zeanium-node的包信息, 恭喜你安装成功。

## 运行

运行项目分两类：

- 部署：第一次拿到源码的时候首先想到的是看一下项目运行的效果
- 开发：在读懂源代码的基础上，想做二次开发可以进入该步骤

项目架构在数据交互API级别是完全分离的, 前后端没有任何的代码依赖, 但项目代码在结构存储中是整合在一起的。所以不管是部署还是开发, 都有前端和后端之分。

对于后端需要调用`zn run`命令, 而前端代码可以放在任何http server的WebRoot目录下, 当然我们的后端也是一个http server, 你也可以不要做任何操作, 启动服务就可以访问我们的前端。

开发和部署的后端运行坏境都是一样的, 唯一的区别就是前端的环境。部署阶段前端代码已经在开发阶段打包完成，所以不再需要前端的运行环境。

### 部署
经过上面的说明, 应该很清楚的知道, 部署阶段是不需要前端的运行坏境, 所以只需要在项目根目录上运行 `npm run install.release` 自动安装后台API所需要的依赖包和环境。

部署(在项目根目录运行)：
```sh
npm run install.release
zn run
```
打开浏览器输入以下测试连接：
- API列表: http://127.0.0.1:6868/hcredwine/apis
- 管理平台: http://127.0.0.1:6868/web/www/admin.html
- 手机端: http://127.0.0.1:6868/web/www/index.html
### 开发
开发阶段需要安装前端的运行环境

首先要安装的是全局的webpack

`npm install webpack -g`

安装前后端的项目依赖包

`npm run install.dev`

启动后端服务

`zn run`

开启前端开发

`webpack --watch`
