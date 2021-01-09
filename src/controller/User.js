zn.define(function (){

    var http = require('http');
    var process = require('child_process');

    return zn.Controller('user', {
        methods: {
            pull: {
                method: 'GET',
                value: function (request, response, chain){
                    process.exec('git pull', function (error, stdout, stderr) {
                        if (error !== null) {
                            response.error(error);
                        }else {
                            response.success(stdout);
                        }
                    });
                }
            },
            commit: {
                method: 'GET',
                value: function (request, response, chain){
                    var _commit = request.getValue('commit') || 'commit';
                    process.exec('git add *', function (error, stdout, stderr) {
                        if (error !== null) {
                            response.error(error);
                        }else {
                            process.exec('git commit -m "' + _commit + '"', function (error, stdout, stderr){
                                if (error !== null) {
                                    response.error(error);
                                }else {
                                    process.exec('git push', function (error, stdout, stderr){
                                        if (error !== null) {
                                            response.error(error);
                                        }else {
                                            response.success(stdout);
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            },
            login: {
                method: 'GET',
                argv: {
                    name: null,
                    password: null
                },
                value: function (request, response, chain){
                    console.log('login......');
                    this.collection('User').select({
                        fields: 'id, name, password',
                        where: {
                            name: request.getValue('name'),
                            password: request.getValue('password')
                        }
                    }).then(function (data){
                        if(data && data.length){
                            response.success('登录成功');
                        }else {
                            response.error('用户名或者密码错误');
                        }
                    });
                }
            },
            testUrl: {
                method: 'GET',
                value: function (request, response, chain){
                    http.get("http://"+zn._request.headers.host + '/oa/user/a');
                    response.success(zn.SERVER_URL);
                }
            }
        }
    });

});
