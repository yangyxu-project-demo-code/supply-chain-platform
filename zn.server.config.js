zn.define({
    host: '0.0.0.0',
    port: 9000,
    timeout: 50000,
    //clusters: true,
    catalog: '/',
    node_modules: ['zn-plugin-admin', 'zn-plugin-stock', 'zn-plugin-workflow'],
    upload: {
        root: __dirname,
        temp: '/web/www/uploads/temp',
        catalog: '/web/www/uploads/catalog'
    },
    databases: {
        'local-remote': {
            default: true,
            port: 3306,
            type: 'mysql',
            host: '127.0.0.1',
            user: 'root',
            password: 'xxx',
            database:'xxx'
        }
    }
});