require('zeanium-node');
zn.define(['cli'], function (cli){
    new cli.Run({}, { config: 'zn.server.config.js' });
}).exec();
