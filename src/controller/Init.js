zn.define(function (){

    var node_xlsx = require('xlsx');

    var STATE = {
        GOING: 1,
        PASSED: 2,
        ENDED: -1,
        CANCELED: -2,
        P_GOING: 100,
        P_PASS: 101,
        P_DENY: -101
    }

    return zn.Controller('init', {
        methods: {
            counts: {
                method: 'GET/POST',
                value: function (request, response, chain){
                    var _value = {};
                    this.beginTransaction()
                        .query("select workflow count", function (sql, data){
                            return zn.sql.select({
                                table: 'zn_plugin_workflow_instance',
                                fields: 'count(id) as count',
                                where: [
                                    'parent_id=0',
                                    ' and zn_create_user=' + (request.getSessionValueByKey("id")||'-1')
                                ]
                            }) + zn.sql.select({
                                table: 'zn_plugin_workflow_instance',
                                fields: 'count(id) as count',
                                where: [
                                    'parent_id=0',
                                    ' and state=' + STATE.GOING,
                                    ' and ' + zn.sql.rights()
                                ]
                            }) + zn.sql.select({
                                table: 'zn_plugin_workflow_instance',
                                fields: 'count(id) as count',
                                where: [
                                    'parent_id=0',
                                    " and locate(',"+request.getSessionValueByKey("id")+",', do_users)<>0"
                                ]
                            }) + zn.sql.select({
                                table: 'zn_plugin_workflow_instance',
                                fields: "count(id) as count",
                                where: [
                                    'parent_id=0 and index_id=10',
                                    ' and ' + zn.sql.observeRights()
                                ]
                            }) + zn.sql.select({
                                table: 'zn_plugin_workflow_instance',
                                fields: "count(id) as count",
                                where: [
                                    'parent_id=0 and index_id=11',
                                    ' and ' + zn.sql.observeRights()
                                ]
                            }) + zn.sql.select({
                                table: 'zn_plugin_workflow_instance',
                                fields: "count(id) as count",
                                where: [
                                    'parent_id=0 and index_id=12',
                                    ' and ' + zn.sql.observeRights()
                                ]
                            }) + zn.sql.select({
                                table: 'zn_plugin_workflow_instance',
                                fields: "count(id) as count",
                                where: [
                                    'parent_id=0 and index_id=14',
                                    ' and ' + zn.sql.observeRights()
                                ]
                            }) + "select warehouse_id, zn_plugin_stock_convert_warehouse(warehouse_id) as warehouse_id_convert, sum(count) as count from zn_plugin_stock_product_stock group by warehouse_id;";
                        }, function (err, data){
                            if(err){
                                response.error(err);
                            }else {
                                _value.applys = data[0][0].count;
                                _value.todos = data[1][0].count;
                                _value.dones = data[2][0].count;
                                _value.caigous = data[3][0].count;
                                _value.xiaoshous = data[4][0].count;
                                _value.shouhous = data[5][0].count;
                                _value.tiaobos = data[6][0].count;
                                _value.warehouses = data[7];
                                response.success(_value);
                            }
                        })
                        .commit();
                }
            }
        }
    });

});
